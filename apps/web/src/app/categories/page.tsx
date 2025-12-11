'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
  is_default: boolean;
}

const ICONS = ['🏠', '🍔', '☕', '🚗', '⚡', '💊', '🎮', '🎬', '👕', '💼', '📚', '💰', '🎁', '✈️', '🏋️', '🛒'];

export default function CategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '🏠', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchCategories() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch('http://localhost:3001/api/categories', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

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
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', icon: '🏠', type: 'EXPENSE' });
        fetchCategories();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`http://localhost:3001/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  }

  function startEdit(category: Category) {
    setFormData({ name: category.name, icon: category.icon, type: category.type });
    setEditingId(category.id);
    setShowForm(true);
  }

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Categories</h1>
          <Link href="/dashboard" className="text-blue-600 text-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Add button */}
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', icon: '🏠', type: 'EXPENSE' }); }}
          className="w-full mb-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
        >
          + Add Category
        </button>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit' : 'New'} Category</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Food, Transport"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        formData.type === 'EXPENSE' ? 'bg-red-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        formData.type === 'INCOME' ? 'bg-green-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <div className="grid grid-cols-8 gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-xl rounded-lg ${
                          formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="flex-1 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {submitting ? '...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Expense categories */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3">EXPENSE ({expenseCategories.length})</h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {expenseCategories.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">No expense categories</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {expenseCategories.map(cat => (
                      <li key={cat.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {cat.is_default && <span className="text-xs text-gray-400">(default)</span>}
                        </div>
                        {!cat.is_default && (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(cat)} className="text-blue-600 text-sm">Edit</button>
                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 text-sm">Delete</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Income categories */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">INCOME ({incomeCategories.length})</h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {incomeCategories.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">No income categories</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {incomeCategories.map(cat => (
                      <li key={cat.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {cat.is_default && <span className="text-xs text-gray-400">(default)</span>}
                        </div>
                        {!cat.is_default && (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(cat)} className="text-blue-600 text-sm">Edit</button>
                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 text-sm">Delete</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
