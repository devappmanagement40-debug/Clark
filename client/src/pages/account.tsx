import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import {
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  ClipboardList,
  CloudDownload,
  Handshake,
  House,
  Languages,
  Loader2,
  Mail,
  Power,
  ReceiptText,
  Shield,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PATH } from "@/lib/admin-path";
import { formatPublicUserId } from "@shared/public-user-id";
import { getHighestPurchasedVipLevel } from "@shared/vip-level";
import duluxLogo from "@/assets/images/dulux-logo.png";
import duluxBackdrop from "@/assets/images/home-products/dulux-product-2.webp";
import "./account.css";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    _installPrompt?: InstallPromptEvent | null;
    _appInstalled?: boolean;
  }
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showLanguageInfo, setShowLanguageInfo] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const { data: apiCountries } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const {
    data: purchasedProducts,
    isLoading: purchasedProductsLoading,
    isError: purchasedProductsError,
  } = useQuery<Array<{ vipLevel?: number }>>({
    queryKey: ["/api/user/products"],
    enabled: !!user,
  });
  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) {
        const data = await res.json();
         throw new Error(data.message || "Le code PIN administrateur est incorrect.");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setAdminPin("");
      navigate(ADMIN_PATH);
    },
    onError: (error: Error) =>
      toast({
        title: "Vérification du code PIN impossible",
        description: error.message,
        variant: "destructive",
      }),
  });

  if (!user) return null;

  const country = getCountryByCode(user.country, apiCountries);
  const currency = country?.currency || "XOF";
  const balance = Number(user.earningsBalance || 0);
  const depositBalance = Number(user.depositBalance || 0);
  const totalIncome = Number(user.totalEarnings || 0);
  const phonePrefix = country?.phonePrefix || "";
  const phoneDigits = String(user.phone || "").replace(/\D/g, "");
  const prefixDigits = phonePrefix.replace(/\D/g, "");
  const displayPhone = user.phone?.startsWith("+")
    ? user.phone
    : prefixDigits && !phoneDigits.startsWith(prefixDigits)
      ? `+${prefixDigits} ${user.phone}`
      : user.phone;
  const formatAmount = (amount: number) =>
    Number.isFinite(amount) ? `${Math.round(amount).toLocaleString("fr-FR")} ${currency}` : "—";
  const vipLevel = getHighestPurchasedVipLevel(purchasedProducts || []);
  const vipBadge = purchasedProductsLoading
    ? "VIP…"
    : purchasedProductsError || !purchasedProducts
      ? "VIP —"
      : `VIP ${vipLevel}`;

  const serviceItems = [
    { label: "Messages", icon: Mail, action: "messages" as const },
    { label: "Informations personnelles", icon: UserRound, action: "profile" as const },
    { label: "Détails des revenus", icon: ChartNoAxesColumnIncreasing, href: "/history" },
    { label: "Détails des dépôts", icon: ReceiptText, href: "/deposits-history" },
    { label: "Détails des retraits", icon: ClipboardList, href: "/withdrawal-history" },
    { label: "Mission partenaires", icon: Handshake, href: "/my-page/partner-missions" },
    { label: "À propos", icon: House, href: "/about" },
    { label: "Télécharger", icon: CloudDownload, action: "download" as const },
    { label: "Langue", icon: Languages, action: "language" as const },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleServiceClick = (item: (typeof serviceItems)[number]) => {
    if ("href" in item && item.href) {
      navigate(item.href);
      return;
    }

    switch (item.action) {
      case "messages":
        navigate("/messages");
        break;
      case "profile":
        navigate("/personal-information");
        break;
      case "download":
        void handleDownload();
        break;
      case "language":
        setShowLanguageInfo(true);
        break;
    }
  };

  const handleAdminClick = () => {
    if (user.isAdminPasswordRequired === false) {
      navigate(ADMIN_PATH);
      return;
    }
    setShowPinModal(true);
  };

  const handleDownload = async () => {
    const isInstalled =
      window._appInstalled ||
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    if (isInstalled) {
      toast({
        title: "DULUX DT est déjà installée",
        description: "Vous pouvez ouvrir l’application depuis l’écran d’accueil de votre appareil.",
      });
      return;
    }

    const installPrompt = window._installPrompt;
    if (installPrompt) {
      window._installPrompt = null;
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        toast(
          outcome === "accepted"
            ? {
                title: "Installation lancée",
                description: "DULUX DT est en cours d’installation sur votre appareil.",
              }
            : {
                title: "Installation annulée",
                description: "Vous pourrez relancer l’installation depuis ce bouton.",
              },
        );
      } catch {
        toast({
          title: "Installation indisponible",
          description: "Ouvrez le menu de votre navigateur et choisissez « Installer l’application ».",
          variant: "destructive",
        });
      }
      return;
    }

    const isIos =
      /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    toast({
      title: "Installer DULUX DT",
      description: isIos
        ? "Dans Safari, touchez Partager puis « Sur l’écran d’accueil »."
        : "Dans le menu de votre navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».",
    });
  };

  return (
    <main className="cp-account">
      <div className="cp-account-shell">
        <section className="cp-account-header" aria-label="Informations du compte">
          <div className="cp-account-cover" aria-hidden="true">
            <img src={duluxBackdrop} alt="" />
          </div>
          <div className="cp-profile-row">
            <div className="cp-profile-avatar">
              <img src={duluxLogo} alt="" />
              <span className="cp-account-level">{vipBadge}</span>
            </div>
            <div className="cp-profile-copy">
              <p className="cp-account-phone">{displayPhone || "Téléphone non renseigné"}</p>
              <span className="cp-account-id">ID {formatPublicUserId(user.id)}</span>
            </div>
          </div>
          <section className="cp-account-summaries" aria-label="Résumé du compte">
            <div className="cp-account-summary">
              <strong>{formatAmount(balance)}</strong>
              <span>Solde</span>
            </div>
            <div className="cp-account-summary">
              <strong>{formatAmount(depositBalance)}</strong>
              <span>Dépôt</span>
            </div>
            <div className="cp-account-summary">
              <strong>{formatAmount(totalIncome)}</strong>
              <span>Revenus totaux</span>
            </div>
          </section>
        </section>

        <nav className="cp-account-services" aria-label="Menu du compte">
          <div className="cp-services-list">
            {serviceItems.map((item) => {
              const Icon = item.icon;
              return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleServiceClick(item)}
                data-testid={`account-menu-${item.label.toLowerCase().replaceAll(" ", "-")}`}
              >
                <span className="cp-service-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>{item.label}</span>
                <ChevronRight className="cp-service-chevron" aria-hidden="true" />
              </button>
              );
            })}
            {user.isAdmin && (
              <button className="cp-admin-row" type="button" onClick={handleAdminClick} data-testid="button-admin">
                <span className="cp-service-icon"><Shield aria-hidden="true" /></span>
                <span>Accès administrateur</span>
                <ChevronRight className="cp-service-chevron" aria-hidden="true" />
              </button>
            )}
            <button className="cp-logout-row" type="button" onClick={() => void handleLogout()} data-testid="button-logout">
              <span className="cp-service-icon">
                <Power aria-hidden="true" />
              </span>
              <span>Déconnexion</span>
              <ChevronRight className="cp-service-chevron" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </div>

      <Dialog open={showLanguageInfo} onOpenChange={setShowLanguageInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Langue</DialogTitle>
          </DialogHeader>
          <div className="cp-language-current">
            <Languages aria-hidden="true" />
            <span>Français</span>
            <strong>Actif</strong>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            L’application est actuellement affichée en français.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Code d'accès administrateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Entrez votre code PIN pour accéder au panel administrateur
            </p>
            <Input
              type="password"
              value={adminPin}
              onChange={(event) => setAdminPin(event.target.value)}
              placeholder="Code PIN"
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) {
                  toast({ title: "Le code PIN doit contenir au moins 4 caractères", variant: "destructive" });
                  return;
                }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full bg-[#1947b8] hover:bg-[#12358f]"
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}