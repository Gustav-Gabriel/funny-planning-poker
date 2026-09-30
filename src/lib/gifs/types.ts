export type GifSource = "klipy" | "giphy";

export type GifResult = {
  id: string;
  url: string;
  preview: string;
  source: GifSource;
};
