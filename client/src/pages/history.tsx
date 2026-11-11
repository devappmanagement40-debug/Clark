import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { withProcessingIndicator } from "@/lib/queryClient";
import { getHistoryBackPath, getHistoryTabPath, type HistoryTab } from "@/lib/navigation-targets";
import BottomNav from "@/components/bottom-nav";
import duluxLogo from "@/assets/images/dulux-logo.png";

interface Deposit {
  id: number;
  userId: number;
  amount: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  canVerifyPayment?: boolean;
  soleaspayReference?: string;
  soleaspayOrderId?: string;
  reference?: string;
  inpayOrderNumber?: string;
  inpayOutTradeNo?: string;
  omnipayId?: string;
  omnipayReference?: string;
  sendavapayReference?: string;
  westpayReference?: string;
  ashtechReference?: string;
  ashtechTransactionId?: string;
}

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  status: string;
  createdAt: string;
  sendavapayReference?: string;
  inpayOrderNumber?: string;
  inpayOutTradeNo?: string;
  omnipayId?: string;
  omnipayReference?: string;
}

interface IncomeTransaction {
  id: number;
  type: string;
  amount: string | number;
  description: string;
  createdAt: string;
  walletImpact?: string | null;
}

type ActiveTab = HistoryTab;
type IncomeScope = "mine" | "subordinate";

const CARD_ORANGE = "#00317d";
const CARD_SUCCESS = "#43a66c";
const LEDGER_EXCLUDED_TYPES = new Set([
  "commission",
  "deposit_commission",
  "deposit",
  "bonus",
  "purchase",
  "staking",
  "withdrawal_refund",
]);

const formatLedgerDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case "completed":
    case "approved":
      return { label: "Succès", color: CARD_SUCCESS };
    case "rejected":
      return { label: "Paiement échoué", color: "#b42318" };
    case "processing":
      return { label: "En traitement", color: "#24568e" };
    default:
      return { label: "En attente", color: "#24568e" };
  }
};

const getWithdrawalStatusInfo = (status: string) => {
  return getStatusInfo(status);
};

const transactionDelta = (transaction: IncomeTransaction) => {
  if (transaction.walletImpact) {
    try {
      const impact = JSON.parse(transaction.walletImpact);
      const deltas = [impact.earningsDelta, impact.legacyEarningsDelta].map(Number);
      if (deltas.every(Number.isFinite)) return deltas.reduce((sum, value) => sum + value, 0);
    } catch {
      // Older ledger rows may contain no valid wallet breakdown; use their recorded amount.
    }
  }
  if (["deposit", "bonus", "purchase", "staking"].includes(transaction.type)) return 0;
  return Number(transaction.amount) || 0;
};

const formatLedgerAmount = (value: number) =>
  Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

