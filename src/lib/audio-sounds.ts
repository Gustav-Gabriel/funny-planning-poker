export type SoundDefinition = {
  id: string;
  label: string;
  file: string;
};

/** Allowlisted board sounds (files live in /public/audio). */
export const BOARD_SOUNDS: readonly SoundDefinition[] = [
  { id: "ai", label: "Ai", file: "ai.mp3" },
  { id: "ai-que-delicia", label: "Ai que delícia", file: "ai-que-delicia-mickey.mp3" },
  { id: "among-us", label: "Suspeito (Among Us)", file: "among-us-role-reveal-sound.mp3" },
  { id: "anime", label: "Anime", file: "anime-moan.mp3" },
  { id: "cavalo", label: "Cavalo", file: "cavalo-rodrigo-faro.mp3" },
  { id: "dexter", label: "Dexter", file: "dexter-meme.mp3" },
  { id: "dry-fart", label: "Peido seco", file: "dry-fart.mp3" },
  { id: "ele-gosta", label: "Ele gosta", file: "ele-g0sta.mp3" },
  { id: "elevator", label: "Elevador", file: "elevator.mp3" },
  { id: "fah", label: "Fah", file: "fah.mp3" },
  { id: "fart", label: "Peido", file: "fart.mp3" },
  { id: "grilo", label: "Grilo", file: "grilo.mp3" },
  { id: "kids-yay", label: "Yay", file: "kids-yay.mp3" },
  { id: "meu-filme", label: "Não", file: "meu-filme_50.mp3" },
  { id: "hee-hee", label: "Hee hee (Michael Jackson)", file: "michael-jackson-hee-hee.mp3" },
  { id: "naruto", label: "Triste (Naruto)", file: "naruto-sad.mp3" },
  { id: "nossa", label: "Nossa", file: "nossa.mp3" },
  { id: "oh-my-god", label: "Oh my god", file: "oh-my-god-meme.mp3" },
  { id: "pc-error", label: "Erro (Windows)", file: "pc-error.mp3" },
  { id: "punch", label: "Soco", file: "punch-sound.mp3" },
  { id: "que-demais", label: "Que demais", file: "que-demais.mp3" },
  { id: "romance", label: "Romance", file: "romance.mp3" },
  {
    id: "risada-ladrao",
    label: "Risada",
    file: "sabe-porque-as-meninas-dao-maior-valor-na-risada-de-ladrao-mp3cut.mp3",
  },
  { id: "nao-compensa", label: "Sélouco, não compensa", file: "seloco-nao-compensa.mp3" },
  { id: "sus", label: "Suspeito (Spider-Man)", file: "spiderman-sus-sound.mp3" },
  { id: "vine-boom", label: "Boom", file: "vine-boom.mp3" },
  { id: "wow", label: "Wow (Michael Jackson)", file: "wow.mp3" },
] as const;

const SOUND_BY_ID = new Map(BOARD_SOUNDS.map((sound) => [sound.id, sound]));

export function getSoundById(id: string): SoundDefinition | undefined {
  return SOUND_BY_ID.get(id);
}

export function isValidSoundId(value: unknown): value is string {
  return typeof value === "string" && SOUND_BY_ID.has(value);
}

export function soundUrl(file: string): string {
  return `/audio/${encodeURIComponent(file)}`;
}
