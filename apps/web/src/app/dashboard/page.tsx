'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      if (!session) { router.push('/login'); return; }

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      const familyRes = await fetch('http://localhost:3001/api/families/me', { headers });
      const familyData = await familyRes.json();
      if (!familyData.data) { router.push('/onboarding'); return; }
      setFamily(familyData.data);

      const summaryRes = await fetch('http://localhost:3001/api/transactions/summary', { headers });
      const summaryData = await summaryRes.json();
      if (summaryData.success) setSummary(summaryData.data);

      const txRes = await fetch('http://localhost:3001/api/transactions?limit=5', { headers });
      const txData = await txRes.json();
      if (txData.success) setRecentTx(txData.data);

    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(body)
      });

      if ((await res.json()).success) {
        setQuickInput('');
        setDetectedType(null);
        setOverrideType(null);
        fetchData();
      }
    } finally { setSubmitting(false); }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
  }

  const effectiveType = overrideType || detectedType;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">FamFi</h1>
            <p className="text-xs text-muted-foreground">{family?.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Quick Input */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleQuickInput}>
              <div className="flex gap-2">
                <Input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder='Try: "coffee 50k" or "lương 10m"'
                  className="h-12"
                />
                <Button type="submit" disabled={submitting || !quickInput.trim()} className="h-12 px-6">
                  +
                </Button>
              </div>

              {quickInput.trim() && (
                <div className="flex items-center gap-2 mt-3">
                  {effectiveType && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      effectiveType === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {effectiveType === 'INCOME' ? '↓ Income' : '↑ Expense'}
                    </span>
                  )}
                  <Button type="button" variant={effectiveType === 'EXPENSE' ? 'default' : 'outline'} size="sm" onClick={() => setOverrideType('EXPENSE')}>
                    Expense
                  </Button>
                  <Button type="button" variant={effectiveType === 'INCOME' ? 'default' : 'outline'} size="sm" onClick={() => setOverrideType('INCOME')}>
                    Income
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Income</p>
              <p className="text-lg font-bold text-green-600">{formatAmount(summary.totalIncome)}đ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Expense</p>
              <p className="text-lg font-bold text-red-600">{formatAmount(summary.totalExpense)}đ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className={`text-lg font-bold ${summary.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {formatAmount(summary.balance)}đ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent</CardTitle>
            <Link href="/transactions" className="text-blue-600 text-sm">See all →</Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentTx.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'INCOME' ? '↓' : '↑'}
                      </div>
                      <span className="text-sm">{tx.note || 'Transaction'}</span>
                    </div>
                    <span className={`font-medium text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/transactions">
            <Card className="hover:bg-slate-100 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 text-center">
                <span className="text-2xl">📝</span>
                <p className="text-xs mt-1">Transactions</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/categories">
            <Card className="hover:bg-slate-100 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 text-center">
                <span className="text-2xl">📁</span>
                <p className="text-xs mt-1">Categories</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports">
            <Card className="hover:bg-slate-100 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 text-center">
                <span className="text-2xl">📊</span>
                <p className="text-xs mt-1">Reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Invite Code */}
        <Card>
          <CardContent className="pt-4 pb-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Invite Code</p>
              <p className="font-mono font-bold text-lg text-blue-600">{family?.invite_code}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(family?.invite_code || '')}>
              Copy
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
