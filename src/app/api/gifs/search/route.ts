import { NextResponse } from "next/server";
import { configuredGifSources, searchGifs } from "@/lib/gifs/search";

export async function GET(request: Request) {
  if (configuredGifSources().length === 0) {
    return NextResponse.json(
      {
        error:
          "Serviço de GIFs indisponível: configure KLIPY_API_KEY e/ou GIPHY_API_KEY.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q?.trim()) {
    return NextResponse.json({ error: "Parâmetro q é obrigatório" }, { status: 400 });
  }

  try {
    const { results, sources } = await searchGifs(q.trim());
    return NextResponse.json({ results, sources });
  } catch {
    return NextResponse.json(
      { error: "Falha ao buscar GIFs" },
      { status: 502 },
    );
  }
}
