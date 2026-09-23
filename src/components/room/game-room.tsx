"use client";

import { useEffect, useRef, useState } from "react";
import { Participants } from "@/components/room/participants";
import { StoryPanel } from "@/components/room/story-panel";
import { VoteDeck } from "@/components/room/vote-deck";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { translateError, type MutationAck } from "@/lib/room-ui";
import { clearSession } from "@/lib/session-client";
import { getSocket } from "@/lib/socket/client";
import type { ClientRoomSnapshot, Player } from "@/lib/types";

type GameRoomProps = {
  code: string;
  initialRoom: ClientRoomSnapshot;
  player: Player;
  playerToken: string;
  hostToken?: string;
  onLeave: () => void;
};

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
  const playerIdRef = useRef(player.id);
  const playerTokenRef = useRef(playerToken);

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
    socket.on("connect", reattach);

    return () => {
      socket.off("room:state", handleRoomState);
      socket.off("connect", reattach);
    };
  }, [code]);

  const self = room.players.find((candidate) => candidate.id === player.id) ?? player;
  const isHost = room.hostId === player.id && Boolean(hostToken);

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
          <p className="eyebrow">
            <span aria-hidden="true">✦</span> {room.name}
          </p>
          <h1>Sala {room.code}</h1>
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
        </div>
        <div className="room__header-actions">
          <ThemeToggle />
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
          <Participants
            players={room.players}
            hostId={room.hostId}
            revealed={room.revealed}
          />
        </div>
        <footer className="room__table-footer">
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
