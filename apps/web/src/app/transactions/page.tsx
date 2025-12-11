'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  note: string;
  type: 'INCOME' | 'EXPENSE';
  transaction_date: string;
  created_at: string;
  categories?: {
    name: string;
    icon: string;
  };
}

// Keywords for client-side preview
const INCOME_KEYWORDS = ['lương', 'salary', 'thưởng', 'bonus', 'thu nhập', 'income', 'freelance', 'bán', 'sell', 'hoàn tiền', 'refund', 'lãi'];
const EXPENSE_KEYWORDS = ['coffee', 'cafe', 'ăn', 'mua', 'buy', 'grab', 'taxi', 'xăng', 'điện', 'nước', 'breakfast', 'lunch', 'dinner', 'trà sữa', 'sáng', 'trưa', 'tối'];

function detectType(text: string): 'INCOME' | 'EXPENSE' | null {
  const lower = text.toLowerCase();
  for (const kw of INCOME_KEYWORDS) {
    if (lower.includes(kw)) return 'INCOME';
  }
  for (const kw of EXPENSE_KEYWORDS) {
    if (lower.includes(kw)) return 'EXPENSE';
  }
  return null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [detectedType, setDetectedType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [overrideType, setOverrideType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect type as user types
  useEffect(() => {
    const detected = detectType(quickInput);
    setDetectedType(detected);
    // Reset override when input changes
    if (detected) {
      setOverrideType(null);
    }
  }, [quickInput]);

  async function fetchTransactions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/transactions?limit=50', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function handleQuickInput(e: React.FormEvent) {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Use override if set, otherwise let backend auto-detect
      const body: Record<string, string> = { input: quickInput };
      if (overrideType) {
        body.type = overrideType;
      }

      const response = await fetch('http://localhost:3001/api/transactions/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to create transaction');
        setSubmitting(false);
        return;
      }

      setQuickInput('');
      setDetectedType(null);
      setOverrideType(null);
      fetchTransactions();
    } catch (err) {
      setError('Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  const effectiveType = overrideType || detectedType;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Quick Input */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Add</h2>
          
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleQuickInput}>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder='Try: "coffee 50k" or "lương 10m"'
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submitting || !quickInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? '...' : 'Add'}
              </button>
            </div>

            {/* Type indicator and override */}
            {quickInput.trim() && (
              <div className="flex items-center gap-3 text-sm">
                {effectiveType ? (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                    effectiveType === 'INCOME' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {detectedType && !overrideType && '✨ '}
                    {effectiveType === 'INCOME' ? '↓ Income' : '↑ Expense'}
                  </span>
                ) : (
                  <span className="text-gray-500">Select type:</span>
                )}
                
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setOverrideType('EXPENSE')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      effectiveType === 'EXPENSE'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideType('INCOME')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      effectiveType === 'INCOME'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <li key={tx.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'INCOME' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tx.note || 'No description'}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.transaction_date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
