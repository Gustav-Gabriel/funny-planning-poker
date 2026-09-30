import type { Server, Socket } from "socket.io";
import { customAlphabet } from "nanoid";
import { toClientSnapshot } from "../room-snapshot";
import {
  castVote,
  createRoom,
  getRoom,
  joinRoom,
  rejoinRoom,
  resetVotes,
  revealVotes,
  setRoast,
  setStory,
  touchRoom,
} from "../room-store";
import type { Player, ReactionShowEvent, Story } from "../types";
import {
  isValidVoteValue,
  validateCreateRoomInput,
  validateJoinNameAvatar,
  validatePlayerUpdate,
  validateReactionInput,
  validateRoastInput,
  validateStoryInput,
} from "../validation";

const generateReactionId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  10,
);

type SuccessAck = { ok: true };
type ErrorAck = { ok: false; error: string };
type MutationAck = SuccessAck | ErrorAck;
type Ack<T> = (result: T | ErrorAck) => void;

type JoinPayload = {
  roomCode: string;
  playerId?: string;
  playerToken?: string;
  name?: string;
  avatar?: Player["avatar"];
};

type HostPayload = {
  roomCode?: string;
  hostToken: string;
};

function roomIdentity(
  socket: Socket,
  requestedCode?: string,
): { roomCode: string; playerId: string } | ErrorAck {
  const roomCode = socket.data.roomCode;
  const playerId = socket.data.playerId;
  if (
    typeof roomCode !== "string" ||
    typeof playerId !== "string" ||
    (requestedCode && requestedCode.toUpperCase() !== roomCode)
  ) {
    return { ok: false, error: "Not in this room" };
  }
  return { roomCode, playerId };
}

async function broadcastRoom(io: Server, roomCode: string): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  const sockets = await io.in(room.code).fetchSockets();
  for (const viewer of sockets) {
    const viewerId =
      typeof viewer.data.playerId === "string" ? viewer.data.playerId : "";
    viewer.emit("room:state", toClientSnapshot(room, viewerId));
  }
}

