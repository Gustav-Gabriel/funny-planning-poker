import { scoreCardsFor } from "./decks";
import type { ClientPlayer, DeckType, RevealBurstMood } from "./types";

/** Quick-tap reactions for the table (keep short). */
export const REACTION_EMOJIS = [
  "😂",
  "🔥",
  "💀",
  "🤡",
  "👀",
  "🤔",
  "☕",
  "🎉",
  "😱",
  "🫠",
  "🫡",
  "🧢",
] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

const REACTION_SET = new Set<string>(REACTION_EMOJIS);

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return typeof value === "string" && REACTION_SET.has(value);
}

export function computeRevealMood(
  players: Array<Pick<ClientPlayer, "vote">>,
  deck: DeckType,
): RevealBurstMood {
  const scoreSet = new Set(scoreCardsFor(deck));
  const scores = players
    .map((player) => player.vote)
    .filter((vote): vote is string => vote !== null && scoreSet.has(vote));

  if (scores.length <= 1) return "consensus";

  const unique = new Set(scores);
  if (unique.size === 1) return "consensus";
  if (unique.size === 2) return "split";
  return "chaos";
}

export function burstEmojisFor(mood: RevealBurstMood): string[] {
  switch (mood) {
    case "consensus":
      return ["🎉", "🔥", "👏"];
    case "split":
      return ["👀", "🍿", "🤔"];
    case "chaos":
      return ["🤯", "💀", "🤡", "😱"];
  }
}
