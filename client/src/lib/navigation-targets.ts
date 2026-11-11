export type HistoryTab = "income" | "deposits" | "withdrawals";

export function getHistoryBackPath(search: string): string {
  return new URLSearchParams(search).get("from") === "deposit" ? "/my-page/deposit" : "/my-page/account";
}

export function getHistoryTabPath(tab: HistoryTab, search: string): string {
  const path = tab === "income" ? "/my-page/history" : tab === "deposits" ? "/my-page/deposits-history" : "/my-page/withdrawal-history";
  return new URLSearchParams(search).get("from") === "deposit" ? `${path}?from=deposit` : path;
}

export function getWithdrawalBackPath(search: string): string {
  return new URLSearchParams(search).get("from") === "wallet" ? "/my-page/wallet" : "/my-page/home";
}

export function getWalletBackPath(search: string): string {
  const source = new URLSearchParams(search).get("from");
  if (source === "withdrawal") return "/my-page/withdrawal";
  if (source === "gift-code") return "/my-page/gift-code";
  if (source === "home") return "/my-page/home";
  return "/my-page/account";
}
