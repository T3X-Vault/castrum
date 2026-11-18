import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Wallet } from "lucide-react";
import {
  connectSolana,
  disconnectSolana,
  insideWalletApp,
  listSolanaWallets,
  mobileWalletLink,
  MOBILE_WALLETS,
  T3X_VAULT_URL,
  type SolanaWallet,
} from "@/lib/wallet/solana";
import { readSession, shortAddress, writeSession, type WalletSession } from "@/lib/wallet/session";
import { BUY_URL, T3X_MINT, t3xBalance } from "@/lib/wallet/t3x";

function onPhone(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function WalletDock() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [linked, setLinked] = useState<WalletSession | null>(null);
  const [wallets, setWallets] = useState<SolanaWallet[]>([]);
  const [inside, setInside] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    setPhone(onPhone());
    setLinked(readSession());
    setWallets(listSolanaWallets());
    setInside(insideWalletApp());
  }, [open]);

  useEffect(() => {
    const refresh = () => {
      setWallets(listSolanaWallets());
      setInside(insideWalletApp());
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  async function onConnect(id: string) {
    setBusy(id);
    setError("");
    try {
      const next = await connectSolana(id);
      const held = await t3xBalance(next.address);
      setBalance(held);
      if (T3X_MINT && (held ?? 0) <= 0) {
        writeSession(null);
        try {
          await disconnectSolana(next.walletName);
        } catch {
          /* refused for lack of T3X */
        }
        setLinked(null);
        setError("This wallet has no T3X. Buy T3X, then connect again.");
        return;
      }
      writeSession(next);
      setLinked(next);
      if (!T3X_MINT) setError("Connected. Holder check turns on when the T3X mint is set.");
    } catch (err) {
      writeSession(null);
      setLinked(null);
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setBusy(null);
    }
  }

  async function onDisconnect() {
    if (linked) await disconnectSolana(linked.walletName);
    writeSession(null);
    setLinked(null);
    setBalance(null);
    setError("");
  }

  const page = typeof window === "undefined" ? "" : window.location.href;
  const sheet = open ? (
    <div className="wallet-back" role="presentation" onClick={() => setOpen(false)}>
      <div
        className="wallet-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Solana only</p>
        <h2 id="wallet-title">T3X wallet</h2>
        <p>
          {inside
            ? `You are inside ${inside}. Connect it below.`
            : phone
              ? "On a phone, open this page in Phantom, Solflare, or Backpack. The app connects from there."
              : "Solana wallets only. Connect is accepted when the wallet holds T3X. Otherwise buy it first."}
        </p>
        {linked && (
          <div className="wallet-linked">
            <p className="latin">{linked.walletName}</p>
            <p className="wallet-address">{linked.address}</p>
            <button type="button" className="ghost danger" data-testid="disconnect-wallet" onClick={() => void onDisconnect()}>
              Disconnect
            </button>
          </div>
        )}
        {!inside && (
          <div className="wallet-apps">
            {MOBILE_WALLETS.map((app) => (
              <a
                key={app.id}
                className={app.id === "phantom" ? "primary" : "ghost"}
                href={page ? mobileWalletLink(app.id, page) : "#"}
              >
                Open {app.name}
              </a>
            ))}
            <a className="ghost" href={T3X_VAULT_URL} target="_blank" rel="noreferrer">
              Open T3x Vault
            </a>
          </div>
        )}
        <p className="wallet-or">Or a browser wallet</p>
        <ul className="wallet-list">
          {wallets.map((w) => (
            <li key={w.id}>
              <button type="button" className="ghost" disabled={busy !== null} onClick={() => void onConnect(w.id)}>
                {busy === w.id ? "Waiting…" : w.name}
              </button>
            </li>
          ))}
          {wallets.length === 0 && (
            <li>No wallet is injected in this browser yet. Open Phantom above, then connect.</li>
          )}
        </ul>
        {BUY_URL ? (
          <a className="primary" href={BUY_URL} target="_blank" rel="noreferrer">
            Buy T3X
          </a>
        ) : (
          <p>Buy opens on Jupiter once the T3X mint is set.</p>
        )}
        {balance != null && <p>Balance {balance} T3X</p>}
        {error && <p className="wallet-error">{error}</p>}
        <button type="button" className="text-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="ghost"
        data-testid="connect-wallet"
        data-connected={linked ? "true" : "false"}
        onClick={() => setOpen(true)}
      >
        <Wallet size={16} aria-hidden="true" />
        {linked ? shortAddress(linked.address) : "Connect wallet"}
      </button>
      {sheet && typeof document !== "undefined" ? createPortal(sheet, document.body) : null}
    </>
  );
}
