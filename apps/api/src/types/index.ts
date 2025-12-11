export type MemberRole = 'ADMIN' | 'VIEWER';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  family_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  type: CategoryType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  category_id: string | null;
  created_by: string;
  amount: number;
  note: string | null;
  type: TransactionType;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
