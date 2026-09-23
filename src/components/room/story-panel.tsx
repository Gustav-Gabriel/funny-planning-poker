"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronDownIcon } from "@/components/icons/ic-chevron-down";
import { Button } from "@/components/ui/button";
import { linkifyText } from "@/lib/linkify";
import type { MutationAck } from "@/lib/room-ui";
import { translateError } from "@/lib/room-ui";
import { getSocket } from "@/lib/socket/client";
import type { Story } from "@/lib/types";

type StoryPanelProps = {
  story: Story | null;
  isHost: boolean;
  roomCode: string;
  hostToken?: string;
  compact?: boolean;
};

export function StoryPanel({
  story,
  isHost,
  roomCode,
  hostToken,
  compact = false,
}: StoryPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(!story);

  useEffect(() => {
    setExpanded(Boolean(story?.description));
    setEditing(!story);
    if (story) {
      setTitle(story.title);
      setDescription(story.description);
    } else {
      setTitle("");
      setDescription("");
    }
  }, [story?.title, story?.description]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hostToken) return;

    setLoading(true);
    setError("");
    getSocket().emit(
      "story:set",
      {
        roomCode,
        hostToken,
        story: { title: title.trim(), description: description.trim() },
      },
      (ack: MutationAck) => {
        setLoading(false);
        if (ack && "ok" in ack && !ack.ok) {
          setError(translateError(ack.error));
          return;
        }
        setEditing(false);
      },
    );
  }

  function handleClear() {
    if (!hostToken) return;
    getSocket().emit(
      "story:set",
      { roomCode, hostToken, story: null },
      () => undefined,
    );
  }

  return (
    <section className={`panel story-panel${compact ? " story-panel--compact" : ""}`}>
      <div className="panel__heading">
        <h2>História da rodada</h2>
        {isHost && story && !editing ? (
          <div className="story-panel__heading-actions">
            <button type="button" className="text-link" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button type="button" className="text-link" onClick={handleClear}>
              Remover
            </button>
          </div>
        ) : null}
      </div>

      {story && !editing ? (
        <div className={`story-card${expanded ? " is-expanded" : " is-collapsed"}`}>
          <button
            type="button"
            className="story-card__summary"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            <span className="story-card__summary-text">
              <span className="story-card__summary-title">{story.title}</span>
            </span>
            {story.description ? (
              <span
                className={`story-card__chevron${expanded ? " is-open" : ""}`}
                aria-hidden="true"
              >
                <ChevronDownIcon height="1.15em" width="1.15em" />
              </span>
            ) : null}
          </button>

          {story.description ? (
            <div className="story-card__details" inert={!expanded ? true : undefined}>
              <div className="story-card__details-inner">
                <p className="story-card__description">
                  {linkifyText(story.description)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!story && !isHost ? (
        <p className="panel__empty">O anfitrião ainda não definiu a história.</p>
      ) : null}

      {isHost && (editing || !story) ? (
        <form className="story-panel__form" onSubmit={handleSave}>
          <label className="field">
            <span className="field-label">Título</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Login com magia"
              maxLength={200}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Descrição</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contexto rápido para a mesa (opcional)"
              rows={compact ? 3 : 4}
              maxLength={4000}
            />
          </label>
          <div className="story-panel__form-actions">
            {story ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setTitle(story.title);
                  setDescription(story.description);
                  setError("");
                }}
              >
                Cancelar
              </Button>
            ) : null}
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Salvando…" : story ? "Salvar" : "Definir história"}
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
