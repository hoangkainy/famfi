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

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [quickInputType, setQuickInputType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTransactions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/transactions?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
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

      const response = await fetch('http://localhost:3001/api/transactions/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ input: quickInput, type: quickInputType })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to create transaction');
        setSubmitting(false);
        return;
      }

      setQuickInput('');
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
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h2>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleQuickInput} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder='e.g., "breakfast 50k" or "100000 coffee"'
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={quickInputType}
                onChange={(e) => setQuickInputType(e.target.value as 'INCOME' | 'EXPENSE')}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <button
                type="submit"
                disabled={submitting || !quickInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Tip: Type amount with description like &quot;coffee 50k&quot; or &quot;50000 lunch&quot;
            </p>
          </form>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions yet. Use quick input above to add your first transaction!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <li key={tx.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className="text-lg">
                          {tx.type === 'INCOME' ? '↓' : '↑'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tx.note || 'No description'}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(tx.transaction_date)}
                          {tx.categories && ` • ${tx.categories.name}`}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount)}
                    </div>
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
