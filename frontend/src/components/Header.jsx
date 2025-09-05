// src/components/Header.jsx
import { useState } from 'react';
import Navbar from './Navbar';
import { useAccount } from "../hooks/useAccount.js";
import { openBillingPortal } from "../api/account.js";

export default function Header({ darkMode, setDarkMode }) {
  const { loading, account } = useAccount();
  const planKey = (account?.user?.plan || "FREE").toUpperCase();

  return (
    <header className={`w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between bg-gray-800 text-white shadow-md`}>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 mb-2 sm:mb-0">
        <span className="text-3xl">♻️</span> IV <span className="text-cyan-400">Content</span>
      </h1>

      <div className="flex items-center gap-4">
        {/* Account pill */}
        {!loading && account && (
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-gray-100/10 border border-white/20">
              {planKey}
            </span>
            {planKey === "PRO" && (
              <button
                className="px-2 py-1 rounded border border-white/20 hover:bg-white/10 transition"
                onClick={() => openBillingPortal().catch(err => alert(err.message))}
                title="Manage subscription"
              >
                Manage Billing
              </button>
            )}
          </div>
        )}

        {/* Existing nav */}
        <Navbar />
      </div>
    </header>
  );
}

