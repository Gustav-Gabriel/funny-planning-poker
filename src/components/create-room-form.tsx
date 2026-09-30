"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AvatarPicker } from "@/components/avatar-picker";
import { translateError } from "@/lib/room-ui";
import { saveSession } from "@/lib/session-client";
import { getSocket } from "@/lib/socket/client";
import type { DeckType, Player } from "@/lib/types";
import { Button } from "./ui/button";
import { InputField, SelectField } from "./ui/field";

export type CreateRoomFields = {
  deck: DeckType;
  hostName: string;
  hostAvatar: Player["avatar"];
};

export function buildRoomPayload(fields: CreateRoomFields) {
  return {
    deck: fields.deck,
    hostName: fields.hostName.trim(),
    hostAvatar: fields.hostAvatar,
  };
}

type CreateAck =
  | {
      room: { code: string };
      player: Player;
      hostToken: string;
      playerToken: string;
    }
  | { ok: false; error: string };

export function CreateRoomForm() {
  const router = useRouter();
  const [hostAvatar, setHostAvatar] = useState<Player["avatar"]>({
    type: "emoji",
    value: "🃏",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const fields: CreateRoomFields = {
      deck: String(form.get("deck")) as DeckType,
      hostName: String(form.get("hostName") ?? ""),
      hostAvatar,
    };

    getSocket()
      .timeout(10_000)
      .emit(
        "room:create",
        buildRoomPayload(fields),
        (timeoutError: Error | null, response: CreateAck) => {
          if (timeoutError) {
            setError("A conexão demorou demais. Tente novamente.");
            setSubmitting(false);
            return;
          }
          if (!response || "ok" in response) {
            setError(
              translateError(response?.error) ||
                "Não foi possível criar a sala.",
            );
            setSubmitting(false);
            return;
          }

          saveSession({
            roomCode: response.room.code,
            playerId: response.player.id,
            playerToken: response.playerToken,
            hostToken: response.hostToken,
            name: response.player.name,
            avatar: response.player.avatar,
          });
          router.push(`/room/${response.room.code}`);
        },
      );
  }

  return (
    <form
      className="create-form"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <section className="form-section">
        <div className="form-section__heading">
          <span>01</span>
          <div>
            <h2>Sua mesa</h2>
            <p>Escolha como o time vai pontuar.</p>
          </div>
        </div>
        <SelectField id="deck" name="deck" label="Baralho" defaultValue="fibonacci">
          <option value="fibonacci">Fibonacci</option>
          <option value="tshirt">Tamanhos (XS a XL)</option>
        </SelectField>
      </section>

      <section className="form-section">
        <div className="form-section__heading">
          <span>02</span>
          <div>
            <h2>Quem está criando?</h2>
            <p>Você será o anfitrião e controla revelar / nova rodada.</p>
          </div>
        </div>
        <div className="host-fields">
          <InputField
            id="hostName"
            name="hostName"
            label="Seu nome"
            placeholder="Como o time chama você?"
            autoComplete="name"
            required
          />
          <div className="field">
            <p className="field-label">Avatar</p>
            <AvatarPicker value={hostAvatar} onChange={setHostAvatar} />
          </div>
        </div>
      </section>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <p>Sem conta, sem banco — só a mesa enquanto o servidor estiver no ar.</p>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Abrindo mesa…" : "Abrir mesa"}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </form>
  );
}
