import { cardsFor } from "./decks";
import type { DeckType, Player, Story } from "./types";

export const MAX_NAME_LENGTH = 80;
export const MAX_EMOJI_LENGTH = 16;
export const MAX_STORY_TITLE_LENGTH = 200;
export const MAX_STORY_DESCRIPTION_LENGTH = 4000;

const KLIPY_HOSTS = new Set(["klipy.com", "www.klipy.com", "media.klipy.com", "cdn.klipy.com"]);

export function clampString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export function isValidDeck(value: unknown): value is DeckType {
  return value === "fibonacci" || value === "tshirt";
}

function isSafeKlipyUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return KLIPY_HOSTS.has(url.hostname) || url.hostname.endsWith(".klipy.com");
}

export function isValidAvatar(value: unknown): value is Player["avatar"] {
  if (!value || typeof value !== "object") return false;
  const avatar = value as { type?: unknown; value?: unknown };

  if (avatar.type === "emoji") {
    return (
      typeof avatar.value === "string" &&
      avatar.value.trim().length > 0 &&
      avatar.value.length <= MAX_EMOJI_LENGTH
    );
  }

  if (avatar.type === "gif") {
    return typeof avatar.value === "string" && isSafeKlipyUrl(avatar.value);
  }

  return false;
}

export function isValidVoteValue(deck: DeckType, value: unknown): value is string {
  return typeof value === "string" && cardsFor(deck).includes(value);
}

export type ValidatedCreateRoomPublic = {
  deck: DeckType;
  hostName: string;
  hostAvatar: Player["avatar"];
};

export function validateCreateRoomInput(
  input: unknown,
): ValidatedCreateRoomPublic | { error: string } {
  if (!input || typeof input !== "object") {
    return { error: "Invalid room payload" };
  }
  const value = input as Record<string, unknown>;

  if (!isValidDeck(value.deck)) return { error: "Invalid deck" };

  const hostName = clampString(value.hostName, MAX_NAME_LENGTH);
  if (!hostName) return { error: "Host name is required" };

  if (!isValidAvatar(value.hostAvatar)) {
    return { error: "Invalid host avatar" };
  }

  return {
    deck: value.deck as DeckType,
    hostName,
    hostAvatar: value.hostAvatar as Player["avatar"],
  };
}

export function validateStoryInput(
  input: unknown,
): Story | { error: string } {
  if (!input || typeof input !== "object") {
    return { error: "Invalid story payload" };
  }
  const value = input as Record<string, unknown>;

  const title = clampString(value.title, MAX_STORY_TITLE_LENGTH);
  if (!title) return { error: "Story title is required" };

  let description = "";
  if (value.description !== undefined && value.description !== null) {
    if (typeof value.description !== "string") {
      return { error: "Invalid story description" };
    }
    const trimmed = value.description.trim();
    if (trimmed.length > MAX_STORY_DESCRIPTION_LENGTH) {
      return { error: "Story description is too long" };
    }
    description = trimmed;
  }

  return { title, description };
}

export type ValidJoinNameAvatar = { name: string; avatar: Player["avatar"] };

export function validateJoinNameAvatar(
  name: unknown,
  avatar: unknown,
): ValidJoinNameAvatar | { error: string } {
  const cleanName = clampString(name, MAX_NAME_LENGTH);
  if (!cleanName) return { error: "Name and avatar are required" };

  if (!isValidAvatar(avatar)) return { error: "Name and avatar are required" };

  return { name: cleanName, avatar };
}

export function validatePlayerUpdate(
  name: unknown,
  avatar: unknown,
): { name?: string; avatar?: Player["avatar"] } | { error: string } {
  const result: { name?: string; avatar?: Player["avatar"] } = {};

  if (name !== undefined) {
    const cleanName = clampString(name, MAX_NAME_LENGTH);
    if (!cleanName) return { error: "Invalid name" };
    result.name = cleanName;
  }

  if (avatar !== undefined) {
    if (!isValidAvatar(avatar)) return { error: "Invalid avatar" };
    result.avatar = avatar;
  }

  return result;
}
