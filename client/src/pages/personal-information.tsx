import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import walletIcon from "@/assets/personal-wallet-icon.png";
import lockIcon from "@/assets/personal-lock-icon.png";
import AccountDetailHeader from "@/components/account-detail-header";
import "./personal-information.css";

export default function PersonalInformationPage() {
  const [, navigate] = useLocation();

  return (
    <main className="cp-account-detail cp-personal-information">
      <AccountDetailHeader
        title="Informations personnelles"
        onBack={() => navigate("/account")}
        showHero
      />

      <nav className="cp-personal-options" aria-label="Options personnelles">
        <button
          type="button"
          className="cp-personal-option"
          onClick={() => navigate("/bind-wallet")}
          data-testid="personal-bind-wallet"
        >
          <img className="cp-personal-option-wallet" src={walletIcon} alt="" />
          <span>Lier un portefeuille</span>
          <ChevronRight className="cp-personal-option-chevron" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="cp-personal-option"
          onClick={() => navigate("/change-password")}
          data-testid="personal-change-password"
        >
          <img className="cp-personal-option-password" src={lockIcon} alt="" />
          <span>Changer le mot de passe</span>
          <ChevronRight className="cp-personal-option-chevron" aria-hidden="true" />
        </button>
      </nav>
    </main>
  );
}
