import "./_group.css";

const productImage = "/__mockup/images/purchased-vip-vending.png";

export default function Current() {
  return (
    <main className="purchased-card-stage">
      <article className="purchased-card purchased-card-current">
        <div className="purchased-card-current-image">
          <img src={productImage} alt="Distributeur de boissons du produit VIP 1" />
        </div>
        <div className="purchased-card-current-details">
          <h2>VIP 1</h2>
          <p className="purchased-current-price">2 500 XOF</p>
          <p className="purchased-current-line">Jours d’exécution :<strong>28 / 90</strong></p>
          <p className="purchased-current-line">Revenu généré :<strong>11 200 XOF</strong></p>
          <p className="purchased-current-line">Revenu total :<strong>36 000 XOF</strong></p>
          <p className="purchased-current-line">Date :<strong>20 Jul 2026, 15:00</strong></p>
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
        .purchased-card-current {
          display: grid;
          width: min(100%, 390px);
          min-height: 255px;
          grid-template-columns: minmax(0, 1fr) 116px;
          align-items: start;
          gap: 10px;
          margin: 0 auto;
          padding: 12px;
          overflow: hidden;
          border: 2px solid var(--purchased-card-border);
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 4px 0 var(--purchased-card-border);
        }
        .purchased-card-current-image {
          display: grid;
          width: 116px;
          height: 116px;
          grid-column: 2;
          grid-row: 1;
          overflow: hidden;
          place-items: center;
          border: 2px solid var(--purchased-card-red);
          border-radius: 10px;
          background: #fff;
        }
        .purchased-card-current-image img {
          width: 100%;
          height: 100%;
          padding: 6px;
          object-fit: contain;
        }
        .purchased-card-current-details {
          min-width: 0;
          grid-column: 1;
          grid-row: 1;
          overflow: hidden;
        }
        .purchased-card-current-details h2 {
          margin: 0;
          overflow: hidden;
          color: var(--purchased-card-red);
          font-size: 19px;
          font-weight: 900;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .purchased-current-price {
          margin: 12px 0 0;
          color: var(--purchased-card-ink);
          font-size: 16px;
          font-weight: 900;
        }
        .purchased-current-line {
          margin: 8px 0 0;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.2;
        }
        .purchased-current-line strong {
          display: block;
          margin-top: 2px;
          color: var(--purchased-card-ink);
          font-weight: 800;
        }
        @media (max-width: 360px) {
          .purchased-card-current {
            grid-template-columns: minmax(0, 1fr) 104px;
            gap: 9px;
            padding: 11px;
          }
          .purchased-card-current-image { width: 104px; height: 100px; }
          .purchased-card-current-details h2 { font-size: 16px; }
          .purchased-current-line { font-size: 12px; }
        }
      `}</style>
    </main>
  );
}
