import { describe, expect, it } from "vitest";
import {
  clampString,
  isValidAvatar,
  isValidVoteValue,
  validateCreateRoomInput,
  validateJoinNameAvatar,
  validatePlayerUpdate,
  validateStoryInput,
} from "./validation";

const validPublic = {
  name: "Sprint 12",
  deck: "fibonacci" as const,
  hostName: "Ana",
  hostAvatar: { type: "emoji" as const, value: "🎯" },
};

describe("clampString", () => {
  it("trims and rejects empty or too-long strings", () => {
    expect(clampString("  hi  ", 10)).toBe("hi");
    expect(clampString("   ", 10)).toBeNull();
    expect(clampString("a".repeat(11), 10)).toBeNull();
    expect(clampString(42, 10)).toBeNull();
  });
});

describe("isValidAvatar", () => {
  it("accepts short emoji avatars", () => {
    expect(isValidAvatar({ type: "emoji", value: "🃏" })).toBe(true);
    expect(isValidAvatar({ type: "emoji", value: "a".repeat(17) })).toBe(false);
    expect(isValidAvatar({ type: "emoji", value: "" })).toBe(false);
  });

  it("only accepts https KLIPY URLs for gif avatars", () => {
    expect(
      isValidAvatar({
        type: "gif",
        value: "https://media.klipy.com/x.gif",
      }),
    ).toBe(true);
    expect(
      isValidAvatar({
        type: "gif",
        value: "http://media.klipy.com/x.gif",
      }),
    ).toBe(false);
    expect(
      isValidAvatar({
        type: "gif",
        value: "https://evil.example/x.gif",
      }),
    ).toBe(false);
  });
});

describe("isValidVoteValue", () => {
  it("accepts deck cards only", () => {
    expect(isValidVoteValue("fibonacci", "5")).toBe(true);
    expect(isValidVoteValue("fibonacci", "99")).toBe(false);
    expect(isValidVoteValue("tshirt", "M")).toBe(true);
  });
});

describe("validateCreateRoomInput", () => {
  it("accepts public create fields", () => {
    expect(validateCreateRoomInput(validPublic)).toEqual(validPublic);
  });

  it("rejects missing name or invalid deck", () => {
    expect(validateCreateRoomInput({ ...validPublic, name: "" })).toEqual({
      error: "Room name is required",
    });
    expect(validateCreateRoomInput({ ...validPublic, deck: "nope" })).toEqual({
      error: "Invalid deck",
    });
  });
});

describe("validateStoryInput", () => {
  it("requires title and optional description", () => {
    expect(validateStoryInput({ title: "Login", description: "  " })).toEqual({
      title: "Login",
      description: "",
    });
    expect(validateStoryInput({ title: "", description: "x" })).toEqual({
      error: "Story title is required",
    });
  });
});

describe("validateJoinNameAvatar", () => {
  it("requires name and avatar", () => {
    expect(
      validateJoinNameAvatar("Bob", { type: "emoji", value: "🐸" }),
    ).toEqual({ name: "Bob", avatar: { type: "emoji", value: "🐸" } });
    expect(validateJoinNameAvatar("", { type: "emoji", value: "🐸" })).toEqual({
      error: "Name and avatar are required",
    });
  });
});

describe("validatePlayerUpdate", () => {
  it("validates optional name and avatar", () => {
    expect(validatePlayerUpdate("Ana", undefined)).toEqual({ name: "Ana" });
    expect(validatePlayerUpdate(undefined, { type: "emoji", value: "🎯" })).toEqual({
      avatar: { type: "emoji", value: "🎯" },
    });
    expect(validatePlayerUpdate("", undefined)).toEqual({ error: "Invalid name" });
  });
});
