import { Copy } from "lucide-react";
import "./_group.css";

const paymentPhone = "NUMÉRO EXEMPLE";

export function Centered() {
  return (
    <main className="min-h-screen bg-[#FF7A14] p-5 font-sans text-[#111827]">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <section
          aria-label="Numéro de paiement"
          className="w-full rounded-2xl border-2 border-[#111827] bg-white p-3 shadow-[0_3px_0_#111827,0_7px_14px_rgba(17,24,39,0.14)]"
        >
          <div className="mb-3 flex flex-col items-center border-b border-gray-200 pb-2.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Numéro de paiement
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#111827]">Togocel</p>
          </div>
          <div className="flex min-h-12 items-center justify-center rounded-xl border-2 border-[#111827] bg-white px-3 py-2 shadow-[0_2px_5px_rgba(17,24,39,0.12)]">
            <p className="break-all text-center font-mono text-xl font-bold tabular-nums tracking-[0.08em] text-[#17324d]">
              {paymentPhone}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(paymentPhone)}
            aria-label={`Copier le numéro ${paymentPhone}`}
            className="mx-auto mt-3 flex h-10 min-w-28 items-center justify-center gap-2 rounded-[11px] border-2 border-[#111827] bg-[#FF7A14] px-4 text-xs font-bold text-[#111827] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] transition duration-150 hover:brightness-95 active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A14] focus-visible:ring-offset-2"
          >
            <Copy aria-hidden="true" className="h-4 w-4" /> Copier
          </button>
        </section>
      </div>
    </main>
  );
}