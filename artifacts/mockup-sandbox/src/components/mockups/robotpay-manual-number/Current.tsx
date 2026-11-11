import { Copy } from "lucide-react";
import "./_group.css";

const paymentPhone = "NUMÉRO EXEMPLE";

export function Current() {
  return (
    <main className="min-h-screen bg-white p-5 font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full rounded-xl border border-[#cbd5e1] bg-white p-3 text-left shadow-sm">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="max-w-[55%] truncate text-xs font-semibold text-[#14538a]">Togocel</p>
            <p className="shrink-0 text-[10px] font-medium text-slate-500">Numéro de paiement</p>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border-2 border-[#7894af] bg-[#f8fbff] px-2.5 py-1.5">
            <p className="min-w-0 flex-1 break-all font-mono text-base font-bold tabular-nums tracking-wide text-[#17324d]">
              {paymentPhone}
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(paymentPhone)}
              aria-label={`Copier le numéro ${paymentPhone}`}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#14538a] bg-[#14538a] px-2 text-[11px] font-semibold text-white transition hover:bg-[#104674] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fc4d8]"
            >
              <Copy aria-hidden="true" className="h-3.5 w-3.5" /> Copier
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}