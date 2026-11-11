import "./_group.css";
import { ChevronRight, ShoppingBag } from "lucide-react";

const products = [
  { id: 1, name: "VIP 1", price: "FCFA 2 500", daily: "FCFA 400", total: "FCFA 36 000", cycle: "90 jours" },
  { id: 2, name: "VIP 2", price: "FCFA 5 000", daily: "FCFA 800", total: "FCFA 72 000", cycle: "90 jours" },
  { id: 3, name: "VIP 3", price: "FCFA 10 000", daily: "FCFA 1 600", total: "FCFA 144 000", cycle: "90 jours" },
];

export default function ReferenceLayout() {
  return (
    <main className="pc-preview pc-reference">
      <style>{`
        .pc-reference-list { display: grid; gap: 13px; }
        .pc-reference-card {
          display: grid;
          grid-template-columns: 86px minmax(0, 1fr) 84px;
          align-items: center; gap: 9px; min-height: 116px; padding: 10px;
          border: 2px solid #17191c; border-radius: 15px; background: #fff;
          box-shadow: 0 3px 0 #17191c, 0 8px 18px rgba(17,24,39,.12);
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .pc-reference-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 0 #17191c, 0 11px 20px rgba(17,24,39,.15);
        }
        .pc-reference-image {
          display: grid; width: 86px; aspect-ratio: 1; place-items: center;
          overflow: hidden; border: 1px solid #25282d; border-radius: 10px;
          background: linear-gradient(145deg, #edf1f4, #d7dfe5);
          color: #bd304c;
        }
        .pc-reference-info { min-width: 0; }
        .pc-reference-name {
          margin: 0 0 5px; color: #17191c; font-size: 17px; font-weight: 800;
          line-height: 1.15; overflow-wrap: anywhere;
        }
        .pc-reference-line {
          display: flex; align-items: baseline; justify-content: space-between; gap: 4px;
          margin-top: 4px; color: #3f4145; font-size: 10.5px; line-height: 1.2;
        }
        .pc-reference-line span { min-width: 0; }
        .pc-reference-line strong { color: #9e263c; font-size: 10.5px; font-weight: 800; text-align: right; }
        .pc-reference-line.cycle strong { color: #27292d; }
        .pc-reference-buy {
          display: inline-flex; min-width: 0; min-height: 36px; align-items: center;
          justify-content: center; gap: 2px; padding: 7px 7px;
          border: 1.5px solid #17191c; border-radius: 999px;
          background: linear-gradient(120deg, #bd304c 0%, #9e263c 100%);
          color: white; font: inherit; font-size: 11px; font-weight: 800;
          box-shadow: 0 2px 0 #17191c; cursor: pointer;
          transition: transform .16s ease, filter .16s ease;
        }
        .pc-reference-buy:hover { transform: translateY(-1px); filter: brightness(.96); }
        @media (min-width: 440px) {
          .pc-reference-card { grid-template-columns: 96px minmax(0, 1fr) 94px; gap: 12px; min-height: 126px; padding: 12px; }
          .pc-reference-image { width: 96px; }
          .pc-reference-name { font-size: 19px; }
          .pc-reference-line, .pc-reference-line strong { font-size: 12px; }
          .pc-reference-buy { min-height: 40px; font-size: 12px; }
        }
        @media (max-width: 370px) {
          .pc-preview { padding-right: 10px; padding-left: 10px; }
          .pc-reference-card { grid-template-columns: 70px minmax(0, 1fr) 74px; gap: 7px; min-height: 102px; padding: 8px; }
          .pc-reference-image { width: 70px; }
          .pc-reference-name { font-size: 15px; }
          .pc-reference-line, .pc-reference-line strong { font-size: 9.5px; }
          .pc-reference-buy { min-height: 33px; padding: 6px 4px; font-size: 10px; }
        }
      `}</style>
      <div className="pc-reference-list">
        {products.map((product) => (
          <article className="pc-reference-card" key={product.id}>
            <div className="pc-reference-image" aria-hidden="true"><ShoppingBag size={30} /></div>
            <div className="pc-reference-info">
              <h2 className="pc-reference-name">{product.name}</h2>
              <div className="pc-reference-line"><span>Prix :</span><strong>{product.price}</strong></div>
              <div className="pc-reference-line"><span>Revenu quotidien :</span><strong>{product.daily}</strong></div>
              <div className="pc-reference-line"><span>Revenu total :</span><strong>{product.total}</strong></div>
              <div className="pc-reference-line cycle"><span>Cycle :</span><strong>{product.cycle}</strong></div>
            </div>
            <button className="pc-reference-buy" type="button">Acheter <ChevronRight size={13} /></button>
          </article>
        ))}
      </div>
    </main>
  );
}
