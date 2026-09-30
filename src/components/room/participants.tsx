"use client";

import { computeVoteStats } from "@/lib/room-ui";
import type { ClientPlayer } from "@/lib/types";

type ParticipantsProps = {
  players: ClientPlayer[];
  hostId: string;
  revealed: boolean;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
};

export function Participants({
  players,
  hostId,
  revealed,
  selectedPlayerId,
  onSelectPlayer,
}: ParticipantsProps) {
  const stats = revealed ? computeVoteStats(players) : null;

  return (
    <section className="panel participants panel__table participants--table">
      {stats && stats.votesCast > 0 ? (
        <div className="participants__stats">
          {stats.average !== null ? (
            <div className="participants__stat">
              <strong>{stats.average}</strong>
              <span>média</span>
            </div>
          ) : null}
          <div className="participants__stat">
            <strong>{stats.mode}</strong>
            <span>mais votado</span>
          </div>
        </div>
      ) : null}

      <ul className="participants__list">
        {players.map((player) => {
          const facedown = player.hasVoted && !revealed;
          const revealedValue = revealed && player.vote !== null;
          const selected = selectedPlayerId === player.id;

          return (
            <li
              key={player.id}
              className={[
                "participant",
                "participant--table",
                !player.connected ? "is-offline" : "",
                selected ? "is-reaction-target" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="participant__target"
                onClick={() => onSelectPlayer(player.id)}
                aria-pressed={selected}
                aria-label={`Mirar reação em ${player.name}`}
              >
                <span className="participant__info">
                  <span className="participant__avatar" aria-hidden="true">
                    {player.avatar.type === "gif" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.avatar.value} alt="" />
                    ) : (
                      <span>{player.avatar.value}</span>
                    )}
                  </span>
                  <span className="participant__name">
                    {player.name}
                    <span className="participant__badges">
                      {player.id === hostId ? (
                        <span className="tag tag--host">Anfitrião</span>
                      ) : null}
                      {!player.connected ? (
                        <span className="tag tag--muted">Offline</span>
                      ) : null}
                    </span>
                  </span>
                </span>
              </button>
              {player.roast ? (
                <p className="participant__roast">&ldquo;{player.roast}&rdquo;</p>
              ) : null}
              <span
                className={[
                  "participant__vote",
                  "participant__vote--xl",
                  facedown ? "has-vote is-facedown" : "",
                  revealedValue ? "has-vote is-revealed" : "",
                  !player.hasVoted ? "is-waiting" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={
                  facedown
                    ? `${player.name} já votou`
                    : revealedValue
                      ? `Voto de ${player.name}: ${player.vote}`
                      : `${player.name} ainda não votou`
                }
              >
                {facedown ? null : revealedValue ? player.vote : "…"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