async function finishMutation(
  io: Server,
  roomCode: string,
  result: MutationAck,
  ack: Ack<SuccessAck>,
): Promise<boolean> {
  if (!result.ok) {
    ack(result);
    return false;
  }
  await broadcastRoom(io, roomCode);
  ack(result);
  return true;
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    socket.on(
      "room:create",
      async (
        input: unknown,
        ack: Ack<{
          room: ReturnType<typeof toClientSnapshot>;
          player: Player;
          hostToken: string;
          playerToken: string;
        }> = () => undefined,
      ) => {
        const validated = validateCreateRoomInput(input);
        if ("error" in validated) {
          ack({ ok: false, error: validated.error });
          return;
        }

        const created = createRoom({
          deck: validated.deck,
          hostName: validated.hostName,
          hostAvatar: validated.hostAvatar,
        });
        await socket.join(created.room.code);
        socket.data.roomCode = created.room.code;
        socket.data.playerId = created.player.id;
        ack({
          room: toClientSnapshot(created.room, created.player.id),
          player: created.player,
          hostToken: created.hostToken,
          playerToken: created.playerToken,
        });
      },
    );

    socket.on(
      "room:join",
      async (
        input: JoinPayload,
        ack: Ack<{
          room: ReturnType<typeof toClientSnapshot>;
          player: Player;
          playerToken: string;
        }> = () => undefined,
      ) => {
        if (!input || typeof input.roomCode !== "string") {
          ack({ ok: false, error: "Room code is required" });
          return;
        }

        const roomCode = input.roomCode.toUpperCase();
        let result:
          | {
              room: NonNullable<ReturnType<typeof getRoom>>;
              player: Player;
              playerToken: string;
            }
          | ErrorAck;

        if (input.playerId) {
          const rejoined = rejoinRoom(
            roomCode,
            input.playerId,
            input.playerToken ?? "",
          );
          result = rejoined.ok
            ? {
                room: rejoined.room,
                player: rejoined.player,
                playerToken: input.playerToken ?? "",
              }
            : { ok: false, error: rejoined.error };
        } else {
          const validated = validateJoinNameAvatar(input.name, input.avatar);
          if ("error" in validated) {
            result = { ok: false, error: validated.error };
          } else {
            const joined = joinRoom(roomCode, validated);
            result =
              "error" in joined
                ? { ok: false, error: joined.error }
                : {
                    room: joined.room,
                    player: joined.player,
                    playerToken: joined.playerToken,
                  };
          }
        }

        if ("ok" in result) {
          ack(result);
          return;
        }

        await socket.join(result.room.code);
        socket.data.roomCode = result.room.code;
        socket.data.playerId = result.player.id;
        await broadcastRoom(io, result.room.code);
        ack({
          room: toClientSnapshot(result.room, result.player.id),
          player: result.player,
          playerToken: result.playerToken,
        });
      },
    );

    socket.on(
      "vote:cast",
      async (
        input: { roomCode?: string; value: string },
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }

        const room = getRoom(identity.roomCode);
        if (!room) {
          ack({ ok: false, error: "Room not found" });
          return;
        }
        if (!isValidVoteValue(room.deck, input.value)) {
          ack({ ok: false, error: "Invalid vote value" });
          return;
        }

        await finishMutation(
          io,
          identity.roomCode,
          castVote(identity.roomCode, identity.playerId, input.value),
          ack,
        );
      },
    );

    socket.on(
      "vote:reveal",
      async (
        input: HostPayload,
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }
        await finishMutation(
          io,
          identity.roomCode,
          revealVotes(identity.roomCode, input.hostToken),
          ack,
        );
      },
    );

    socket.on(
      "vote:reset",
      async (
        input: HostPayload,
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }
        await finishMutation(
          io,
          identity.roomCode,
          resetVotes(identity.roomCode, input.hostToken),
          ack,
        );
      },
    );

    socket.on(
      "story:set",
      async (
        input: HostPayload & { story: Story | null },
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }

        let story: Story | null = null;
        if (input.story !== null && input.story !== undefined) {
          const validated = validateStoryInput(input.story);
          if ("error" in validated) {
            ack({ ok: false, error: validated.error });
            return;
          }
          story = validated;
        }

        await finishMutation(
          io,
          identity.roomCode,
          setStory(identity.roomCode, input.hostToken, story),
          ack,
        );
      },
    );

    socket.on(
      "player:update",
      async (
        input: {
          roomCode?: string;
          name?: string;
          avatar?: Player["avatar"];
        },
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }
        const room = getRoom(identity.roomCode);
        const player = room?.players.get(identity.playerId);
        if (!room || !player) {
          ack({ ok: false, error: "Player not found" });
          return;
        }

        const validated = validatePlayerUpdate(input.name, input.avatar);
        if ("error" in validated) {
          ack({ ok: false, error: validated.error });
          return;
        }

        if (validated.name !== undefined) player.name = validated.name;
        if (validated.avatar !== undefined) player.avatar = validated.avatar;
        touchRoom(room.code);
        await broadcastRoom(io, room.code);
        ack({ ok: true });
      },
    );

    socket.on(
      "reaction:send",
      (
        input: {
          roomCode?: string;
          emoji?: unknown;
          targetPlayerId?: unknown;
        },
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input?.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }

        const room = getRoom(identity.roomCode);
        const from = room?.players.get(identity.playerId);
        if (!room || !from) {
          ack({ ok: false, error: "Player not found" });
          return;
        }

        const validated = validateReactionInput(
          input?.emoji,
          input?.targetPlayerId,
        );
        if ("error" in validated) {
          ack({ ok: false, error: validated.error });
          return;
        }

        if (
          validated.targetPlayerId &&
          !room.players.has(validated.targetPlayerId)
        ) {
          ack({ ok: false, error: "Reaction target not found" });
          return;
        }

        const payload: ReactionShowEvent = {
          id: generateReactionId(),
          fromPlayerId: from.id,
          fromName: from.name,
          targetPlayerId: validated.targetPlayerId,
          emoji: validated.emoji,
          createdAt: Date.now(),
        };
        touchRoom(room.code);
        io.to(room.code).emit("reaction:show", payload);
        ack({ ok: true });
      },
    );

    socket.on(
      "roast:set",
      async (
        input: { roomCode?: string; roast?: unknown },
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input?.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }

        const validated = validateRoastInput(input?.roast);
        if ("error" in validated) {
          ack({ ok: false, error: validated.error });
          return;
        }

        await finishMutation(
          io,
          identity.roomCode,
          setRoast(identity.roomCode, identity.playerId, validated.roast),
          ack,
        );
      },
    );

    socket.on(
      "room:leave",
      async (
        input: { roomCode?: string } = {},
        ack: Ack<SuccessAck> = () => undefined,
      ) => {
        const identity = roomIdentity(socket, input.roomCode);
        if ("ok" in identity) {
          ack(identity);
          return;
        }
        const room = getRoom(identity.roomCode);
        if (!room || !room.players.delete(identity.playerId)) {
          ack({ ok: false, error: "Player not found" });
          return;
        }
        room.playerTokens.delete(identity.playerId);
        touchRoom(room.code);
        await socket.leave(room.code);
        socket.data.roomCode = undefined;
        socket.data.playerId = undefined;
        ack({ ok: true });
        await broadcastRoom(io, room.code);
      },
    );

    socket.on("disconnect", () => {
      const identity = roomIdentity(socket);
      if ("ok" in identity) return;
      const room = getRoom(identity.roomCode);
      const player = room?.players.get(identity.playerId);
      if (!room || !player) return;

      player.connected = false;
      touchRoom(room.code);
      void broadcastRoom(io, room.code).catch((error: unknown) => {
        console.error("Failed to broadcast disconnect state", error);
      });
    });
  });
}
