import { describe, expect, it } from "vitest";
import { buildRoomPayload } from "./create-room-form";

describe("buildRoomPayload", () => {
  it("builds create payload without secrets", () => {
    expect(
      buildRoomPayload({
        deck: "fibonacci",
        hostName: "  Ana  ",
        hostAvatar: { type: "emoji", value: "🎯" },
      }),
    ).toEqual({
      deck: "fibonacci",
      hostName: "Ana",
      hostAvatar: { type: "emoji", value: "🎯" },
    });
  });
});
