-- FamFi Seed Data
-- Default categories for new families

-- This function creates default categories for a family
CREATE OR REPLACE FUNCTION create_default_categories(p_family_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Expense categories
    INSERT INTO categories (family_id, name, icon, type, is_default) VALUES
    (p_family_id, 'Food & Dining', 'utensils', 'EXPENSE', true),
    (p_family_id, 'Transportation', 'car', 'EXPENSE', true),
    (p_family_id, 'Shopping', 'shopping-bag', 'EXPENSE', true),
    (p_family_id, 'Bills & Utilities', 'file-text', 'EXPENSE', true),
    (p_family_id, 'Entertainment', 'tv', 'EXPENSE', true),
    (p_family_id, 'Healthcare', 'heart-pulse', 'EXPENSE', true),
    (p_family_id, 'Education', 'book', 'EXPENSE', true),
    (p_family_id, 'Personal Care', 'user', 'EXPENSE', true),
    (p_family_id, 'Gifts', 'gift', 'EXPENSE', true),
    (p_family_id, 'Other Expense', 'ellipsis', 'EXPENSE', true);

    -- Income categories
    INSERT INTO categories (family_id, name, icon, type, is_default) VALUES
    (p_family_id, 'Salary', 'briefcase', 'INCOME', true),
    (p_family_id, 'Bonus', 'trophy', 'INCOME', true),
    (p_family_id, 'Investment', 'trending-up', 'INCOME', true),
    (p_family_id, 'Freelance', 'laptop', 'INCOME', true),
    (p_family_id, 'Other Income', 'ellipsis', 'INCOME', true);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create default categories when a family is created
CREATE OR REPLACE FUNCTION on_family_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_family_created
    AFTER INSERT ON families
    FOR EACH ROW
    EXECUTE FUNCTION on_family_created();
