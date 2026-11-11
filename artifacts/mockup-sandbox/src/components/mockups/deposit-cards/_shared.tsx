import { useState } from "react";
import { ChevronDown, ChevronLeft, Clock, Coins, CreditCard, Gift } from "lucide-react";

const amountPresets = ["3 000", "3 500", "7 000", "15 000", "30 000", "50 000", "100 000", "200 000", "500 000"];

export function DepositPreview({ strongCards = false }: { strongCards?: boolean }) {
  const [amount, setAmount] = useState("15000");
  const [selectedPreset, setSelectedPreset] = useState("15 000");

  const choosePreset = (preset: string) => {
    setSelectedPreset(preset);
    setAmount(preset.replaceAll(" ", ""));
  };

  return (
    <main className={`recharge-reference${strongCards ? " deposit-cards-strong" : ""}`}>
      <div className="recharge-screen">
        <header className="recharge-hero" aria-label="Dépôt">
          <button className="recharge-back" aria-label="Retour" type="button"><ChevronLeft /></button>
          <h1 className="recharge-title"><Coins aria-hidden="true" /> <span>Recharger</span></h1>
          <button className="history-button" aria-label="Historique des dépôts" type="button"><Clock /></button>
        </header>

        <section className="deposit-intro" aria-label="Minimum de dépôt">
          <p className="deposit-intro-copy">Recharge minimum : 3 000 FCFA</p>
          <Gift className="deposit-intro-icon" aria-hidden="true" />
        </section>

        <section className="account-summary" aria-label="Solde du compte">
          <div>
            <p className="balance-label">Solde du compte :</p>
            <p className="balance-value">800,00 FCFA</p>
          </div>
        </section>

        <section className="amount-panel" aria-label="Montant de recharge">
          <p className="amount-label"><CreditCard className="amount-heading-icon" aria-hidden="true" />Sélectionner le montant de recharge</p>
          <div className="preset-row">
            {amountPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset${selectedPreset === preset ? " active" : ""}`}
                aria-pressed={selectedPreset === preset}
                onClick={() => choosePreset(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="amount-input">
            <span className="currency">FCFA</span>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Montant de recharge"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setSelectedPreset("");
              }}
            />
          </label>
        </section>

        <section className="country-panel" aria-label="Pays et moyens de recharge">
          <h2 className="country-heading">Pays du paiement</h2>
          <button type="button" className="country-select">
            <span>Côte d’Ivoire</span>
            <span className="country-select-prefix">+225</span>
            <ChevronDown aria-hidden="true" />
          </button>
        </section>

        <button className="continue" type="button">Recharger</button>

        <section className="instructions" aria-label="Bon à savoir">
          <h2 className="instructions-title">Rappel important</h2>
          <p className="instruction"><strong>Montant minimum de dépôt :</strong> 3 000 FCFA.</p>
          <p className="instruction"><strong>Vérifiez vos informations de compte</strong> lors du virement pour que votre paiement soit traité correctement.</p>
          <p className="instruction"><strong>Après un virement réussi,</strong> veuillez patienter 10 à 30 minutes.</p>
        </section>
      </div>
    </main>
  );
}
