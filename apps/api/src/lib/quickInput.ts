/**
 * Quick Input Parser
 * Parses chat-like input to extract amount and note
 * 
 * Supported formats:
 * - "breakfast 50k" → { amount: 50000, note: "breakfast", type: "EXPENSE" }
 * - "50k breakfast" → { amount: 50000, note: "breakfast", type: "EXPENSE" }
 * - "lương 10m" → { amount: 10000000, note: "lương", type: "INCOME" }
 * - "salary 5000000" → { amount: 5000000, note: "salary", type: "INCOME" }
 */

interface ParsedInput {
  amount: number;
  note: string;
  type?: 'INCOME' | 'EXPENSE';
}

const MULTIPLIERS: Record<string, number> = {
  'k': 1000,
  'K': 1000,
  'm': 1000000,
  'M': 1000000,
  'tr': 1000000,
  'triệu': 1000000,
  'nghìn': 1000,
  'ngàn': 1000
};

// Keywords that indicate INCOME
const INCOME_KEYWORDS = [
  'lương', 'salary', 'wage', 'wages',
  'thưởng', 'bonus',
  'thu nhập', 'income',
  'nhận', 'receive', 'received',
  'freelance', 'tiền công',
  'đầu tư', 'investment', 'invest',
  'lãi', 'interest', 'dividend',
  'hoàn tiền', 'refund',
  'bán', 'sell', 'sold'
];

// Keywords that indicate EXPENSE
const EXPENSE_KEYWORDS = [
  'ăn', 'eat', 'food', 'meal',
  'coffee', 'cafe', 'cà phê', 'trà sữa', 'milk tea',
  'mua', 'buy', 'purchase', 'shopping',
  'điện', 'electric', 'electricity',
  'nước', 'water',
  'gas', 'xăng', 'fuel', 'petrol',
  'taxi', 'grab', 'uber', 'xe',
  'bill', 'hóa đơn',
  'rent', 'thuê',
  'sửa', 'repair', 'fix',
  'doctor', 'bác sĩ', 'hospital', 'bệnh viện', 'thuốc', 'medicine',
  'giải trí', 'entertainment', 'movie', 'phim', 'game',
  'quà', 'gift',
  'breakfast', 'lunch', 'dinner', 'snack',
  'sáng', 'trưa', 'tối', 'chiều'
];

function detectTransactionType(text: string): 'INCOME' | 'EXPENSE' | undefined {
  const lowerText = text.toLowerCase();
  
  for (const keyword of INCOME_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return 'INCOME';
    }
  }
  
  for (const keyword of EXPENSE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return 'EXPENSE';
    }
  }
  
  return undefined; // Cannot determine, default will be used
}

export function parseQuickInput(input: string): ParsedInput | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // Detect transaction type from keywords
  const detectedType = detectTransactionType(trimmed);

  // Pattern 1: Amount at the beginning (50k coffee, 100000 breakfast)
  const amountFirstPattern = /^(\d+(?:\.\d+)?)\s*(k|K|m|M|tr|triệu|nghìn|ngàn)?\s*(.*)$/;
  
  // Pattern 2: Amount at the end (coffee 50k, breakfast 100000)
  const amountLastPattern = /^(.*?)\s+(\d+(?:\.\d+)?)\s*(k|K|m|M|tr|triệu|nghìn|ngàn)?$/;

  let match = trimmed.match(amountFirstPattern);
  
  if (match && match[1]) {
    const baseAmount = parseFloat(match[1]);
    const multiplier = match[2] ? (MULTIPLIERS[match[2]] || 1) : 1;
    const note = match[3]?.trim() || '';

    if (note || baseAmount) {
      return {
        amount: baseAmount * multiplier,
        note: note || 'Quick expense',
        type: detectedType
      };
    }
  }

  match = trimmed.match(amountLastPattern);
  
  if (match && match[2]) {
    const note = match[1]?.trim() || '';
    const baseAmount = parseFloat(match[2]);
    const multiplier = match[3] ? (MULTIPLIERS[match[3]] || 1) : 1;

    return {
      amount: baseAmount * multiplier,
      note: note || 'Quick expense',
      type: detectedType
    };
  }

  // Try to find any number in the string
  const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(k|K|m|M|tr|triệu|nghìn|ngàn)?/);
  
  if (numberMatch) {
    const baseAmount = parseFloat(numberMatch[1]);
    const multiplier = numberMatch[2] ? (MULTIPLIERS[numberMatch[2]] || 1) : 1;
    const note = trimmed.replace(numberMatch[0], '').trim() || 'Quick expense';

    return {
      amount: baseAmount * multiplier,
      note,
      type: detectedType
    };
  }

  return null;
}
