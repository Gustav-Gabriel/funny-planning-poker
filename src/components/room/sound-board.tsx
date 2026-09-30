"use client";

import { useEffect, useRef, useState } from "react";
import { readAudioMuted, writeAudioMuted } from "@/lib/audio-mute";
import {
  BOARD_SOUNDS,
  getSoundById,
  soundUrl,
} from "@/lib/audio-sounds";
import { VolumeIcon } from "@/components/icons/ic-volume";
import { VolumeMuteIcon } from "@/components/icons/ic-volume-mute";
import { getSocket } from "@/lib/socket/client";
import type { AudioPlayEvent } from "@/lib/types";

type SoundBoardProps = {
  roomCode: string;
  playerId: string;
};

function playFile(file: string) {
  try {
    const audio = new Audio(soundUrl(file));
    void audio.play().catch(() => undefined);
  } catch {
    // ignore autoplay / decode errors
  }
}

function unlockAudio() {
  try {
    const audio = new Audio();
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
      })
      .catch(() => undefined);
  } catch {
    // ignore
  }
}

export function SoundBoard({ roomCode, playerId }: SoundBoardProps) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const playerIdRef = useRef(playerId);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    setMuted(readAudioMuted());
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function handlePlay(event: AudioPlayEvent) {
      if (event.fromPlayerId === playerIdRef.current) return;
      if (readAudioMuted()) return;
      const sound = getSoundById(event.soundId);
      if (!sound) return;
      playFile(sound.file);
    }

    socket.on("audio:play", handlePlay);
    return () => {
      socket.off("audio:play", handlePlay);
    };
  }, []);

  function toggleMute() {
    unlockAudio();
    setMuted((prev) => {
      const next = !prev;
      writeAudioMuted(next);
      return next;
    });
  }

  function toggleOpen() {
    unlockAudio();
    setOpen((prev) => !prev);
  }

  function playSound(soundId: string) {
    unlockAudio();
    const sound = getSoundById(soundId);
    if (sound && !readAudioMuted()) {
      playFile(sound.file);
    }
    getSocket().emit(
      "audio:play",
      { roomCode, soundId },
      () => undefined,
    );
  }

  return (
    <section className="sound-board" aria-label="Sons da mesa">
      <div className="sound-board__bar">
        <button
          type="button"
          className="sound-board__toggle"
          aria-expanded={open}
          onClick={toggleOpen}
        >
          <span aria-hidden="true">{open ? "▾" : "▸"}</span>
          Sons
        </button>
        <button
          type="button"
          className="icon-button text-link sound-board__mute"
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Ativar som" : "Desligar som"}
          title={muted ? "Ativar som" : "Desligar som"}
        >
          {muted ? (
            <VolumeMuteIcon height={18} width={18} />
          ) : (
            <VolumeIcon height={18} width={18} />
          )}
        </button>
      </div>
      {open ? (
        <div className="sound-board__grid" role="group" aria-label="Botões de áudio">
          {BOARD_SOUNDS.map((sound) => (
            <button
              key={sound.id}
              type="button"
              className="sound-board__btn"
              onClick={() => playSound(sound.id)}
            >
              {sound.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
