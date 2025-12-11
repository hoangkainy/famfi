'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
}

interface CategoryData {
  category_name: string;
  category_icon: string;
  total: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
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
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
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

      const catRes = await fetch('http://localhost:3001/api/reports/category-breakdown', { headers });
      const catData = await catRes.json();
      if (catData.success) setCategoryData(catData.data.filter((c: CategoryData & { type: string }) => c.type === 'EXPENSE'));

      const trendRes = await fetch('http://localhost:3001/api/reports/monthly-trend?months=4', { headers });
      const trendData = await trendRes.json();
      if (trendData.success) setMonthlyData(trendData.data);

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
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  }

  function formatFull(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
  }

  const effectiveType = overrideType || detectedType;
  const totalExpense = categoryData.reduce((sum, c) => sum + c.total, 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">FamFi</h1>
            <p className="text-xs text-muted-foreground">{family?.name}</p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">⚙️</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Quick Input */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <form onSubmit={handleQuickInput}>
              <div className="flex gap-2">
                <Input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder='Quick: "coffee 50k" or "lương 10m"'
                  className="h-11"
                />
                <Button type="submit" disabled={submitting || !quickInput.trim()} className="h-11 px-5">+</Button>
              </div>

              {quickInput.trim() && (
                <div className="flex items-center gap-2 mt-2">
                  {effectiveType && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      effectiveType === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {effectiveType === 'INCOME' ? '↓ Income' : '↑ Expense'}
                    </span>
                  )}
                  <Button type="button" variant={effectiveType === 'EXPENSE' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setOverrideType('EXPENSE')}>Expense</Button>
                  <Button type="button" variant={effectiveType === 'INCOME' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setOverrideType('INCOME')}>Income</Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-base font-bold text-green-600">{formatFull(summary.totalIncome)}đ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="text-base font-bold text-red-600">{formatFull(summary.totalExpense)}đ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-base font-bold ${summary.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {formatFull(summary.balance)}đ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={formatAmount} width={35} />
                  <Tooltip formatter={(v: number) => formatFull(v) + 'đ'} />
                  <Bar dataKey="income" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="total">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {categoryData.slice(0, 4).map((item, i) => (
                    <div key={item.category_name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{item.category_icon} {item.category_name}</span>
                      </div>
                      <span className="text-muted-foreground">{totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3">
            <CardTitle className="text-sm">Recent</CardTitle>
            <Link href="/transactions" className="text-blue-600 text-xs">See all →</Link>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            {recentTx.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                        tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'INCOME' ? '↓' : '↑'}
                      </div>
                      <span className="text-sm">{tx.note || 'Transaction'}</span>
                    </div>
                    <span className={`font-medium text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatFull(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
