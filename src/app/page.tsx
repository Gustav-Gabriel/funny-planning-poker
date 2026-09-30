import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonClassName } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="landing">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Funny Planning Poker">
          <span className="wordmark__mark">F</span>
          <span>Funny Planning Poker</span>
        </Link>
        <div className="site-header__actions">
          <span className="site-header__note">Estimativa leve, conversa séria</span>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">
            <span aria-hidden="true">✦</span> Planning poker sem firula
          </p>
          <h1>Funny Planning Poker</h1>
          <p className="hero__support">
            Abra uma mesa, chame o time, vote escondido e revele junto — de forma descontraída.
          </p>
          <div className="hero__actions">
            <Link className={buttonClassName("primary")} href="/create">
              Abrir mesa <span aria-hidden="true">→</span>
            </Link>
            <Link className={buttonClassName("secondary")} href="/join">
              Entrar com código
            </Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-art__halo" />
          <div className="poker-card poker-card--back">
            <span>F</span>
          </div>
          <div className="poker-card poker-card--front">
            <small>FP</small>
            <strong>8</strong>
            <span>estimativa</span>
          </div>
          <span className="spark spark--one">✦</span>
          <span className="spark spark--two">✦</span>
        </div>
      </section>

      <footer className="landing__footer">
        <span>Votos secretos</span>
        <i />
        <span>Mesa ao vivo</span>
        <i />
        <span>Mobile friendly</span>
      </footer>
    </main>
  );
}