function MovementHistoryCard({
  title,
  amount,
  currency,
  date,
  status,
  verify,
}: {
  title: string;
  amount: string;
  currency: string;
  date: string;
  status: { label: string; color: string };
  verify?: { busy: boolean; onClick: () => void };
}) {
  return (
    <article className="movement-history-card">
      <div className="movement-history-logo">
        <img src={duluxLogo} alt="Dulux" />
      </div>
      <div className="movement-history-body">
        <div className="movement-history-row">
          <strong>{title}</strong>
          <strong className="movement-history-amount">{currency} {amount}</strong>
        </div>
        <div className="movement-history-row movement-history-subrow">
          <time>{date}</time>
          <span className="movement-history-status" style={{ color: status.color }}>{status.label}</span>
        </div>
        {verify ? (
          <button
            className="history-verify"
            type="button"
            onClick={verify.onClick}
            disabled={verify.busy}
          >
            {verify.busy ? <Loader2 className="inline animate-spin" /> : <RefreshCw className="mr-1 inline h-3 w-3" />}
            Vérifier le paiement
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [incomeScope, setIncomeScope] = useState<IncomeScope>("mine");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const historyBackHref = getHistoryBackPath(window.location.search);
  const activeTab: ActiveTab = location === "/deposits-history" || location === "/deposit-history"
    ? "deposits"
    : location === "/withdrawal-history"
      ? "withdrawals"
      : "income";

  const isAdmin = !!(user as any)?.isAdmin;
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = countryInfo?.currency === "XOF" || countryInfo?.currency === "XAF"
    ? "FCFA"
    : countryInfo?.currency || "FCFA";

  const {
    data: deposits = [],
    isLoading: depositsLoading,
    isError: depositsError,
    refetch: refetchDeposits,
  } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
    enabled: !!user && activeTab === "deposits",
  });

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    isError: withdrawalsError,
    refetch: refetchWithdrawals,
  } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
    enabled: !!user && activeTab === "withdrawals",
  });
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery<IncomeTransaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user && activeTab === "income",
  });
  const sortedTransactions = [...transactions].sort((first, second) =>
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime() || second.id - first.id,
  );
  const balanceAfterTransaction = new Map<number, number>();
  let runningBalance = Number(user?.earningsBalance);
  if (!Number.isFinite(runningBalance)) {
    runningBalance = Math.max(0, Number(user?.balance || 0) - Number(user?.depositBalance || 0));
  }
  for (const transaction of sortedTransactions) {
    balanceAfterTransaction.set(transaction.id, runningBalance);
    runningBalance -= transactionDelta(transaction);
  }
  const personalIncome = sortedTransactions.filter((transaction) =>
    !LEDGER_EXCLUDED_TYPES.has(transaction.type) &&
    (transaction.type === "withdrawal" || transactionDelta(transaction) > 0),
  );
  const subordinateIncome = sortedTransactions.filter((transaction) =>
    (transaction.type === "commission" || transaction.type === "deposit_commission") &&
    Number(transaction.amount) > 0,
  );

  const isPendingDeposit = (deposit: Deposit) =>
    (deposit.status === "pending" || deposit.status === "processing") &&
    (Boolean(deposit.canVerifyPayment) ||
      Boolean(
        isAdmin &&
          !deposit.sendavapayReference &&
          (deposit.soleaspayReference ||
            deposit.soleaspayOrderId ||
            deposit.omnipayId ||
            deposit.omnipayReference),
      ));

  const handleVerify = async (depositId: number) => {
    setVerifyingId(depositId);
    try {
      await withProcessingIndicator(async () => {
        const response = await fetch(`/api/deposits/${depositId}/verify`, { credentials: "include" });
        const data = await response.json();
        if (data.status === "approved") {
          toast({ title: "Paiement confirmé", description: "Votre compte a été crédité" });
          refreshUser();
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
        } else if (data.status === "rejected") {
          toast({ title: "Paiement échoué", description: "Le paiement a été refusé", variant: "destructive" });
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
        } else {
          toast({ title: "En cours", description: "Le paiement est toujours en attente" });
        }
      });
    } catch {
      toast({ title: "Vérification du paiement impossible", description: "Impossible de vérifier le paiement", variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  };

  if (!user) return null;

  const incomeTransactions = incomeScope === "mine" ? personalIncome : subordinateIncome;
  const isLoading = activeTab === "income"
    ? transactionsLoading
    : activeTab === "deposits"
      ? depositsLoading
      : withdrawalsLoading;
  const isError = activeTab === "income"
    ? transactionsError
    : activeTab === "deposits"
      ? depositsError
      : withdrawalsError;
  const refetchActive = activeTab === "income"
    ? refetchTransactions
    : activeTab === "deposits"
      ? refetchDeposits
      : refetchWithdrawals;
  const pageTitle = activeTab === "income"
    ? "Détails du solde"
    : activeTab === "deposits"
      ? "Historique des dépôts"
      : "Historique des retraits";

  const changeTab = (tab: ActiveTab) => {
    navigate(getHistoryTabPath(tab, window.location.search));
  };

  return (
    <main className="history-page">
      <style>{`
        .history-page {
          width: 100%;
          min-height: 100dvh;
          overflow-x: hidden;
          background: #fff;
          color: #111827;
          font-family: Arial, sans-serif;
        }
        .history-page *,
        .history-page *::before,
        .history-page *::after {
          box-sizing: border-box;
        }
        .history-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          background: #fff;
        }
        .history-header {
          position: relative;
          display: flex;
          min-height: 78px;
          align-items: center;
          padding: 17px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-back {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0;
          background: #fff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          cursor: pointer;
        }
        .history-back svg {
          width: 22px;
          height: 22px;
          stroke-width: 2.5;
        }
        .history-title {
          position: absolute;
          right: 70px;
          left: 70px;
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          text-align: center;
        }
        .history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          align-items: center;
          min-height: 78px;
          padding: 12px 16px 16px;
          border-bottom: 2px solid #111827;
        }
        .history-tab {
          display: flex;
          min-width: 0;
          height: 46px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 8px;
          background: #ffffff;
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .history-tab.active {
          background: #1947b8;
          color: #ffffff;
          font-weight: 700;
        }
        .history-tab-arrow {
          width: 17px;
          height: 17px;
          color: #111827;
          stroke-width: 2.8;
        }
        .history-tab-arrow.left {
          transform: rotate(180deg);
        }
        .history-content {
          min-height: calc(100dvh - 156px);
          padding: 18px 16px 40px;
          background: #edf2ff;
        }
        .history-list {
          display: grid;
          gap: 16px;
        }
        .history-card {
          position: relative;
          width: 100%;
          min-height: 154px;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          padding: 0 16px 16px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .12);
        }
        .withdrawal-receipt-card {
          min-height: 0;
          padding: 0 16px 16px;
          border-color: #17191c;
          border-radius: 15px;
          box-shadow: 0 4px 0 #17191c, 0 9px 18px rgba(17, 24, 39, .14);
        }
        .withdrawal-receipt-header {
          display: flex;
          min-height: 64px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          border-bottom: 1.5px solid #e8cbd1;
          padding: 12px 16px;
          background: #ffffff;
        }
        .withdrawal-receipt-reference {
          min-width: 0;
          margin: 0;
          color: #252327;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .withdrawal-receipt-status {
          display: inline-flex;
          min-height: 31px;
          align-items: center;
          flex: 0 0 auto;
          border: 1.5px solid #17191c;
          border-radius: 999px;
          padding: 0 10px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
        }
        .withdrawal-receipt-rows {
          display: grid;
          gap: 10px;
          padding-top: 13px;
        }
        .withdrawal-receipt-card .history-row {
          min-height: 22px;
          justify-content: flex-start;
          gap: 9px;
          font-size: 14px;
          line-height: 1.35;
        }
        .withdrawal-receipt-card .history-row > span:first-child {
          flex: 0 0 86px;
          color: #6d6970;
          font-weight: 600;
        }
        .withdrawal-receipt-card .history-row > span:last-child {
          min-width: 0;
          color: #92263d;
          font-weight: 800;
          text-align: left;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .withdrawal-receipt-card .history-row:last-child > span:last-child {
          color: #252327;
          font-weight: 600;
        }
        .history-card-top {
          display: flex;
          min-height: 76px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 0 -16px;
          padding: 14px 16px 13px;
          border-bottom: 2px solid #111827;
          background: ${CARD_ORANGE};
        }
        .history-amount {
          margin: 0;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.15;
        }
        .history-card-label {
          margin: 6px 0 0;
          color: #111827;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.15;
        }
        .history-status {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          flex: 0 0 auto;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 0 11px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        .history-divider {
          height: 0;
          margin: 14px 0 9px;
          border-top: 2px dashed #9ca3af;
        }
        .history-row {
          display: flex;
          min-height: 21px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #111827;
          font-size: 14px;
          line-height: 1.2;
        }
        .history-row > span:first-child {
          color: #4b5563;
          font-weight: 700;
        }
        .history-row > span:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .history-empty {
          display: flex;
          min-height: 320px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 4px 0 #111827;
          color: #4b5563;
          font-size: 14px;
        }
        .history-empty img {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }
        .history-verify {
          width: 100%;
          margin-top: 10px;
          min-height: 44px;
          border: 2px solid #111827;
          border-radius: 11px;
          padding: 9px 12px;
          background: ${CARD_ORANGE};
          box-shadow: 0 3px 0 #111827;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .history-verify:disabled { cursor: wait; opacity: .7; }
        @media (max-width: 370px) {
          .history-header { height: 62px; padding-top: 6px; }
          .history-title { font-size: 19px; }
          .history-tabs { min-height: 58px; padding-bottom: 11px; }
          .history-tab { font-size: 14px; }
          .history-content { min-height: calc(100dvh - 120px); padding-right: 16px; padding-left: 16px; }
           .history-card { padding-right: 18px; padding-left: 18px; }
          .withdrawal-receipt-card { padding-right: 14px; padding-left: 14px; }
          .withdrawal-receipt-header { margin-right: -14px; margin-left: -14px; padding-right: 14px; padding-left: 14px; }
          .withdrawal-receipt-reference { font-size: 13px; }
          .withdrawal-receipt-card .history-row > span:first-child { flex-basis: 78px; }
          .history-card-label { font-size: 15px; }
          .history-status { font-size: 12px; padding-right: 8px; padding-left: 8px; }
          .history-row { font-size: 13px; }
        }
        .history-page {
          background: #f0f1f8;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .history-screen {
          padding-bottom: calc(72px + env(safe-area-inset-bottom));
          background: #f0f1f8;
        }
        .history-header {
          min-height: 48px;
          justify-content: center;
          padding: 0 54px;
          border: 0;
          background: #00317d;
        }
        .history-back {
          position: absolute;
          left: 10px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          box-shadow: none;
          color: #fff;
        }
        .history-title {
          right: 54px;
          left: 54px;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
        }
        .history-tabs {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          min-height: 0;
          padding: 18px 16px 0;
          border: 0;
          background: #f0f1f8;
        }
        .history-tab {
          height: 44px;
          border: 0;
          border-radius: 6px;
          padding: 0 6px;
          background: #fff;
          box-shadow: none;
          color: #123a78;
          font-size: 12px;
          font-weight: 500;
        }
        .history-tab.active {
          background: #00317d;
          color: #fff;
          font-weight: 600;
        }
        .income-history-panel {
          min-height: 412px;
          margin: 18px 18px 0;
          border-radius: 14px;
          padding: 16px;
          background: #fff;
        }
        .income-history-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 34px;
          overflow: hidden;
          border: 1px solid #123a78;
          border-radius: 3px;
        }
        .income-history-tab {
          min-width: 0;
          border: 0;
          padding: 5px 7px;
          background: #fff;
          color: #123a78;
          font-size: 12px;
          font-weight: 500;
        }
        .income-history-tab + .income-history-tab {
          border-left: 1px solid #123a78;
        }
        .income-history-tab.active {
          background: #00317d;
          color: #fff;
          font-weight: 700;
        }
        .income-history-content {
          display: flex;
          min-height: 360px;
          flex-direction: column;
        }
        .income-history-content > .history-no-data {
          align-self: center;
          margin: auto 0;
        }
        .history-content {
          display: flex;
          min-height: calc(100dvh - 170px);
          flex-direction: column;
          justify-content: center;
          padding: 0 18px 70px;
          background: #f0f1f8;
        }
        .history-no-data {
          margin: 0;
          color: #b5b5bd;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: .22em;
          line-height: 1.2;
          text-align: center;
        }
        .history-state {
          display: grid;
          min-height: 300px;
          place-items: center;
          color: #00317d;
        }
        .history-error {
          display: grid;
          justify-items: center;
          gap: 12px;
          border-radius: 12px;
          padding: 20px;
          background: #fff;
          color: #344b60;
          text-align: center;
        }
        .history-error button {
          min-height: 40px;
          border: 0;
          border-radius: 999px;
          padding: 0 18px;
          background: #00317d;
          color: #fff;
          font-weight: 700;
        }
        .history-list { gap: 12px; }
        .history-card {
          min-height: 0;
          border: 1px solid #e0e5ed;
          border-radius: 12px;
          padding: 0 14px 14px;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .history-card-top {
          min-height: 64px;
          border: 0;
          border-radius: 0;
          padding: 12px 14px;
          background: #00317d;
          color: #fff;
        }
        .history-amount,
        .history-card-label { color: #fff; }
        .history-status,
        .withdrawal-receipt-status {
          border: 0;
          border-radius: 999px;
          font-weight: 700;
        }
        .history-divider { border-color: #d7deea; }
        .withdrawal-receipt-card {
          border-color: #e0e5ed;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .withdrawal-receipt-header {
          border-bottom-color: #e0e5ed;
          background: #fff;
        }
        .withdrawal-receipt-card .history-row > span:last-child {
          color: #123a78;
        }
        .history-verify {
          min-height: 44px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(105deg, #0c3a83 0%, #5273a7 100%);
          box-shadow: 0 3px 8px rgb(13 48 104 / 18%);
          color: #fff;
        }
        @media (max-width: 370px) {
          .history-tabs { gap: 7px; padding-right: 12px; padding-left: 12px; }
          .history-tab { padding: 0 4px; font-size: 11px; }
          .income-history-panel { margin-right: 12px; margin-left: 12px; padding: 13px; }
          .income-history-tab { font-size: 11px; }
        }
        .history-content {
          justify-content: flex-start;
          padding-top: 12px;
        }
        .history-content > .history-no-data,
        .history-content > .history-state,
        .history-content > .history-error {
          margin-top: auto;
          margin-bottom: auto;
        }
        .history-list { gap: 16px; }
        .movement-history-card {
          display: flex;
          min-height: 94px;
          overflow: hidden;
          border: 3px solid #0c3676;
          border-radius: 13px;
          padding: 3px;
          background: #0c3676;
        }
        .movement-history-logo {
          display: grid;
          width: 88px;
          flex: 0 0 88px;
          place-items: center;
          overflow: hidden;
          background: #0c3676;
        }
        .movement-history-logo img {
          display: block;
          width: 78px;
          height: 78px;
          object-fit: cover;
        }
        .movement-history-body {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
          border-radius: 7px;
          padding: 12px 13px;
          background: #f3f5fa;
        }
        .movement-history-row {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #123963;
          font-size: 13px;
          line-height: 1.2;
        }
        .movement-history-row strong { font-weight: 700; }
        .movement-history-amount {
          flex: 0 0 auto;
          color: #15191f;
          font-size: 14px;
          font-weight: 700;
        }
        .movement-history-subrow time {
          overflow: hidden;
          color: #9ba3ad;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .movement-history-status {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 700;
        }
        .movement-history-body .history-verify {
          width: auto;
          min-height: 31px;
          margin-top: 0;
          align-self: flex-start;
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 11px;
        }
        .income-history-content:has(.income-ledger-list) {
          min-height: 0;
        }
        .income-ledger-list {
          display: grid;
          gap: 15px;
          padding: 16px 0 8px;
        }
        .income-ledger-card {
          display: grid;
          min-height: 80px;
          align-content: center;
          gap: 12px;
          border-radius: 8px;
          padding: 13px 12px;
          background: #f5f5f5;
          color: #1f252d;
        }
        .income-ledger-row {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          line-height: 1.25;
        }
        .income-ledger-description {
          min-width: 0;
          overflow-wrap: anywhere;
          font-size: 13px;
          font-weight: 500;
        }
        .income-ledger-row time {
          flex: 0 0 auto;
          color: #262a30;
          font-size: 11px;
          white-space: nowrap;
        }
        .income-ledger-amount-row span {
          color: #17395e;
          text-align: right;
          white-space: nowrap;
        }
        .income-ledger-credit,
        .income-ledger-debit {
          color: #17395e;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
        .income-ledger-debit { color: #17395e; }
        @media (max-width: 370px) {
          .movement-history-logo { width: 72px; flex-basis: 72px; }
          .movement-history-logo img { width: 66px; height: 66px; }
          .movement-history-body { gap: 10px; padding-right: 9px; padding-left: 9px; }
          .movement-history-row { gap: 6px; font-size: 12px; }
          .movement-history-amount { font-size: 13px; }
          .movement-history-subrow time { font-size: 10px; }
          .income-ledger-row { gap: 6px; font-size: 12px; }
          .income-ledger-row time { font-size: 10px; }
          .income-ledger-amount-row span,
          .income-ledger-credit,
          .income-ledger-debit { font-size: 12px; }
        }
      `}</style>

      <div className="history-screen">
        <header className="history-header">
          <Link href={historyBackHref}>
            <button className="history-back" data-testid="button-back" aria-label="Retour">
              <ChevronLeft aria-hidden="true" />
            </button>
          </Link>
          <h1 className="history-title">{pageTitle}</h1>
        </header>

        <nav className="history-tabs" aria-label="Type d'enregistrement">
          <button
            className={`history-tab ${activeTab === "income" ? "active" : ""}`}
            onClick={() => changeTab("income")}
            aria-current={activeTab === "income" ? "page" : undefined}
            data-testid="tab-income"
          >
            Détails revenus
          </button>
          <button
            className={`history-tab ${activeTab === "deposits" ? "active" : ""}`}
            onClick={() => changeTab("deposits")}
            aria-current={activeTab === "deposits" ? "page" : undefined}
            data-testid="tab-deposits"
          >
            Dépôt
          </button>
          <button
            className={`history-tab ${activeTab === "withdrawals" ? "active" : ""}`}
            onClick={() => changeTab("withdrawals")}
            aria-current={activeTab === "withdrawals" ? "page" : undefined}
            data-testid="tab-withdrawals"
          >
            Retrait
          </button>
        </nav>

        {activeTab === "income" ? (
          <section className="income-history-panel" aria-label="Détails des revenus" aria-live="polite">
            <nav className="income-history-tabs" aria-label="Type de revenus">
              <button
                type="button"
                className={`income-history-tab ${incomeScope === "mine" ? "active" : ""}`}
                onClick={() => setIncomeScope("mine")}
                aria-pressed={incomeScope === "mine"}
              >
                Mes revenus
              </button>
              <button
                type="button"
                className={`income-history-tab ${incomeScope === "subordinate" ? "active" : ""}`}
                onClick={() => setIncomeScope("subordinate")}
                aria-pressed={incomeScope === "subordinate"}
              >
                Revenus des filleuls
              </button>
            </nav>
            <div className="income-history-content">
              {isLoading ? (
                <div className="history-state" role="status"><Loader2 className="animate-spin" /></div>
              ) : isError ? (
                <div className="history-error" role="alert">
                  <span>Impossible de charger les revenus.</span>
                  <button type="button" onClick={() => void refetchActive()}>Réessayer</button>
                </div>
              ) : incomeTransactions.length === 0 ? (
                <p className="history-no-data" role="status">NO DATA</p>
              ) : (
                <div className="income-ledger-list">
                  {incomeTransactions.map((transaction) => {
                    const amount = Number(transaction.amount) || 0;
                    const balance = balanceAfterTransaction.get(transaction.id) ?? 0;
                    return (
                      <article className="income-ledger-card" key={transaction.id} data-testid={`income-item-${transaction.id}`}>
                        <div className="income-ledger-row">
                          <strong className="income-ledger-description">
                            {transaction.description || (incomeScope === "mine" ? "Mouvement du compte" : "Commission de parrainage")}
                          </strong>
                          <time>{formatLedgerDateTime(transaction.createdAt)}</time>
                        </div>
                        <div className="income-ledger-row income-ledger-amount-row">
                          <strong className={amount < 0 ? "income-ledger-debit" : "income-ledger-credit"}>
                            {amount > 0 ? "+ " : amount < 0 ? "− " : ""}{formatLedgerAmount(amount)} {currency}
                          </strong>
                          <span>Solde retirable : {formatLedgerAmount(balance)} {currency}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="history-content" aria-live="polite">
            {isLoading ? (
              <div className="history-state" role="status"><Loader2 className="animate-spin" /></div>
            ) : isError ? (
              <div className="history-error" role="alert">
                <span>Impossible de charger l’historique.</span>
                <button type="button" onClick={() => void refetchActive()}>Réessayer</button>
              </div>
            ) : activeTab === "deposits" ? (
              deposits.length > 0 ? (
                <div className="history-list">
                  {deposits.map((deposit) => {
                    const { label, color } = getStatusInfo(deposit.status);
                    const amount = Number.parseFloat(deposit.amount);
                    return (
                      <div key={deposit.id} data-testid={`deposit-item-${deposit.id}`}>
                        <MovementHistoryCard
                          title="Dépôt"
                          amount={formatLedgerAmount(amount)}
                          currency={currency}
                          date={formatLedgerDateTime(deposit.createdAt)}
                          status={{ label, color }}
                          verify={isPendingDeposit(deposit) ? {
                            busy: verifyingId === deposit.id,
                            onClick: () => handleVerify(deposit.id),
                          } : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="history-no-data" role="status">NO DATA</p>
              )
            ) : withdrawals.length > 0 ? (
              <div className="history-list">
                {withdrawals.map((withdrawal) => {
                  const { label, color } = getWithdrawalStatusInfo(withdrawal.status);
                  const gross = Number.parseFloat(withdrawal.amount);
                  return (
                    <div key={withdrawal.id} data-testid={`withdrawal-item-${withdrawal.id}`}>
                      <MovementHistoryCard
                        title="Retrait"
                        amount={formatLedgerAmount(gross)}
                        currency={currency}
                        date={formatLedgerDateTime(withdrawal.createdAt)}
                        status={{ label, color }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="history-no-data" role="status">NO DATA</p>
            )}
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}