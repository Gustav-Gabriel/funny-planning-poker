import type { GifResult } from "@/lib/gifs/types";

const REQUEST_TIMEOUT_MS = 20_000;

/** @deprecated Prefer GifResult from @/lib/gifs/types */
export type KlipyGif = GifResult;

type KlipyRendition = {
  url?: string;
  width?: number;
  height?: number;
  size?: number;
};

type KlipyGifFormats = {
  gif?: KlipyRendition;
  webp?: KlipyRendition;
  jpg?: KlipyRendition;
};

type KlipyMediaItem = {
  id?: number | string;
  slug?: string;
  blur_preview?: string;
  file?: {
    hd?: KlipyGifFormats;
    md?: KlipyGifFormats;
    sm?: KlipyGifFormats;
    xs?: KlipyGifFormats;
  };
};

type KlipySearchResponse = {
  result?: boolean;
  data?: {
    data?: KlipyMediaItem[];
  };
};

function pickGifUrl(item: KlipyMediaItem): string | null {
  return (
    item.file?.hd?.gif?.url ??
    item.file?.md?.gif?.url ??
    item.file?.sm?.gif?.url ??
    item.file?.xs?.gif?.url ??
    null
  );
}

function pickPreviewUrl(item: KlipyMediaItem, fallback: string): string {
  return (
    item.file?.sm?.gif?.url ??
    item.file?.xs?.gif?.url ??
    item.file?.md?.gif?.url ??
    item.blur_preview ??
    fallback
  );
}

export async function searchKlipy(q: string): Promise<GifResult[]> {
  const apiKey = process.env.KLIPY_API_KEY;
  if (!apiKey) {
    throw new Error("KLIPY_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    q,
    per_page: "24",
    content_filter: "medium",
  });

  const endpoint = `https://api.klipy.com/api/v1/${encodeURIComponent(apiKey)}/gifs/search?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("KLIPY request timed out");
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`KLIPY request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as KlipySearchResponse;
  const items = payload.data?.data ?? [];

  const results: GifResult[] = [];
  for (const item of items) {
    const url = pickGifUrl(item);
    if (!url) continue;

    const id = String(item.id ?? item.slug ?? url);
    results.push({
      id: `klipy:${id}`,
      url,
      preview: pickPreviewUrl(item, url),
      source: "klipy",
    });
  }
  return results;
}
