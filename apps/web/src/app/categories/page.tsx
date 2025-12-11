'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  is_default: boolean;
}

const ICONS = ['🏠', '🍔', '☕', '🚗', '⚡', '💊', '🎮', '🎬', '👕', '💼', '📚', '💰', '🎁', '✈️', '🏋️', '🛒', '📱', '🎵', '🍺', '🏥'];

export default function CategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '🏠', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchCategories() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await fetch('http://localhost:3001/api/categories', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingId 
        ? `http://localhost:3001/api/categories/${editingId}`
        : 'http://localhost:3001/api/categories';
      
      await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(formData)
      });

      setOpen(false);
      setEditingId(null);
      setFormData({ name: '', icon: '🏠', type: 'EXPENSE' });
      fetchCategories();
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`http://localhost:3001/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    fetchCategories();
  }

  function openEdit(cat: Category) {
    setFormData({ name: cat.name, icon: cat.icon, type: cat.type });
    setEditingId(cat.id);
    setOpen(true);
  }

  function openNew() {
    setFormData({ name: '', icon: '🏠', type: 'EXPENSE' });
    setEditingId(null);
    setOpen(true);
  }

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold">Categories</h1>
          <Link href="/dashboard" className="text-blue-600 text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Add Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="w-full">+ Add Category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'New'} Category</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Type Selection */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant={formData.type === 'EXPENSE' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                >
                  Expense
                </Button>
                <Button 
                  type="button" 
                  variant={formData.type === 'INCOME' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                >
                  Income
                </Button>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <div className="grid grid-cols-10 gap-1">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-8 h-8 text-lg rounded flex items-center justify-center transition-colors ${
                        formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-slate-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Coffee, Rent, Salary"
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? '...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : (
          <>
            {/* Expense Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-red-500">↑</span> Expense ({expenseCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {expenseCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No categories</p>
                ) : (
                  <div className="space-y-2">
                    {expenseCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {cat.is_default && <span className="text-xs text-muted-foreground">(default)</span>}
                        </div>
                        {!cat.is_default && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(cat.id)}>×</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-green-500">↓</span> Income ({incomeCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {incomeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No categories</p>
                ) : (
                  <div className="space-y-2">
                    {incomeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {cat.is_default && <span className="text-xs text-muted-foreground">(default)</span>}
                        </div>
                        {!cat.is_default && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(cat.id)}>×</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
