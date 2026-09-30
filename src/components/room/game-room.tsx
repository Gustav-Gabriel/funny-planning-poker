"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingReactions } from "@/components/room/floating-reactions";
import { Participants } from "@/components/room/participants";
import { ReactionDock } from "@/components/room/reaction-dock";
import { RoastComposer } from "@/components/room/roast-composer";
import { StoryPanel } from "@/components/room/story-panel";
import { VoteDeck } from "@/components/room/vote-deck";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { translateError, type MutationAck } from "@/lib/room-ui";
import { clearSession } from "@/lib/session-client";
import { burstEmojisFor, computeRevealMood } from "@/lib/social";
import { getSocket } from "@/lib/socket/client";
import type {
  ClientRoomSnapshot,
  Player,
  ReactionShowEvent,
  RevealBurstEvent,
} from "@/lib/types";

type GameRoomProps = {
  code: string;
  initialRoom: ClientRoomSnapshot;
  player: Player;
  playerToken: string;
  hostToken?: string;
  onLeave: () => void;
};

const BURST_LABELS = {
  consensus: "Consenso!",
  split: "Mesa dividida",
  chaos: "Caos total",
} as const;

export function GameRoom({
  code,
  initialRoom,
  player,
  playerToken,
  hostToken,
  onLeave,
}: GameRoomProps) {
  const [room, setRoom] = useState<ClientRoomSnapshot>(initialRoom);
  const [voteError, setVoteError] = useState("");
  const [roomLostError, setRoomLostError] = useState("");
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<
    ReactionShowEvent[]
  >([]);
  const [burst, setBurst] = useState<RevealBurstEvent | null>(null);
  const playerIdRef = useRef(player.id);
  const playerTokenRef = useRef(playerToken);
  const wasRevealedRef = useRef(initialRoom.revealed);

  useEffect(() => {
    playerIdRef.current = player.id;
    playerTokenRef.current = playerToken;
  }, [player.id, playerToken]);

  useEffect(() => {
    const socket = getSocket();

    function handleRoomState(next: ClientRoomSnapshot) {
      if (next.code !== code) return;
      setRoom(next);
    }

    function handleReaction(event: ReactionShowEvent) {
      setFloatingReactions((prev) => [...prev.slice(-30), event]);
    }

    function reattach() {
      socket.emit(
        "room:join",
        {
          roomCode: code,
          playerId: playerIdRef.current,
          playerToken: playerTokenRef.current,
        },
        (ack: unknown) => {
          if (ack && typeof ack === "object" && "error" in ack) {
            setRoomLostError(
              translateError((ack as { error: string }).error),
            );
          }
        },
      );
    }

    socket.on("room:state", handleRoomState);
    socket.on("reaction:show", handleReaction);
    socket.on("connect", reattach);

    return () => {
      socket.off("room:state", handleRoomState);
      socket.off("reaction:show", handleReaction);
      socket.off("connect", reattach);
    };
  }, [code]);

  useEffect(() => {
    if (room.revealed && !wasRevealedRef.current) {
      const mood = computeRevealMood(room.players, room.deck);
      setBurst({
        id: `burst-${code}-${Date.now()}`,
        mood,
        emojis: burstEmojisFor(mood),
      });
    }
    if (!room.revealed) {
      setBurst(null);
    }
    wasRevealedRef.current = room.revealed;
  }, [room.revealed, room.players, room.deck, code]);

  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(null), 3500);
    return () => window.clearTimeout(timer);
  }, [burst]);

  const self = room.players.find((candidate) => candidate.id === player.id) ?? {
    ...player,
    hasVoted: player.vote !== null,
    roast: player.roast ?? null,
  };
  const isHost = room.hostId === player.id && Boolean(hostToken);
  const targetPlayer = reactionTargetId
    ? room.players.find((candidate) => candidate.id === reactionTargetId)
    : null;

  function handleVote(value: string) {
    setVoteError("");
    getSocket().emit(
      "vote:cast",
      { roomCode: code, value },
      (ack: MutationAck) => {
        if (ack && "ok" in ack && !ack.ok) {
          setVoteError(translateError(ack.error));
        }
      },
    );
  }

  function handleLeave() {
    getSocket().emit("room:leave", { roomCode: code }, () => undefined);
    clearSession();
    onLeave();
  }

  function handleReveal() {
    if (!hostToken) return;
    getSocket().emit(
      "vote:reveal",
      { roomCode: code, hostToken },
      (ack: MutationAck) => {
        if (ack && "ok" in ack && !ack.ok) {
          setVoteError(translateError(ack.error));
        }
      },
    );
  }

  function handleReset() {
    if (!hostToken) return;
    getSocket().emit("vote:reset", { roomCode: code, hostToken }, () => undefined);
  }

  function handleCopyLink() {
    if (typeof window === "undefined") return;
    void navigator.clipboard?.writeText(window.location.href);
  }

  function handleReact(emoji: string) {
    getSocket().emit(
      "reaction:send",
      {
        roomCode: code,
        emoji,
        targetPlayerId: reactionTargetId,
      },
      () => undefined,
    );
  }

  function handleSelectPlayer(playerId: string) {
    setReactionTargetId((prev) => (prev === playerId ? null : playerId));
  }

  function handleRoast(roast: string | null) {
    getSocket().emit(
      "roast:set",
      { roomCode: code, roast },
      (ack: MutationAck) => {
        if (ack && "ok" in ack && !ack.ok) {
          setVoteError(translateError(ack.error));
        }
      },
    );
  }

  if (roomLostError) {
    return (
      <div className="room room--lost">
        <p className="form-error" role="alert">
          {roomLostError}
        </p>
        <button type="button" className="text-link" onClick={onLeave}>
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="room room--table">
      <header className="room__header">
        <div className="room__header-identity">
          <h1>Sala {room.code}</h1>
        </div>
        <div className="room__header-actions">
          <ThemeToggle />
          <div className="room__table-actions">
            {isHost && !room.revealed ? (
              <Button type="button" onClick={handleReveal}>
                Revelar votos
              </Button>
            ) : null}
            {isHost && room.revealed ? (
              <Button type="button" variant="secondary" onClick={handleReset}>
                Nova rodada
              </Button>
            ) : null}
          </div>
          <button type="button" className="text-link" onClick={handleCopyLink}>
            Copiar link
          </button>
          <button type="button" className="text-link" onClick={handleLeave}>
            Sair da sala
          </button>
        </div>
      </header>

      <div className="room__layout room__layout--table">
        <div className="room__table-story">
          <StoryPanel
            story={room.story}
            isHost={isHost}
            roomCode={code}
            hostToken={hostToken}
            compact
          />
        </div>
        <div className="room__table">
          {burst ? (
            <div
              className={`reveal-burst-banner reveal-burst-banner--${burst.mood}`}
              role="status"
            >
              <span className="reveal-burst-banner__emojis">
                {burst.emojis.join(" ")}
              </span>
              <strong>{BURST_LABELS[burst.mood]}</strong>
            </div>
          ) : null}
          <FloatingReactions reactions={floatingReactions} burst={burst} />
          <Participants
            players={room.players}
            hostId={room.hostId}
            revealed={room.revealed}
            selectedPlayerId={reactionTargetId}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
        <footer className="room__table-footer">
          <ReactionDock
            targetLabel={targetPlayer?.name ?? null}
            onClearTarget={() => setReactionTargetId(null)}
            onReact={handleReact}
          />
          <RoastComposer value={self.roast ?? null} onSubmit={handleRoast} />
          <VoteDeck
            cards={room.deckCards}
            selected={self.vote}
            disabled={room.revealed}
            onVote={handleVote}
          />
          {voteError ? (
            <p className="form-error" role="alert">
              {voteError}
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
