import "./_group.css";
import { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Gift, Trophy } from "lucide-react";

interface TaskWithStatus {
  id: number;
  name: string;
  requiredInvites: number;
  reward: number;
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const tasks: TaskWithStatus[] = [
  { id: 1, name: "Parrain Bronze", requiredInvites: 3, reward: 350, currentInvites: 1, isCompleted: false, canClaim: false },
  { id: 2, name: "Parrain Argent", requiredInvites: 5, reward: 750, currentInvites: 2, isCompleted: false, canClaim: false },
  { id: 3, name: "Parrain Or", requiredInvites: 10, reward: 2500, currentInvites: 10, isCompleted: false, canClaim: true },
  { id: 4, name: "Parrain Platine", requiredInvites: 30, reward: 6500, currentInvites: 30, isCompleted: true, canClaim: false },
  { id: 5, name: "Parrain Diamant", requiredInvites: 100, reward: 15000, currentInvites: 42, isCompleted: false, canClaim: false },
  { id: 6, name: "Parrain Elite", requiredInvites: 300, reward: 50000, currentInvites: 150, isCompleted: false, canClaim: false },
];

const gifts = [
  "/__mockup/images/task-center/gift-crimson.png",
  "/__mockup/images/task-center/gift-white-red.png",
  "/__mockup/images/task-center/gift-gold.png",
  "/__mockup/images/task-center/gift-ruby.png",
  "/__mockup/images/task-center/gift-pair.png",
  "/__mockup/images/task-center/gift-crimson.png",
];

const currency = "XOF";

export function TaskCenterRedesign() {
  const [notice, setNotice] = useState("");
  const totalTaskRewards = tasks.filter((task) => task.isCompleted).reduce((sum, task) => sum + task.reward, 0);
  const completedCount = tasks.filter((task) => task.isCompleted).length;
  const claimableCount = tasks.filter((task) => task.canClaim && !task.isCompleted).length;

  const notifyClaim = (taskName?: string) => {
    setNotice(taskName ? `Réclamation simulée · ${taskName}` : "Réclamation simulée");
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main className="tc-page">
      <style>{`
        .tc-page {
          --tc-red: #bd304c;
          --tc-red-dark: #97253d;
          --tc-ink: #161616;
          --tc-paper: #fff;
          --tc-muted: #756d69;
          min-height: 100dvh;
          padding: 0 0 32px;
          background: #fff;
          color: var(--tc-ink);
          font-family: inherit;
          position: relative;
          isolation: isolate;
        }
        .tc-page::before {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0 0 auto;
          height: 262px;
          background: var(--tc-red);
          border-bottom: 2px solid var(--tc-ink);
        }
        .tc-topbar {
          max-width: 560px;
          height: 60px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
        }
        .tc-back {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1.5px solid rgba(255,255,255,.72);
          border-radius: 50%;
          color: white;
          background: rgba(255,255,255,.08);
          cursor: pointer;
        }
        .tc-wordmark {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .22em;
          text-transform: uppercase;
        }
        .tc-top-spacer { width: 38px; }
        .tc-intro {
          max-width: 560px;
          margin: 0 auto;
          padding: 22px 22px 33px;
          color: white;
        }
        .tc-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
          opacity: .82;
        }
        .tc-title {
          margin: 11px 0 8px;
          max-width: 390px;
          font-size: clamp(31px, 9vw, 42px);
          line-height: .99;
          letter-spacing: -.055em;
          font-weight: 850;
        }
        .tc-subtitle {
          margin: 0;
          max-width: 335px;
          color: rgba(255,255,255,.88);
          font-size: 13px;
          line-height: 1.5;
        }
        .tc-overview {
          display: grid;
          grid-template-columns: 1.15fr .8fr .9fr;
          max-width: 516px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          background: var(--tc-paper);
          border: 2px solid var(--tc-ink);
          box-shadow: 4px 5px 0 var(--tc-ink);
        }
        .tc-stat {
          min-width: 0;
          padding: 13px 8px 12px;
          text-align: center;
        }
        .tc-stat + .tc-stat { border-left: 1px solid #d9d2cd; }
        .tc-stat-value {
          display: block;
          font-size: 19px;
          line-height: 1.05;
          font-weight: 850;
          letter-spacing: -.04em;
          color: var(--tc-red);
        }
        .tc-stat-label {
          display: block;
          margin-top: 5px;
          color: var(--tc-muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .tc-list {
          max-width: 560px;
          margin: 24px auto 0;
          padding: 0 18px;
        }
        .tc-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin: 0 2px 13px;
        }
        .tc-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          font-size: 16px;
          font-weight: 850;
          letter-spacing: -.035em;
        }
        .tc-section-title svg { color: var(--tc-red); }
        .tc-all-claim {
          padding: 9px 11px;
          border: 1.5px solid var(--tc-ink);
          background: var(--tc-ink);
          color: white;
          font: inherit;
          font-size: 10px;
          line-height: 1;
          font-weight: 750;
          white-space: nowrap;
          cursor: pointer;
          transition: transform .16s ease, background .16s ease;
        }
        .tc-all-claim:hover { background: var(--tc-red); transform: translateY(-1px); }
        .tc-cards { display: grid; gap: 18px; }
        .tc-card {
          position: relative;
          overflow: visible;
          background: var(--tc-paper);
          border: 1.5px solid var(--tc-ink);
          border-radius: 13px;
          box-shadow: 0 1px 0 rgba(22,22,22,.08);
          animation: tc-appear .42s both;
          margin-top: 7px;
        }
        .tc-card:nth-child(2) { animation-delay: 45ms; }
        .tc-card:nth-child(3) { animation-delay: 90ms; }
        .tc-card:nth-child(4) { animation-delay: 135ms; }
        .tc-card:nth-child(5) { animation-delay: 180ms; }
        .tc-card:nth-child(6) { animation-delay: 225ms; }
        .tc-card.is-claimable { border-width: 2px; border-color: var(--tc-ink); box-shadow: 0 1px 0 rgba(22,22,22,.08); }
        .tc-card.is-done { background: #fff; }
        .tc-card-top {
          min-height: 31px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 2px 12px 0;
          border-bottom: 1px solid #e7e7e7;
        }
        .tc-tier {
          font-size: 12px;
          font-weight: 850;
          letter-spacing: -.02em;
          margin-left: auto;
        }
        .tc-status {
          position: absolute;
          top: -1px;
          left: -1px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 24px;
          padding: 0 11px;
          border: 1.5px solid var(--tc-ink);
          border-top-left-radius: 11px;
          border-bottom-right-radius: 9px;
          background: var(--tc-red);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .01em;
          text-transform: none;
        }
        .tc-status.done { background: var(--tc-ink); color: #fff; }
        .tc-status.ready { background: var(--tc-red); color: #fff; }
        .tc-body {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 12px;
          padding: 10px 12px 12px;
          align-items: center;
        }
        .tc-gift-frame {
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          background: #fff;
          border: 1px solid #ededed;
          border-radius: 11px;
          overflow: hidden;
        }
        .tc-gift {
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .tc-detail { min-width: 0; }
        .tc-requirement {
          margin: 0 0 3px;
          color: #555;
          font-size: 11px;
          line-height: 1.35;
        }
        .tc-requirement strong { color: var(--tc-ink); font-weight: 850; }
        .tc-reward {
          margin: 0;
          color: var(--tc-red);
          font-size: 19px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -.045em;
        }
        .tc-reward small {
          color: var(--tc-ink);
          font-size: 10px;
          letter-spacing: .04em;
          font-weight: 800;
        }
        .tc-progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin: 9px 0 5px;
          color: #6c6c6c;
          font-size: 9px;
          font-weight: 650;
        }
        .tc-progress-track {
          height: 8px;
          overflow: hidden;
          background: #ededed;
          border: 1px solid #d7d7d7;
          border-radius: 99px;
        }
        .tc-progress-fill {
          height: 100%;
          background: var(--tc-red);
          border-radius: inherit;
          transform-origin: left;
          transition: transform .55s cubic-bezier(.2,.7,.2,1);
        }
        .tc-progress-fill.done { background: #287653; }
        .tc-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 9px;
        }
        .tc-progress-label {
          color: #555;
          font-size: 10px;
          font-weight: 750;
        }
        .tc-action {
          min-width: 79px;
          padding: 8px 10px;
          border: 1.5px solid var(--tc-ink);
          color: var(--tc-ink);
          background: transparent;
          font: inherit;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
          transition: color .15s ease, background .15s ease, transform .15s ease;
        }
        .tc-action:hover { color: white; background: var(--tc-red); border-color: var(--tc-red); transform: translateY(-1px); }
        .tc-action.claim { color: white; background: var(--tc-red); border-color: var(--tc-red); }
        .tc-action.claim:hover { background: var(--tc-red-dark); border-color: var(--tc-red-dark); }
        .tc-action:active { transform: translateY(1px); }
        .tc-notice {
          position: fixed;
          z-index: 5;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          max-width: calc(100vw - 32px);
          padding: 12px 16px;
          border: 1.5px solid var(--tc-ink);
          background: var(--tc-ink);
          color: white;
          font-size: 12px;
          font-weight: 750;
          box-shadow: 3px 3px 0 var(--tc-red);
          animation: tc-toast .18s both;
        }
        @keyframes tc-appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tc-toast { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (min-width: 620px) {
          .tc-intro { padding-top: 29px; padding-bottom: 38px; }
          .tc-overview { padding: 3px 8px; }
          .tc-stat { padding: 16px 10px; }
          .tc-list { margin-top: 29px; }
          .tc-body { grid-template-columns: 88px minmax(0, 1fr); padding: 12px 15px 14px; gap: 14px; }
          .tc-gift-frame { width: 88px; height: 88px; }
          .tc-card-top { padding: 2px 16px 0; min-height: 34px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tc-page *, .tc-page *::before, .tc-page *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <header className="tc-topbar">
        <button className="tc-back" type="button" aria-label="Retour" onClick={() => setNotice("Retour à l’accueil")}>
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <span className="tc-wordmark">Equinor</span>
        <span className="tc-top-spacer" aria-hidden="true" />
      </header>

      <section className="tc-intro">
        <div className="tc-eyebrow"><Gift size={14} strokeWidth={2.5} /> Programme de parrainage</div>
        <h1 className="tc-title">Récompenses<br />des tâches</h1>
        <p className="tc-subtitle">Invitez des amis à recharger et débloquez vos récompenses, palier après palier.</p>
      </section>

      <section className="tc-overview" aria-label="Résumé des récompenses">
        <div className="tc-stat">
          <span className="tc-stat-value">{totalTaskRewards.toLocaleString("fr-FR")}</span>
          <span className="tc-stat-label">{currency} gagnés</span>
        </div>
        <div className="tc-stat">
          <span className="tc-stat-value">{completedCount}</span>
          <span className="tc-stat-label">Terminées</span>
        </div>
        <div className="tc-stat">
          <span className="tc-stat-value">{claimableCount}</span>
          <span className="tc-stat-label">À réclamer</span>
        </div>
      </section>

      <section className="tc-list">
        <div className="tc-section-heading">
          <h2 className="tc-section-title"><Trophy size={18} strokeWidth={2.3} /> Paliers de parrainage</h2>
          {claimableCount > 0 && (
            <button className="tc-all-claim" type="button" onClick={() => notifyClaim()}>
              Tout réclamer <ChevronRight size={12} style={{ verticalAlign: "middle" }} /> {claimableCount}
            </button>
          )}
        </div>

        <div className="tc-cards">
          {tasks.map((task, index) => {
            const progress = Math.min((task.currentInvites / task.requiredInvites) * 100, 100);
            const statusClass = task.isCompleted ? "done" : task.canClaim ? "ready" : "";
            const statusLabel = task.isCompleted ? "Terminé" : task.canClaim ? "À réclamer" : "En cours";

            return (
              <article
                key={task.id}
                className={`tc-card${task.isCompleted ? " is-done" : ""}${task.canClaim && !task.isCompleted ? " is-claimable" : ""}`}
                data-testid={`task-item-${task.id}`}
              >
                <div className="tc-card-top">
                  <span className="tc-tier">{task.name}</span>
                  <span className={`tc-status ${statusClass}`}>
                    {task.isCompleted ? <CheckCircle2 size={13} /> : task.canClaim ? <Gift size={13} /> : null}
                    {statusLabel}
                  </span>
                </div>
                <div className="tc-body">
                  <div className="tc-gift-frame">
                    <img className="tc-gift" src={gifts[index]} alt={`Cadeau ${task.name}`} />
                  </div>
                  <div className="tc-detail">
                    <p className="tc-requirement">Inviter <strong>{task.requiredInvites} personnes</strong> à recharger</p>
                    <p className="tc-reward">{task.reward.toLocaleString("fr-FR")} <small>{currency}</small></p>
                    <div className="tc-progress-meta">
                      <span>Progression</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div
                      className="tc-progress-track"
                      role="progressbar"
                      aria-label={`Progression ${task.name}`}
                      aria-valuenow={task.currentInvites}
                      aria-valuemin={0}
                      aria-valuemax={task.requiredInvites}
                    >
                      <div className={`tc-progress-fill${task.isCompleted ? " done" : ""}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="tc-card-bottom">
                      <span className="tc-progress-label">{task.currentInvites} / {task.requiredInvites} invitations</span>
                      {task.isCompleted ? (
                        <span className="tc-action" aria-label="Palier terminé"><Check size={13} style={{ verticalAlign: "middle" }} /> Fait</span>
                      ) : task.canClaim ? (
                        <button className="tc-action claim" type="button" data-testid={`button-claim-${task.id}`} onClick={() => notifyClaim(task.name)}>
                          Réclamer
                        </button>
                      ) : (
                        <span className="tc-action">En cours</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {notice && <div className="tc-notice" role="status">{notice}</div>}
    </main>
  );
}
