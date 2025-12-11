'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Transaction {
  id: string;
  amount: number;
  note: string;
  type: 'INCOME' | 'EXPENSE';
  transaction_date: string;
  category_id: string | null;
  categories?: { name: string; icon: string };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
}

const INCOME_KEYWORDS = ['lương', 'salary', 'thưởng', 'bonus', 'thu nhập', 'freelance', 'bán', 'hoàn tiền', 'lãi'];
const EXPENSE_KEYWORDS = ['coffee', 'cafe', 'ăn', 'mua', 'grab', 'taxi', 'xăng', 'điện', 'nước', 'breakfast', 'lunch', 'dinner', 'trà sữa'];

function detectType(text: string): 'INCOME' | 'EXPENSE' | null {
  const lower = text.toLowerCase();
  for (const kw of INCOME_KEYWORDS) if (lower.includes(kw)) return 'INCOME';
  for (const kw of EXPENSE_KEYWORDS) if (lower.includes(kw)) return 'EXPENSE';
  return null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick input
  const [quickInput, setQuickInput] = useState('');
  const [detectedType, setDetectedType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [overrideType, setOverrideType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', note: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE', categoryId: '' });

  useEffect(() => {
    const detected = detectType(quickInput);
    setDetectedType(detected);
    if (detected) setOverrideType(null);
  }, [quickInput]);

  async function fetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const headers = { 'Authorization': `Bearer ${session.access_token}` };

      const txRes = await fetch('http://localhost:3001/api/transactions?limit=50', { headers });
      const txData = await txRes.json();
      if (txData.success) setTransactions(txData.data);

      const catRes = await fetch('http://localhost:3001/api/categories', { headers });
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.data);

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

  function openEdit(tx: Transaction) {
    setEditTx(tx);
    setEditForm({
      amount: tx.amount.toString(),
      note: tx.note || '',
      type: tx.type,
      categoryId: tx.category_id || ''
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTx) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`http://localhost:3001/api/transactions/${editTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          amount: editForm.amount,
          note: editForm.note,
          type: editForm.type,
          categoryId: editForm.categoryId || null
        })
      });

      setEditOpen(false);
      setEditTx(null);
      fetchData();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`http://localhost:3001/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      fetchData();
    } catch (err) { console.error(err); }
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  const effectiveType = overrideType || detectedType;
  const filteredCategories = categories.filter(c => c.type === editForm.type);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">Transactions</h1>
          <Link href="/dashboard" className="text-blue-600 text-sm">← Dashboard</Link>
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4 pt-2">
              <div className="flex gap-2">
                <Button type="button" variant={editForm.type === 'EXPENSE' ? 'default' : 'outline'} className="flex-1" onClick={() => setEditForm({ ...editForm, type: 'EXPENSE', categoryId: '' })}>Expense</Button>
                <Button type="button" variant={editForm.type === 'INCOME' ? 'default' : 'outline'} className="flex-1" onClick={() => setEditForm({ ...editForm, type: 'INCOME', categoryId: '' })}>Income</Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount</label>
                <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} required />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Note</label>
                <Input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <div className="grid grid-cols-4 gap-1">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, categoryId: cat.id })}
                      className={`p-2 rounded text-center text-xs ${editForm.categoryId === cat.id ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      <span className="text-lg block">{cat.icon}</span>
                      <span className="truncate block">{cat.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Transaction List */}
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">All Transactions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(tx)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.categories?.icon || (tx.type === 'INCOME' ? '↓' : '↑')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.note || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.transaction_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount)}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}>×</Button>
                    </div>
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
