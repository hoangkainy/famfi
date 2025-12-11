/**
 * Quick Input Parser
 * Parses chat-like input to extract amount and note
 * 
 * Supported formats:
 * - "breakfast 50k" → { amount: 50000, note: "breakfast" }
 * - "50k breakfast" → { amount: 50000, note: "breakfast" }
 * - "coffee 25000" → { amount: 25000, note: "coffee" }
 * - "100000 dinner with family" → { amount: 100000, note: "dinner with family" }
 */

interface ParsedInput {
  amount: number;
  note: string;
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

export function parseQuickInput(input: string): ParsedInput | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

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
        note: note || 'Quick expense'
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
      note: note || 'Quick expense'
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
      note
    };
  }

  return null;
}
