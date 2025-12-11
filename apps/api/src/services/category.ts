import { supabase } from '../lib/supabase';
import { Category, CategoryType } from '../types';

interface CreateCategoryInput {
  familyId: string;
  name: string;
  icon?: string;
  type: CategoryType;
}

interface UpdateCategoryInput {
  name?: string;
  icon?: string;
}

export async function getCategories(familyId: string, type?: CategoryType): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('family_id', familyId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Category[];
}

export async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as Category;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      family_id: input.familyId,
      name: input.name,
      icon: input.icon || 'circle',
      type: input.type,
      is_default: false
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create category');
  }

  return data as Category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.icon !== undefined) updateData.icon = input.icon;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .eq('is_default', false) // Can only update non-default categories
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update category');
  }

  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('is_default', false); // Can only delete non-default categories

  if (error) {
    throw new Error(error.message);
  }
}
