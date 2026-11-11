import "./_group.css";
import { ChevronRight, ShoppingBag } from "lucide-react";

const products = [
  { id: 1, name: "VIP 1", price: "FCFA 2 500", daily: "FCFA 400", total: "FCFA 36 000", cycle: "90 jours" },
  { id: 2, name: "VIP 2", price: "FCFA 5 000", daily: "FCFA 800", total: "FCFA 72 000", cycle: "90 jours" },
  { id: 3, name: "VIP 3", price: "FCFA 10 000", daily: "FCFA 1 600", total: "FCFA 144 000", cycle: "90 jours" },
];

export default function Current() {
  return (
    <main className="pc-preview pc-current">
      <style>{`
        .pc-preview { max-width: 512px; margin: 0 auto; padding: 18px 16px; }
        .pc-current-list { display: grid; gap: 14px; }
        .pc-current-card {
          display: grid; grid-template-columns: 94px minmax(0, 1fr);
          gap: 12px; padding: 12px; border: 2px solid #17191c;
          border-radius: 16px; background: #fff;
          box-shadow: 0 3px 0 #17191c, 0 8px 18px rgba(17,24,39,.14);
        }
        .pc-current-image {
          display: grid; width: 94px; height: 94px; place-items: center;
          border: 2px solid #17191c; border-radius: 12px;
          background: #fff0f3; color: #bd304c;
        }
        .pc-current-info { min-width: 0; }
        .pc-current-name { margin: 1px 0 8px; font-size: 17px; font-weight: 800; line-height: 1.2; }
        .pc-current-line {
          display: flex; justify-content: space-between; gap: 6px; margin-top: 6px;
          color: #625e63; font-size: 11px; line-height: 1.25;
        }
        .pc-current-line span { min-width: 0; }
        .pc-current-line strong { color: #17191c; font-weight: 700; text-align: right; }
        .pc-current-line.revenue strong { color: #9e263c; }
        .pc-current-buy {
          grid-column: 2; justify-self: end; min-width: 112px; min-height: 38px;
          padding: 8px 14px; border: 2px solid #17191c; border-radius: 10px;
          background: #bd304c; color: white; font: inherit; font-size: 12px; font-weight: 800;
          box-shadow: 0 3px 0 #17191c;
        }
        @media (max-width: 380px) {
          .pc-preview { padding-right: 10px; padding-left: 10px; }
          .pc-current-card { grid-template-columns: 78px minmax(0, 1fr); gap: 8px; padding: 9px; }
          .pc-current-image { width: 78px; height: 78px; }
        }
      `}</style>
      <div className="pc-current-list">
        {products.map((product) => (
          <article className="pc-current-card" key={product.id}>
            <div className="pc-current-image" aria-hidden="true"><ShoppingBag size={30} /></div>
            <div className="pc-current-info">
              <h2 className="pc-current-name">{product.name}</h2>
              <div className="pc-current-line"><span>Prix :</span><strong>{product.price}</strong></div>
              <div className="pc-current-line revenue"><span>Revenu quotidien :</span><strong>{product.daily}</strong></div>
              <div className="pc-current-line revenue"><span>Revenu total :</span><strong>{product.total}</strong></div>
              <div className="pc-current-line"><span>Cycle :</span><strong>{product.cycle}</strong></div>
            </div>
            <button className="pc-current-buy" type="button">Acheter <ChevronRight size={14} /></button>
          </article>
        ))}
      </div>
    </main>
  );
}
