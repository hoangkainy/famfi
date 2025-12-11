'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoryData {
  category_name: string;
  category_icon: string;
  total: number;
  type: 'INCOME' | 'EXPENSE';
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      // Fetch category breakdown
      const catRes = await fetch('http://localhost:3001/api/reports/category-breakdown', { headers });
      const catData = await catRes.json();
      if (catData.success) setCategoryData(catData.data);

      // Fetch monthly trend
      const trendRes = await fetch('http://localhost:3001/api/reports/monthly-trend?months=6', { headers });
      const trendData = await trendRes.json();
      if (trendData.success) setMonthlyData(trendData.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function formatAmount(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  }

  const expenseData = categoryData.filter(c => c.type === 'EXPENSE');
  const totalExpense = expenseData.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Reports</h1>
          <Link href="/dashboard" className="text-blue-600 text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Monthly Trend Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">6-Month Trend</h2>
              
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAmount} />
                    <Tooltip 
                      formatter={(value: number) => formatAmount(value) + 'đ'}
                      labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No data yet
                </div>
              )}
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Expense by Category</h2>
              
              {expenseData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="total"
                        nameKey="category_name"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={entry.category_name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatAmount(value) + 'đ'}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="mt-4 space-y-2">
                    {expenseData.map((item, index) => (
                      <div key={item.category_name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.category_icon} {item.category_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(0) : 0}%
                          </span>
                          <span className="font-medium">{formatAmount(item.total)}đ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No expense data yet
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
