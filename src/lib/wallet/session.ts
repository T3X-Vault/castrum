export type WalletSession = {
  family: "solana";
  address: string;
  walletName: string;
};

const KEY = "castrum.wallet.session";

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function readSession(): WalletSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletSession;
    if (parsed?.family !== "solana" || typeof parsed.address !== "string" || !parsed.address) return null;
    return {
      family: "solana",
      address: parsed.address,
      walletName: typeof parsed.walletName === "string" && parsed.walletName ? parsed.walletName : "Solana wallet",
    };
  } catch {
    return null;
  }
}

export function writeSession(session: WalletSession | null): void {
  if (typeof localStorage === "undefined") return;
  if (!session) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(session));
}
