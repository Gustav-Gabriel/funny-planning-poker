import type { GifResult } from "@/lib/gifs/types";

const REQUEST_TIMEOUT_MS = 20_000;

type GiphyImage = {
  url?: string;
};

type GiphyImages = {
  original?: GiphyImage;
  downsized?: GiphyImage;
  downsized_medium?: GiphyImage;
  fixed_height_small?: GiphyImage;
  preview_gif?: GiphyImage;
};

type GiphyItem = {
  id?: string;
  images?: GiphyImages;
};

type GiphySearchResponse = {
  data?: GiphyItem[];
};

function pickGifUrl(item: GiphyItem): string | null {
  return (
    item.images?.downsized_medium?.url ??
    item.images?.downsized?.url ??
    item.images?.original?.url ??
    null
  );
}

function pickPreviewUrl(item: GiphyItem, fallback: string): string {
  return (
    item.images?.fixed_height_small?.url ??
    item.images?.preview_gif?.url ??
    item.images?.downsized?.url ??
    fallback
  );
}

export async function searchGiphy(q: string): Promise<GifResult[]> {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    throw new Error("GIPHY_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q,
    limit: "25",
    rating: "pg",
    lang: "pt",
  });

  const endpoint = `https://api.giphy.com/v1/gifs/search?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Giphy request timed out");
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Giphy request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GiphySearchResponse;
  const items = payload.data ?? [];

  const results: GifResult[] = [];
  for (const item of items) {
    const url = pickGifUrl(item);
    if (!url) continue;

    const id = String(item.id ?? url);
    results.push({
      id: `giphy:${id}`,
      url,
      preview: pickPreviewUrl(item, url),
      source: "giphy",
    });
  }
  return results;
}
