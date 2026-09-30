import { afterEach, describe, expect, it, vi } from "vitest";
import { configuredGifSources, searchGifs } from "./search";

vi.mock("@/lib/klipy/client", () => ({
  searchKlipy: vi.fn(async () => [
    {
      id: "klipy:1",
      url: "https://media.klipy.com/a.gif",
      preview: "https://media.klipy.com/a-sm.gif",
      source: "klipy" as const,
    },
  ]),
}));

vi.mock("@/lib/giphy/client", () => ({
  searchGiphy: vi.fn(async () => [
    {
      id: "giphy:1",
      url: "https://media.giphy.com/b.gif",
      preview: "https://media.giphy.com/b-sm.gif",
      source: "giphy" as const,
    },
  ]),
}));

import { searchKlipy } from "@/lib/klipy/client";
import { searchGiphy } from "@/lib/giphy/client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("configuredGifSources", () => {
  it("lists only providers with keys", () => {
    vi.stubEnv("KLIPY_API_KEY", "klipy-key");
    vi.stubEnv("GIPHY_API_KEY", "");
    expect(configuredGifSources()).toEqual(["klipy"]);

    vi.stubEnv("GIPHY_API_KEY", "giphy-key");
    expect(configuredGifSources()).toEqual(["klipy", "giphy"]);
  });
});

describe("searchGifs", () => {
  it("calls configured providers in parallel and merges results", async () => {
    vi.stubEnv("KLIPY_API_KEY", "klipy-key");
    vi.stubEnv("GIPHY_API_KEY", "giphy-key");

    const result = await searchGifs("party");

    expect(searchKlipy).toHaveBeenCalledWith("party");
    expect(searchGiphy).toHaveBeenCalledWith("party");
    expect(result.sources).toEqual(["klipy", "giphy"]);
    expect(result.results).toHaveLength(2);
  });

  it("skips providers without keys", async () => {
    vi.stubEnv("KLIPY_API_KEY", "");
    vi.stubEnv("GIPHY_API_KEY", "giphy-key");

    const result = await searchGifs("party");

    expect(searchKlipy).not.toHaveBeenCalled();
    expect(searchGiphy).toHaveBeenCalledWith("party");
    expect(result.sources).toEqual(["giphy"]);
    expect(result.results).toHaveLength(1);
  });

  it("keeps results when one provider rejects", async () => {
    vi.stubEnv("KLIPY_API_KEY", "klipy-key");
    vi.stubEnv("GIPHY_API_KEY", "giphy-key");
    vi.mocked(searchGiphy).mockRejectedValueOnce(new Error("boom"));

    const result = await searchGifs("party");

    expect(result.sources).toEqual(["klipy"]);
    expect(result.results).toHaveLength(1);
  });
});
