'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  note: string;
  type: 'INCOME' | 'EXPENSE';
  transaction_date: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface Family {
  id: string;
  name: string;
  invite_code: string;
}

const INCOME_KEYWORDS = ['lương', 'salary', 'thưởng', 'bonus', 'thu nhập', 'freelance', 'bán', 'hoàn tiền', 'lãi'];
const EXPENSE_KEYWORDS = ['coffee', 'cafe', 'ăn', 'mua', 'grab', 'taxi', 'xăng', 'điện', 'nước', 'breakfast', 'lunch', 'dinner', 'trà sữa'];

function detectType(text: string): 'INCOME' | 'EXPENSE' | null {
  const lower = text.toLowerCase();
  for (const kw of INCOME_KEYWORDS) if (lower.includes(kw)) return 'INCOME';
  for (const kw of EXPENSE_KEYWORDS) if (lower.includes(kw)) return 'EXPENSE';
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [family, setFamily] = useState<Family | null>(null);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick input state
  const [quickInput, setQuickInput] = useState('');
  const [detectedType, setDetectedType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [overrideType, setOverrideType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDetectedType(detectType(quickInput));
    if (detectType(quickInput)) setOverrideType(null);
  }, [quickInput]);

  async function fetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      // Fetch family
      const familyRes = await fetch('http://localhost:3001/api/families/me', { headers });
      const familyData = await familyRes.json();
      
      if (!familyData.data) {
        router.push('/onboarding');
        return;
      }
      setFamily(familyData.data);

      // Fetch summary
      const summaryRes = await fetch('http://localhost:3001/api/transactions/summary', { headers });
      const summaryData = await summaryRes.json();
      if (summaryData.success) setSummary(summaryData.data);

      // Fetch recent transactions
      const txRes = await fetch('http://localhost:3001/api/transactions?limit=5', { headers });
      const txData = await txRes.json();
      if (txData.success) setRecentTx(txData.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleQuickInput(e: React.FormEvent) {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const body: Record<string, string> = { input: quickInput };
      if (overrideType) body.type = overrideType;

      const res = await fetch('http://localhost:3001/api/transactions/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setQuickInput('');
        setDetectedType(null);
        setOverrideType(null);
        fetchData(); // Refresh data
      }
    } finally {
      setSubmitting(false);
    }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
  }

  const effectiveType = overrideType || detectedType;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">FamFi</h1>
            <p className="text-xs text-gray-500">{family?.name}</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="text-gray-500 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Quick Input - Primary action */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <form onSubmit={handleQuickInput}>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder='Quick add: "coffee 50k" or "lương 10m"'
                className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submitting || !quickInput.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                +
              </button>
            </div>

            {quickInput.trim() && (
              <div className="flex items-center gap-2 mt-3">
                {effectiveType ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    effectiveType === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {effectiveType === 'INCOME' ? '↓ Income' : '↑ Expense'}
                  </span>
                ) : null}
                <button type="button" onClick={() => setOverrideType('EXPENSE')}
                  className={`px-2 py-1 rounded-full text-xs ${effectiveType === 'EXPENSE' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setOverrideType('INCOME')}
                  className={`px-2 py-1 rounded-full text-xs ${effectiveType === 'INCOME' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                  Income
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Income</p>
            <p className="text-lg font-bold text-green-600">{formatAmount(summary.totalIncome)}đ</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Expense</p>
            <p className="text-lg font-bold text-red-600">{formatAmount(summary.totalExpense)}đ</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatAmount(summary.balance)}đ
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent</h2>
            <Link href="/transactions" className="text-blue-600 text-sm">See all →</Link>
          </div>

          {recentTx.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No transactions yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentTx.map((tx) => (
                <li key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? '↓' : '↑'}
                    </div>
                    <span className="text-sm text-gray-900">{tx.note || 'Transaction'}</span>
                  </div>
                  <span className={`font-medium text-sm ${
                    tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Family invite code */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Invite Code</p>
              <p className="font-mono font-bold text-lg text-blue-600">{family?.invite_code}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(family?.invite_code || '')}
              className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
