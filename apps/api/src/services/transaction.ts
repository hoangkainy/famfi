import { supabase } from '../lib/supabase';
import { Transaction, TransactionType } from '../types';

interface CreateTransactionInput {
  familyId: string;
  categoryId?: string;
  createdBy: string;
  amount: number;
  note?: string;
  type: TransactionType;
  transactionDate?: string;
}

interface UpdateTransactionInput {
  categoryId?: string;
  amount?: number;
  note?: string;
  type?: TransactionType;
  transactionDate?: string;
}

interface TransactionFilters {
  familyId: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      family_id: input.familyId,
      category_id: input.categoryId || null,
      created_by: input.createdBy,
      amount: input.amount,
      note: input.note || null,
      type: input.type,
      transaction_date: input.transactionDate || new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create transaction');
  }

  return data as Transaction;
}

export async function getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        icon,
        type
      ),
      creator:created_by (
        id,
        email,
        full_name
      )
    `)
    .eq('family_id', filters.familyId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Transaction[];
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        icon,
        type
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as Transaction;
}

export async function updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
  const updateData: Record<string, unknown> = {};

  if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.note !== undefined) updateData.note = input.note;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.transactionDate !== undefined) updateData.transaction_date = input.transactionDate;

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update transaction');
  }

  return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTransactionSummary(familyId: string, month?: string): Promise<{
  totalIncome: number;
  totalExpense: number;
  balance: number;
}> {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const startDate = `${currentMonth}-01`;
  const endDate = `${currentMonth}-31`;

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('family_id', familyId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) {
    throw new Error(error.message);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of data || []) {
    if (tx.type === 'INCOME') {
      totalIncome += Number(tx.amount);
    } else {
      totalExpense += Number(tx.amount);
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  };
}
