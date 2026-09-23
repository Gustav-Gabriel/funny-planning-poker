import { describe, expect, it } from "vitest";
import {
  computeVoteStats,
  normalizeRoomCode,
  translateError,
} from "./room-ui";
import type { ClientPlayer } from "./types";

describe("normalizeRoomCode", () => {
  it("uppercases and strips spaces", () => {
    expect(normalizeRoomCode("  ab 12  ")).toBe("AB12");
  });
});

describe("computeVoteStats", () => {
  it("computes average and mode for numeric votes", () => {
    const players = [
      { vote: "5" },
      { vote: "5" },
      { vote: "8" },
      { vote: null },
    ] as ClientPlayer[];
    expect(computeVoteStats(players)).toEqual({
      votesCast: 3,
      average: 6,
      mode: "5",
    });
  });
});

describe("translateError", () => {
  it("maps known English errors to Portuguese", () => {
    expect(translateError("Room not found")).toBe("Sala não encontrada.");
    expect(translateError("Story title is required")).toBe(
      "Informe o título da história.",
    );
  });

  it("returns a generic message when empty", () => {
    expect(translateError(undefined)).toBe("Algo deu errado. Tente novamente.");
  });
});
