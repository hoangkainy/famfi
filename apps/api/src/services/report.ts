import { supabase } from '../lib/supabase';

interface CategorySummary {
  category_id: string | null;
  category_name: string;
  category_icon: string;
  total: number;
  type: 'INCOME' | 'EXPENSE';
}

interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

function getLastDayOfMonth(year: number, month: number): string {
  // month is 0-indexed (0 = January)
  // Get the first day of next month, then subtract 1 day
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  return `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

export async function getCategoryBreakdown(familyId: string, month?: string): Promise<CategorySummary[]> {
  const now = new Date();
  const currentMonth = month || now.toISOString().slice(0, 7);
  const [year, monthNum] = currentMonth.split('-').map(Number);
  
  const startDate = `${currentMonth}-01`;
  const endDate = getLastDayOfMonth(year, monthNum - 1); // monthNum is 1-indexed, convert to 0-indexed

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      category_id,
      amount,
      type,
      categories:category_id (
        name,
        icon
      )
    `)
    .eq('family_id', familyId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) {
    throw new Error(error.message);
  }

  // Group by category
  const grouped: Record<string, CategorySummary> = {};

  for (const tx of data || []) {
    const key = tx.category_id || 'uncategorized';
    const categoryData = tx.categories as { name: string; icon: string } | null;

    if (!grouped[key]) {
      grouped[key] = {
        category_id: tx.category_id,
        category_name: categoryData?.name || 'Uncategorized',
        category_icon: categoryData?.icon || '📦',
        total: 0,
        type: tx.type
      };
    }

    grouped[key].total += Number(tx.amount);
  }

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}

export async function getMonthlyTrend(familyId: string, months: number = 6): Promise<MonthlySummary[]> {
  const results: MonthlySummary[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    
    const monthStr = String(month + 1).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = getLastDayOfMonth(year, month);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('family_id', familyId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) {
      throw new Error(error.message);
    }

    let income = 0;
    let expense = 0;

    for (const tx of data || []) {
      if (tx.type === 'INCOME') {
        income += Number(tx.amount);
      } else {
        expense += Number(tx.amount);
      }
    }

    results.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expense
    });
  }

  return results;
}
