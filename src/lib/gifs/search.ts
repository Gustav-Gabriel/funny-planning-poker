import { searchGiphy } from "@/lib/giphy/client";
import { searchKlipy } from "@/lib/klipy/client";
import type { GifResult, GifSource } from "@/lib/gifs/types";

export type GifSearchResponse = {
  results: GifResult[];
  sources: GifSource[];
};

function hasKey(name: "KLIPY_API_KEY" | "GIPHY_API_KEY"): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function configuredGifSources(): GifSource[] {
  const sources: GifSource[] = [];
  if (hasKey("KLIPY_API_KEY")) sources.push("klipy");
  if (hasKey("GIPHY_API_KEY")) sources.push("giphy");
  return sources;
}

export async function searchGifs(q: string): Promise<GifSearchResponse> {
  const sources = configuredGifSources();
  if (sources.length === 0) {
    throw new Error("No GIF providers configured");
  }

  const tasks = sources.map(async (source) => {
    if (source === "klipy") return searchKlipy(q);
    return searchGiphy(q);
  });

  const settled = await Promise.allSettled(tasks);
  const results: GifResult[] = [];
  const usedSources: GifSource[] = [];

  settled.forEach((outcome, index) => {
    if (outcome.status !== "fulfilled") return;
    const source = sources[index];
    if (!source) return;
    usedSources.push(source);
    results.push(...outcome.value);
  });

  return { results, sources: usedSources };
}
