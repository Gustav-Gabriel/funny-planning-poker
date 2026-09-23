import type { ClientPlayer } from "./types";

export type MutationAck = { ok: true } | { ok: false; error: string };

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export type VoteStats = {
  votesCast: number;
  average: number | null;
  mode: string | null;
};

export function computeVoteStats(players: ClientPlayer[]): VoteStats {
  const votes = players
    .map((player) => player.vote)
    .filter((vote): vote is string => vote !== null);

  if (votes.length === 0) {
    return { votesCast: 0, average: null, mode: null };
  }

  const counts = new Map<string, number>();
  for (const vote of votes) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }

  let mode: string | null = null;
  let modeCount = 0;
  for (const [vote, count] of counts) {
    if (count > modeCount) {
      mode = vote;
      modeCount = count;
    }
  }

  const numericVotes = votes
    .map((vote) => Number(vote))
    .filter((value) => Number.isFinite(value));
  const average =
    numericVotes.length > 0
      ? Math.round(
          (numericVotes.reduce((sum, value) => sum + value, 0) /
            numericVotes.length) *
            10,
        ) / 10
      : null;

  return { votesCast: votes.length, average, mode };
}

const ERROR_MAP: Array<[RegExp, string]> = [
  [/room not found/i, "Sala não encontrada."],
  [/room is full/i, "A sala está cheia."],
  [/player not found/i, "Participante não encontrado."],
  [/invalid rejoin token/i, "Sessão inválida. Entre novamente na sala."],
  [/not in this room/i, "Você não está nesta sala."],
  [/unauthorized/i, "Ação não autorizada."],
  [/votes already revealed/i, "Os votos já foram revelados."],
  [/invalid vote value/i, "Carta inválida para este baralho."],
  [/invalid room payload/i, "Dados da sala inválidos."],
  [/room name is required/i, "Informe o nome da sala."],
  [/invalid deck/i, "Baralho inválido."],
  [/host name is required/i, "Informe o nome do anfitrião."],
  [/invalid host avatar/i, "Avatar inválido."],
  [/name and avatar are required/i, "Informe nome e avatar."],
  [/invalid name/i, "Nome inválido."],
  [/invalid avatar/i, "Avatar inválido."],
  [/story title is required/i, "Informe o título da história."],
  [/invalid story payload/i, "Dados da história inválidos."],
  [/invalid story description/i, "Descrição da história inválida."],
  [/story description is too long/i, "A descrição da história é longa demais."],
  [/room code is required/i, "Informe o código da sala."],
  [
    /\b(failed|required|not found|invalid|unauthorized|error|must be|cannot|unable)\b/i,
    "",
  ],
];

export function translateError(error: string | undefined | null): string {
  if (!error) return "Algo deu errado. Tente novamente.";
  for (const [pattern, message] of ERROR_MAP) {
    if (pattern.test(error)) {
      return message || error;
    }
  }
  return error;
}
