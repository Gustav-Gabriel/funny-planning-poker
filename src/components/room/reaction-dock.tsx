"use client";

import { REACTION_EMOJIS } from "@/lib/social";

type ReactionDockProps = {
  targetLabel: string | null;
  onClearTarget: () => void;
  onReact: (emoji: string) => void;
};

export function ReactionDock({
  targetLabel,
  onClearTarget,
  onReact,
}: ReactionDockProps) {
  return (
    <div className="reaction-dock" role="group" aria-label="Reações rápidas">
      <div className="reaction-dock__meta">
        <span className="reaction-dock__hint">
          {targetLabel ? (
            <>
              Reagir em <strong>{targetLabel}</strong>
            </>
          ) : (
            "Reagir na mesa"
          )}
        </span>
        {targetLabel ? (
          <button
            type="button"
            className="text-link reaction-dock__clear"
            onClick={onClearTarget}
          >
            limpar alvo
          </button>
        ) : (
          <span className="reaction-dock__tip">toque num jogador pra mirar</span>
        )}
      </div>
      <div className="reaction-dock__emojis">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-dock__emoji"
            onClick={() => onReact(emoji)}
            aria-label={`Reagir com ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
