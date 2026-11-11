import { useState } from "react";
import { ChevronRight } from "lucide-react";
import "./_group.css";

const operators = [
  { id: "mtn", name: "MTN Mobile Money" },
  { id: "orange", name: "Orange Money" },
  { id: "moov", name: "Moov Money" },
];

export function Refined() {
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
            {operators.map((op) => {
              const selected = selectedId === op.id;

              return (
                <button
                  key={op.id}
                  type="button"
                  aria-label={`Sélectionner ${op.name}`}
                  aria-pressed={selected}
                  onClick={() => setSelectedId(op.id)}
                  className={`group flex min-h-[72px] w-full items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 text-left transition duration-200 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c7e3ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4b91ef] ${
                    selected
                      ? "border-[#14538a] bg-[#f3f8ff] ring-2 ring-[#14538a]/15"
                      : "border-white/90 bg-white shadow-[0_8px_20px_rgba(19,69,123,0.16)] hover:-translate-y-0.5 hover:border-[#d7e9fb] hover:shadow-[0_12px_24px_rgba(19,69,123,0.22)]"
                  }`}
                >
                  <span className="min-w-0 flex-1 text-lg font-bold leading-snug text-[#14538a]">
                    {op.name}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      selected
                        ? "translate-x-0.5 text-[#14538a]"
                        : "text-[#6d8aa8] group-hover:translate-x-0.5 group-hover:text-[#14538a]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}