import Link from "next/link";
import { CreateRoomForm } from "@/components/create-room-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CreateRoomPage() {
  return (
    <main className="create-page">
      <header className="site-header site-header--compact">
        <Link className="wordmark" href="/" aria-label="Funny Planning Poker">
          <span className="wordmark__mark">F</span>
          <span>Funny Planning Poker</span>
        </Link>
        <div className="site-header__actions">
          <Link className="text-link" href="/">
            Voltar ao início
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="create-layout">
        <aside className="create-intro">
          <p className="eyebrow">Nova mesa</p>
          <h1>Em dois minutos o time já está votando.</h1>
          <p>
            Escolha o baralho, seu avatar e compartilhe o código. O resto é
            conversa na mesa.
          </p>
          <div className="privacy-note">
            <span aria-hidden="true">✦</span>
            <p>
              Nada é salvo em banco — a sala vive na memória do servidor.
            </p>
          </div>
        </aside>

        <CreateRoomForm />
      </div>
    </main>
  );
}
