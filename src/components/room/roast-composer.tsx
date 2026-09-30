"use client";

import { useState, type FormEvent } from "react";
import { MAX_ROAST_LENGTH } from "@/lib/validation";

type RoastComposerProps = {
  value: string | null;
  onSubmit: (roast: string | null) => void;
};

export function RoastComposer({ value, onSubmit }: RoastComposerProps) {
  const [draft, setDraft] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    onSubmit(trimmed.length === 0 ? null : trimmed);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="roast-composer__toggle text-link"
        onClick={() => {
          setDraft(value ?? "");
          setOpen(true);
        }}
      >
        {value ? "Editar comentário" : "Comentar"}
      </button>
    );
  }

  return (
    <form className="roast-composer" onSubmit={handleSubmit}>
      <label className="roast-composer__label" htmlFor="roast-input">
        Comentário (some na nova rodada)
      </label>
      <div className="roast-composer__row">
        <input
          id="roast-input"
          className="roast-composer__input"
          value={draft}
          maxLength={MAX_ROAST_LENGTH}
          placeholder="ex.: isso cheira a 13…"
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
        />
        <button type="submit" className="button button--secondary roast-composer__save">
          Ok
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
      <span className="roast-composer__count">
        {draft.trim().length}/{MAX_ROAST_LENGTH}
      </span>
    </form>
  );
}
