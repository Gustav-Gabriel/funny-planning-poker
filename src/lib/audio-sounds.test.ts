import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import {
  BOARD_SOUNDS,
  getSoundById,
  isValidSoundId,
  soundUrl,
} from "./audio-sounds";

describe("audio-sounds", () => {
  it("has unique ids and covers every public mp3", () => {
    const ids = BOARD_SOUNDS.map((sound) => sound.id);
    expect(new Set(ids).size).toBe(ids.length);

    const publicDir = path.resolve(process.cwd(), "public/audio");
    const files = readdirSync(publicDir).filter((name) => name.endsWith(".mp3"));
    const catalogFiles = new Set(BOARD_SOUNDS.map((sound) => sound.file));

    expect(catalogFiles.size).toBe(BOARD_SOUNDS.length);
    for (const file of files) {
      expect(catalogFiles.has(file)).toBe(true);
    }
    for (const sound of BOARD_SOUNDS) {
      expect(files.includes(sound.file)).toBe(true);
    }
  });

  it("validates known sound ids", () => {
    expect(isValidSoundId("vine-boom")).toBe(true);
    expect(isValidSoundId("nope")).toBe(false);
    expect(getSoundById("cavalo")?.label).toBe("Cavalo");
    expect(soundUrl("wow.mp3")).toBe("/audio/wow.mp3");
  });
});
