export type HistoryTab = "income" | "deposits" | "withdrawals";

export function getHistoryBackPath(search: string): string {
  return new URLSearchParams(search).get("from") === "deposit" ? "/deposit" : "/account";
}

export function getHistoryTabPath(tab: HistoryTab, search: string): string {
  const path = tab === "income" ? "/history" : tab === "deposits" ? "/deposits-history" : "/withdrawal-history";
  return new URLSearchParams(search).get("from") === "deposit" ? `${path}?from=deposit` : path;
}

export function getWithdrawalBackPath(search: string): string {
  return new URLSearchParams(search).get("from") === "wallet" ? "/wallet" : "/my-page";
}

export function getWalletBackPath(search: string): string {
  const source = new URLSearchParams(search).get("from");
  if (source === "withdrawal") return "/withdrawal";
  if (source === "gift-code") return "/gift-code";
  if (source === "home") return "/my-page";
  return "/account";
}
