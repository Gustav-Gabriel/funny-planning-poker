import { describe, expect, it } from "vitest";
import {
  burstEmojisFor,
  computeRevealMood,
  isReactionEmoji,
  REACTION_EMOJIS,
} from "./social";

describe("isReactionEmoji", () => {
  it("accepts curated reactions only", () => {
    expect(isReactionEmoji(REACTION_EMOJIS[0])).toBe(true);
    expect(isReactionEmoji("🍕")).toBe(false);
    expect(isReactionEmoji(null)).toBe(false);
  });
});

describe("computeRevealMood", () => {
  it("detects consensus when score votes match", () => {
    expect(
      computeRevealMood(
        [{ vote: "5" }, { vote: "5" }, { vote: "☕" }],
        "fibonacci",
      ),
    ).toBe("consensus");
  });

  it("detects split with two score camps", () => {
    expect(
      computeRevealMood(
        [{ vote: "3" }, { vote: "3" }, { vote: "8" }, { vote: "8" }],
        "fibonacci",
      ),
    ).toBe("split");
  });

  it("detects chaos with many distinct scores", () => {
    expect(
      computeRevealMood(
        [{ vote: "1" }, { vote: "3" }, { vote: "8" }, { vote: "13" }],
        "fibonacci",
      ),
    ).toBe("chaos");
  });
});

describe("burstEmojisFor", () => {
  it("returns non-empty emoji sets", () => {
    expect(burstEmojisFor("consensus").length).toBeGreaterThan(0);
    expect(burstEmojisFor("split").length).toBeGreaterThan(0);
    expect(burstEmojisFor("chaos").length).toBeGreaterThan(0);
  });
});
