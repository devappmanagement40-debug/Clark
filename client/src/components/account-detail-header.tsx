import { ChevronLeft } from "lucide-react";
import personalInfoHero from "@/assets/personal-info-hero.png";
import "./account-detail-header.css";

interface AccountDetailHeaderProps {
  title: string;
  onBack: () => void;
  showHero?: boolean;
}

export default function AccountDetailHeader({
  title,
  onBack,
  showHero = false,
}: AccountDetailHeaderProps) {
  return (
    <>
      <header className="cp-account-detail-header">
        <button
          type="button"
          className="cp-account-detail-back"
          onClick={onBack}
          aria-label="Retour"
          data-testid="button-back"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <h1>{title}</h1>
      </header>
      {showHero && (
        <div className="cp-account-detail-hero" aria-hidden="true">
          <img src={personalInfoHero} alt="" />
        </div>
      )}
    </>
  );
}
