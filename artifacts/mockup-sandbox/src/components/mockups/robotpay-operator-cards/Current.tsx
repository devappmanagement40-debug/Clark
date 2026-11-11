import { useState } from "react";
import { ChevronRight } from "lucide-react";
import "./_group.css";

type PreviewOperator = {
  id: string;
  name: string;
  provider: "ashtech" | "sendavapay" | "soleaspay" | "clapay";
};

const operators: PreviewOperator[] = [
  { id: "mtn", name: "MTN Mobile Money", provider: "soleaspay" },
  { id: "orange", name: "Orange Money", provider: "soleaspay" },
  { id: "moov", name: "Moov Money", provider: "soleaspay" },
];

const operatorMethodLabel = (item: PreviewOperator) => {
  if (item.provider === "ashtech") return "Mobile Money avec code de confirmation";
  if (item.provider === "clapay") return "Paiement Mobile Money";
  return "Mobile Money avec confirmation sur téléphone";
};

export function Current() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#4b91ef] p-3 sm:p-6">
      <div className="mx-auto max-w-xl">
        <div className="px-5 pb-6 pt-4 text-white">
          <p className="text-xl">Montant :</p>
          <p className="text-4xl font-bold">
            5 000 <span className="text-2xl font-normal">FCFA</span>
          </p>
        </div>
        <section className="space-y-5">
          <p className="px-1 text-xl text-white">Sélectionnez le mode de paiement :</p>
          <div className="space-y-3">
            {operators.map((op, i) => (
              <button
                key={`${op.id || op.name}-${i}`}
                type="button"
                onClick={() => setSelectedId(op.id)}
                className={`w-full flex items-center justify-between rounded-lg px-4 py-4 border-2 text-left ${
                  selectedId === op.id
                    ? "border-[#2885d8] bg-blue-50"
                    : "border-gray-100 bg-white shadow-sm"
                }`}
              >
                <span>
                  <span className="block font-semibold text-lg text-[#14538a]">{op.name}</span>
                  <span className="block text-xs text-gray-500">{operatorMethodLabel(op)}</span>
                </span>
                <ChevronRight className="text-gray-400" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}