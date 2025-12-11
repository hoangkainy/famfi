-- Update existing categories to use emoji icons
-- Run this in Supabase SQL Editor

-- Expense categories
UPDATE categories SET icon = '🍔' WHERE name = 'Food & Dining';
UPDATE categories SET icon = '🚗' WHERE name = 'Transportation';
UPDATE categories SET icon = '🛒' WHERE name = 'Shopping';
UPDATE categories SET icon = '⚡' WHERE name = 'Bills & Utilities';
UPDATE categories SET icon = '🎮' WHERE name = 'Entertainment';
UPDATE categories SET icon = '💊' WHERE name = 'Healthcare';
UPDATE categories SET icon = '📚' WHERE name = 'Education';
UPDATE categories SET icon = '💅' WHERE name = 'Personal Care';
UPDATE categories SET icon = '🎁' WHERE name = 'Gifts';
UPDATE categories SET icon = '📦' WHERE name = 'Other Expense';

-- Income categories
UPDATE categories SET icon = '💼' WHERE name = 'Salary';
UPDATE categories SET icon = '🏆' WHERE name = 'Bonus';
UPDATE categories SET icon = '📈' WHERE name = 'Investment';
UPDATE categories SET icon = '💻' WHERE name = 'Freelance';
UPDATE categories SET icon = '💰' WHERE name = 'Other Income';

-- Also update the trigger function with emoji icons
CREATE OR REPLACE FUNCTION create_default_categories(p_family_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Expense categories
    INSERT INTO categories (family_id, name, icon, type, is_default) VALUES
    (p_family_id, 'Food & Dining', '🍔', 'EXPENSE', true),
    (p_family_id, 'Transportation', '🚗', 'EXPENSE', true),
    (p_family_id, 'Shopping', '🛒', 'EXPENSE', true),
    (p_family_id, 'Bills & Utilities', '⚡', 'EXPENSE', true),
    (p_family_id, 'Entertainment', '🎮', 'EXPENSE', true),
    (p_family_id, 'Healthcare', '💊', 'EXPENSE', true),
    (p_family_id, 'Education', '📚', 'EXPENSE', true),
    (p_family_id, 'Personal Care', '💅', 'EXPENSE', true),
    (p_family_id, 'Gifts', '🎁', 'EXPENSE', true),
    (p_family_id, 'Coffee & Drinks', '☕', 'EXPENSE', true),
    (p_family_id, 'Other Expense', '📦', 'EXPENSE', true);

    -- Income categories
    INSERT INTO categories (family_id, name, icon, type, is_default) VALUES
    (p_family_id, 'Salary', '💼', 'INCOME', true),
    (p_family_id, 'Bonus', '🏆', 'INCOME', true),
    (p_family_id, 'Investment', '📈', 'INCOME', true),
    (p_family_id, 'Freelance', '💻', 'INCOME', true),
    (p_family_id, 'Other Income', '💰', 'INCOME', true);
END;
$$ LANGUAGE plpgsql;
