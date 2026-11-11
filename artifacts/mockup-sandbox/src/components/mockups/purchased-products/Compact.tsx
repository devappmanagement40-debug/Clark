import "./_group.css";

const productImage = "/__mockup/images/purchased-vip-vending.png";

export default function Compact() {
  return (
    <main className="purchased-card-stage">
      <article className="purchased-card purchased-card-compact">
        <header className="purchased-card-heading">
          <div className="purchased-card-image">
            <img src={productImage} alt="" />
          </div>
          <div className="purchased-card-title">
            <h2>VIP 1</h2>
            <p><span>Achat</span><strong>2 500 XOF</strong></p>
          </div>
        </header>

        <div className="purchased-card-data">
          <div className="purchased-card-metric">
            <span>Jours d’exécution</span>
            <strong>28 / 90</strong>
          </div>
          <div className="purchased-card-metric">
            <span>Revenu généré</span>
            <strong>11 200 XOF</strong>
          </div>
          <div className="purchased-card-metric">
            <span>Revenu total</span>
            <strong>36 000 XOF</strong>
          </div>
          <div className="purchased-card-metric purchased-card-date">
            <span>Date d’achat</span>
            <strong>20 Jul 2026, 15:00</strong>
          </div>
        </div>
      </article>

      <style>{`
        .purchased-card-stage {
          box-sizing: border-box;
          min-height: 100%;
          padding: 18px 12px;
          background: #f5f5f6;
          color: var(--purchased-card-ink);
          font-family: Inter, Arial, sans-serif;
        }
        .purchased-card,
        .purchased-card * { box-sizing: border-box; }
        .purchased-card-compact {
          display: grid;
          width: min(calc(100% - 12px), 370px);
          min-height: 0;
          grid-template-columns: 72px minmax(0, 1fr);
          grid-template-rows: auto auto;
          align-items: center;
          gap: 6px 10px;
          margin: 0 auto;
          padding: 10px;
          border: 2px solid var(--purchased-card-border);
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 3px 0 var(--purchased-card-border), 0 8px 18px rgba(17,24,39,.12);
        }
        .purchased-card-heading { display: contents; }
        .purchased-card-image {
          grid-column: 1;
          grid-row: 1 / span 2;
          width: 72px;
          height: 72px;
          overflow: hidden;
          border: 2px solid var(--purchased-card-red);
          border-radius: 10px;
          background: #fff;
          align-self: center;
        }
        .purchased-card-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .purchased-card-title {
          min-width: 0;
          grid-column: 2;
          grid-row: 1;
          align-self: end;
        }
        .purchased-card-title h2 {
          margin: 0;
          overflow: hidden;
          color: var(--purchased-card-red);
          font-size: 17px;
          font-weight: 900;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .purchased-card-title p {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 8px;
          margin: 6px 0 0;
          color: var(--purchased-card-muted);
          font-size: 12px;
          line-height: 1.2;
        }
        .purchased-card-title p strong {
          color: var(--purchased-card-ink);
          font-size: 14px;
          font-weight: 800;
        }
        .purchased-card-data {
          display: flex;
          min-width: 0;
          grid-column: 2;
          grid-row: 2;
          flex-direction: column;
          gap: 4px;
          align-self: start;
        }
        .purchased-card-metric {
          display: flex;
          min-width: 0;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
          color: var(--purchased-card-muted);
          font-size: 10px;
          line-height: 1.2;
        }
        .purchased-card-metric strong {
          flex-shrink: 0;
          overflow-wrap: anywhere;
          color: var(--purchased-card-ink);
          font-size: 11px;
          font-weight: 800;
        }
        .purchased-card-date strong { text-align: right; }
        @media (max-width: 360px) {
          .purchased-card-stage { padding: 14px 10px; }
          .purchased-card-compact {
            width: calc(100% - 8px);
            grid-template-columns: 64px minmax(0, 1fr);
            gap: 5px 8px;
            padding: 9px;
          }
          .purchased-card-image { width: 64px; height: 64px; }
          .purchased-card-title h2 { font-size: 16px; }
          .purchased-card-metric { font-size: 9px; }
          .purchased-card-metric strong { font-size: 10px; }
        }
      `}</style>
    </main>
  );
}
