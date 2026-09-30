"use client";

import { useEffect, useState } from "react";
import type { ReactionShowEvent, RevealBurstEvent } from "@/lib/types";

type FloatingItem = {
  id: string;
  emoji: string;
  label?: string;
  x: number;
  y: number;
};

type FloatingReactionsProps = {
  reactions: ReactionShowEvent[];
  burst: RevealBurstEvent | null;
};

function randomOffset(): { x: number; y: number } {
  return {
    x: 18 + Math.random() * 64,
    y: 20 + Math.random() * 55,
  };
}

export function FloatingReactions({
  reactions,
  burst,
}: FloatingReactionsProps) {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const latestReaction = reactions.at(-1);
  const latestReactionId = latestReaction?.id;
  const burstId = burst?.id;

  useEffect(() => {
    if (!latestReaction || !latestReactionId) return;

    const offset = randomOffset();
    const item: FloatingItem = {
      id: latestReaction.id,
      emoji: latestReaction.emoji,
      label: latestReaction.fromName,
      x: offset.x,
      y: offset.y,
    };
    setItems((prev) => {
      if (prev.some((entry) => entry.id === item.id)) return prev;
      return [...prev.slice(-18), item];
    });

    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [latestReaction, latestReactionId]);

  useEffect(() => {
    if (!burst || !burstId) return;

    const spawned: FloatingItem[] = burst.emojis.map((emoji, index) => ({
      id: `${burstId}-${index}`,
      emoji,
      x: 12 + ((index * 19) % 70),
      y: 15 + ((index * 23) % 60),
    }));

    setItems((prev) => {
      const withoutOldBurst = prev.filter(
        (entry) => !entry.id.startsWith(`${burstId}-`),
      );
      return [...withoutOldBurst, ...spawned].slice(-24);
    });

    const timer = window.setTimeout(() => {
      setItems((prev) =>
        prev.filter((entry) => !spawned.some((s) => s.id === entry.id)),
      );
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [burst, burstId]);

  if (items.length === 0) return null;

  return (
    <div className="floating-reactions" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="floating-reactions__item"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <span className="floating-reactions__emoji">{item.emoji}</span>
          {item.label ? (
            <span className="floating-reactions__label">{item.label}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
