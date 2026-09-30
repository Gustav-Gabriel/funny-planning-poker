import { randomBytes } from "node:crypto";
import { customAlphabet } from "nanoid";
import type { DeckType, Player, RoomSecrets, RoomState, Story } from "./types";

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);
const generatePlayerId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  12,
);

const MAX_PLAYERS = 20;
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

type StoredRoom = RoomState & { secrets: RoomSecrets };

type RoomsGlobal = typeof globalThis & {
  __funnyPlanningPokerRooms?: Map<string, StoredRoom>;
};

function getRoomsMap(): Map<string, StoredRoom> {
  const g = globalThis as RoomsGlobal;
  if (!g.__funnyPlanningPokerRooms) {
    g.__funnyPlanningPokerRooms = new Map<string, StoredRoom>();
  }
  return g.__funnyPlanningPokerRooms;
}

const rooms = getRoomsMap();

export function _resetStoreForTests(): void {
  rooms.clear();
}

export function getRoom(code: string): StoredRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function assertHost(room: StoredRoom, hostToken: string): boolean {
  return room.secrets.hostToken === hostToken;
}

export function touchRoom(code: string, now: number = Date.now()): void {
  const room = getRoom(code);
  if (room) {
    room.lastActivityAt = now;
  }
}

export function purgeExpired(now: number = Date.now()): void {
  for (const [code, room] of rooms) {
    if (now - room.lastActivityAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

export type CreateRoomInput = {
  deck: DeckType;
  hostName: string;
  hostAvatar: Player["avatar"];
};

function generatePlayerToken(): string {
  return randomBytes(24).toString("hex");
}

export function createRoom(input: CreateRoomInput): {
  room: StoredRoom;
  hostToken: string;
  player: Player;
  playerToken: string;
} {
  purgeExpired();

  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const hostToken = randomBytes(32).toString("hex");
  const playerId = generatePlayerId();
  const playerToken = generatePlayerToken();
  const now = Date.now();

  const player: Player = {
    id: playerId,
    name: input.hostName,
    avatar: input.hostAvatar,
    isHost: true,
    connected: true,
    vote: null,
    roast: null,
  };

  const room: StoredRoom = {
    code,
    deck: input.deck,
    hostId: playerId,
    players: new Map([[playerId, player]]),
    playerTokens: new Map([[playerId, playerToken]]),
    story: null,
    revealed: false,
    lastActivityAt: now,
    secrets: { hostToken },
  };

  rooms.set(code, room);

  return { room, hostToken, player, playerToken };
}

export type JoinRoomInput = {
  name: string;
  avatar: Player["avatar"];
};

export function joinRoom(
  code: string,
  input: JoinRoomInput,
): { room: StoredRoom; player: Player; playerToken: string } | { error: string } {
  purgeExpired();

  const room = getRoom(code);
  if (!room) {
    return { error: "Room not found" };
  }

  if (room.players.size >= MAX_PLAYERS) {
    return { error: "Room is full" };
  }

  const playerId = generatePlayerId();
  const playerToken = generatePlayerToken();
  const player: Player = {
    id: playerId,
    name: input.name,
    avatar: input.avatar,
    isHost: false,
    connected: true,
    vote: null,
    roast: null,
  };

  room.players.set(playerId, player);
  room.playerTokens.set(playerId, playerToken);
  touchRoom(room.code);

  return { room, player, playerToken };
}

export function rejoinRoom(
  code: string,
  playerId: string,
  playerToken: string,
): { ok: true; room: StoredRoom; player: Player } | { ok: false; error: string } {
  purgeExpired();

  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  const player = room.players.get(playerId);
  if (!player) {
    return { ok: false, error: "Player not found" };
  }

  const expectedToken = room.playerTokens.get(playerId);
  if (!expectedToken || !playerToken || expectedToken !== playerToken) {
    return { ok: false, error: "Invalid rejoin token" };
  }

  player.connected = true;
  touchRoom(room.code);

  return { ok: true, room, player };
}

export function castVote(
  code: string,
  playerId: string,
  value: string,
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  const player = room.players.get(playerId);
  if (!player) {
    return { ok: false, error: "Player not found" };
  }

  if (room.revealed) {
    return { ok: false, error: "Votes already revealed" };
  }

  player.vote = value;
  touchRoom(room.code);

  return { ok: true };
}

export function revealVotes(
  code: string,
  hostToken: string,
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (!assertHost(room, hostToken)) {
    return { ok: false, error: "Unauthorized" };
  }

  room.revealed = true;
  touchRoom(room.code);

  return { ok: true };
}

export function resetVotes(
  code: string,
  hostToken: string,
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (!assertHost(room, hostToken)) {
    return { ok: false, error: "Unauthorized" };
  }

  room.revealed = false;
  for (const player of room.players.values()) {
    player.vote = null;
    player.roast = null;
  }
  room.story = null;
  touchRoom(room.code);

  return { ok: true };
}

export function setRoast(
  code: string,
  playerId: string,
  roast: string | null,
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  const player = room.players.get(playerId);
  if (!player) {
    return { ok: false, error: "Player not found" };
  }

  player.roast = roast;
  touchRoom(room.code);

  return { ok: true };
}

export function setStory(
  code: string,
  hostToken: string,
  story: Story | null,
): { ok: true } | { ok: false; error: string } {
  const room = getRoom(code);
  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (!assertHost(room, hostToken)) {
    return { ok: false, error: "Unauthorized" };
  }

  room.story = story;
  touchRoom(room.code);

  return { ok: true };
}
