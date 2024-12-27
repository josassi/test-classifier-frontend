-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS category_relations;
DROP TABLE IF EXISTS categories;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Primary key on both id and user_id to support the relation constraints
    PRIMARY KEY (id, user_id),
    -- Additional unique constraint on just id for the simple foreign keys
    UNIQUE (id),
    -- Ensure unique names per user
    CONSTRAINT unique_category_name_per_user UNIQUE (name, user_id)
);

-- Create index on user_id for better query performance
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Create trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create category_relations table
CREATE TABLE category_relations (
    parent_id UUID NOT NULL,
    child_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Primary key on all three columns to ensure uniqueness
    PRIMARY KEY (parent_id, child_id, user_id),
    
    -- Foreign key references
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ensure parent and child belong to the same user
    FOREIGN KEY (parent_id, user_id) REFERENCES categories(id, user_id),
    FOREIGN KEY (child_id, user_id) REFERENCES categories(id, user_id),
    
    -- Prevent self-referencing
    CONSTRAINT no_self_reference CHECK (parent_id != child_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_category_relations_user_id ON category_relations(user_id);
CREATE INDEX idx_category_relations_parent ON category_relations(parent_id, user_id);
CREATE INDEX idx_category_relations_child ON category_relations(child_id, user_id);

-- Create trigger for updated_at on category_relations
CREATE TRIGGER update_category_relations_updated_at
    BEFORE UPDATE ON category_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_relations ENABLE ROW LEVEL SECURITY;

-- Policy for categories
CREATE POLICY "Users can only see their own categories"
    ON categories FOR ALL
    USING (auth.uid() = user_id);

-- Policy for category_relations
CREATE POLICY "Users can only see their own category relations"
    ON category_relations FOR ALL
    USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON categories TO authenticated;
GRANT ALL ON category_relations TO authenticated;