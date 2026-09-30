import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Server } from "socket.io";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import { assertHost } from "../host-auth";
import { _resetStoreForTests, createRoom, getRoom } from "../room-store";
import { registerSocketHandlers } from "./handlers";

type Ack = Record<string, unknown>;

let httpServer: HttpServer | undefined;
let io: Server | undefined;
let clients: ClientSocket[] = [];

beforeEach(() => {
  _resetStoreForTests();
});

afterEach(async () => {
  for (const client of clients) client.disconnect();
  clients = [];
  await io?.close();
  io = undefined;
  httpServer = undefined;
});

async function startHarness(): Promise<ClientSocket> {
  httpServer = createServer();
  io = new Server(httpServer);
  registerSocketHandlers(io);
  await new Promise<void>((resolve) => httpServer!.listen(0, resolve));

  const port = (httpServer.address() as AddressInfo).port;
  const client = createClient(`http://127.0.0.1:${port}`, {
    transports: ["websocket"],
  });
  clients.push(client);
  await once(client, "connect");
  return client;
}

async function addClient(): Promise<ClientSocket> {
  const address = httpServer?.address() as AddressInfo;
  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
  });
  clients.push(client);
  await once(client, "connect");
  return client;
}

function once<T = unknown>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

function onceWhere<T>(
  socket: ClientSocket,
  event: string,
  predicate: (value: T) => boolean,
): Promise<T> {
  return new Promise((resolve) => {
    const listener = (value: T) => {
      if (!predicate(value)) return;
      socket.off(event, listener);
      resolve(value);
    };
    socket.on(event, listener);
  });
}

function emitAck(
  socket: ClientSocket,
  event: string,
  payload?: unknown,
): Promise<Ack> {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

const roomStoreInput = {
  deck: "fibonacci" as const,
  hostName: "Ana",
  hostAvatar: { type: "emoji" as const, value: "🎯" },
};

const roomCreatePayload = {
  deck: "fibonacci" as const,
  hostName: "Ana",
  hostAvatar: { type: "emoji" as const, value: "🎯" },
};

describe("assertHost", () => {
  it("authenticates only the room host token", () => {
    const created = createRoom(roomStoreInput);

    expect(assertHost(created.room.code, created.hostToken)).toBe(true);
    expect(assertHost(created.room.code, "wrong-token")).toBe(false);
    expect(assertHost("MISSING", created.hostToken)).toBe(false);
  });
});

describe("registerSocketHandlers", () => {
  it("creates, joins, and broadcasts hidden votes per viewer", async () => {
    const host = await startHarness();
    const created = await emitAck(host, "room:create", roomCreatePayload);
    const room = created.room as { code: string };
    const hostPlayer = created.player as { id: string };

    const guest = await addClient();
    const joined = await emitAck(guest, "room:join", {
      roomCode: room.code,
      name: "Bob",
      avatar: { type: "emoji", value: "🐸" },
    });
    const guestPlayer = joined.player as { id: string };

    await emitAck(host, "vote:cast", { value: "5" });
    type RoomState = {
      players: Array<{ id: string; vote: string | null; hasVoted: boolean }>;
    };
    const hasGuestVote = (state: RoomState) =>
      state.players.find((player) => player.id === guestPlayer.id)?.hasVoted ===
      true;
    const hostStatePromise = onceWhere(host, "room:state", hasGuestVote);
    const guestStatePromise = onceWhere(guest, "room:state", hasGuestVote);
    await emitAck(guest, "vote:cast", { value: "8" });

    const [hostState, guestState] = await Promise.all([
      hostStatePromise,
      guestStatePromise,
    ]);
    expect(hostState.players.find((p) => p.id === hostPlayer.id)?.vote).toBe("5");
    expect(hostState.players.find((p) => p.id === guestPlayer.id)).toMatchObject({
      vote: null,
      hasVoted: true,
    });
    expect(guestState.players.find((p) => p.id === guestPlayer.id)?.vote).toBe(
      "8",
    );
    expect(guestState.players.find((p) => p.id === hostPlayer.id)?.vote).toBeNull();
  });

  it("authorizes host reveal without AI events", async () => {
    const host = await startHarness();
    const created = await emitAck(host, "room:create", roomCreatePayload);
    const room = created.room as { code: string };
    const hostToken = created.hostToken as string;

    expect(
      await emitAck(host, "vote:reveal", {
        roomCode: room.code,
        hostToken: "wrong",
      }),
    ).toMatchObject({ ok: false, error: "Unauthorized" });

    expect(
      await emitAck(host, "vote:reveal", { roomCode: room.code, hostToken }),
    ).toEqual({ ok: true });
    expect(getRoom(room.code)?.revealed).toBe(true);
  });

  it("sets free-text story for host", async () => {
    const host = await startHarness();
    const created = await emitAck(host, "room:create", roomCreatePayload);
    const room = created.room as { code: string };
    const hostToken = created.hostToken as string;

    expect(
      await emitAck(host, "story:set", {
        roomCode: room.code,
        hostToken,
        story: { title: "Login", description: "Magia" },
      }),
    ).toEqual({ ok: true });
    expect(getRoom(room.code)?.story).toEqual({
      title: "Login",
      description: "Magia",
    });
  });

  it("updates players and tracks leave and disconnect presence", async () => {
    const host = await startHarness();
    const created = await emitAck(host, "room:create", roomCreatePayload);
    const room = created.room as { code: string };

    const guest = await addClient();
    const joined = await emitAck(guest, "room:join", {
      roomCode: room.code,
      name: "Bob",
      avatar: { type: "emoji", value: "🐸" },
    });
    const guestPlayer = joined.player as { id: string };

    expect(
      await emitAck(guest, "player:update", {
        roomCode: room.code,
        name: "Bobby",
      }),
    ).toEqual({ ok: true });
    expect(getRoom(room.code)?.players.get(guestPlayer.id)?.name).toBe("Bobby");

    const leftState = onceWhere(
      host,
      "room:state",
      (state: { players: Array<{ id: string }> }) =>
        !state.players.some((player) => player.id === guestPlayer.id),
    );
    expect(await emitAck(guest, "room:leave", { roomCode: room.code })).toEqual({
      ok: true,
    });
    await leftState;
    expect(getRoom(room.code)?.players.has(guestPlayer.id)).toBe(false);
  });
});
