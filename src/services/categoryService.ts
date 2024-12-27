import { supabase } from '../config/supabase';
import { Category } from '../types/category';

// Add database constraints if they don't exist
async function ensureDatabaseConstraints() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Then add foreign key constraints
  await supabase.rpc('add_category_constraints');
}

export interface RawCategory {
  id: string;
  name: string;
  description: string;
  user_id: string;
}

export interface RawCategoryRelation {
  parent_id: string;
  child_id: string;
  user_id: string;
}

export async function fetchRawCategories(): Promise<{ categories: RawCategory[], relations: RawCategoryRelation[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch all categories for the user
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }

  // Fetch all relationships for the user
  const { data: relations, error: relationsError } = await supabase
    .from('category_relations')
    .select('*')
    .eq('user_id', user.id);

  if (relationsError) {
    console.error('Error fetching relations:', relationsError);
    throw relationsError;
  }

  return {
    categories: categories || [],
    relations: relations || []
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { categories, relations } = await fetchRawCategories();
  return buildCategoryTree(categories, relations);
}

export async function createCategory(category: Omit<Category, 'id' | 'children'>): Promise<Category> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Start a transaction using RPC
  const { data: newCategory, error: categoryError } = await supabase
    .from('categories')
    .insert([{
      name: category.name,
      description: category.description,
      user_id: user.id
    }])
    .select()
    .single();

  if (categoryError) throw categoryError;

  // If there's a parent, create the relationship
  if (category.parentId) {
    const { error: relationError } = await supabase
      .from('category_relations')
      .insert([{
        parent_id: category.parentId,
        child_id: newCategory.id,
        user_id: user.id
      }]);

    if (relationError) {
      // Rollback category creation if relation fails
      await supabase.from('categories').delete().eq('id', newCategory.id);
      throw relationError;
    }
  }

  return {
    ...newCategory,
    children: [],
    parentId: category.parentId
  };
}

export async function updateCategory(category: Omit<Category, 'children'>): Promise<Category> {
  console.log('Updating category:', category);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // First verify that both categories belong to the user
  if (category.parentId) {
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category.parentId)
      .eq('user_id', user.id)
      .single();

    if (parentError || !parentCategory) {
      console.error('Error verifying parent category:', parentError);
      throw new Error('Parent category not found or unauthorized');
    }
  }

  // Start a transaction
  const { data: updatedCategory, error: categoryError } = await supabase
    .from('categories')
    .update({
      name: category.name,
      description: category.description
    })
    .eq('id', category.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (categoryError) {
    console.error('Error updating category:', categoryError);
    throw categoryError;
  }

  console.log('Category updated:', updatedCategory);

  // Then, handle the parent relationship
  const { data: existingRelations, error: relationError } = await supabase
    .from('category_relations')
    .select('*')
    .eq('child_id', category.id);

  if (relationError) {
    console.error('Error fetching relations:', relationError);
    throw relationError;
  }

  console.log('Existing relations:', existingRelations);
  const currentParentId = existingRelations?.[0]?.parent_id;
  console.log('Current parent ID:', currentParentId);
  console.log('New parent ID:', category.parentId);

  // Always delete existing relations for this child
  if (existingRelations.length > 0) {
    console.log('Deleting existing relations...');
    const { error: deleteError } = await supabase
      .from('category_relations')
      .delete()
      .eq('child_id', category.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting relations:', deleteError);
      throw deleteError;
    }
    console.log('Existing relations deleted');
  }

  // If there's a new parent, create the relation
  if (category.parentId) {
    console.log('Creating new relation...');
    const { error: insertError } = await supabase
      .from('category_relations')
      .insert([{
        parent_id: category.parentId,
        child_id: category.id,
        user_id: user.id
      }]);

    if (insertError) {
      console.error('Error creating relation:', insertError);
      throw insertError;
    }
    console.log('New relation created');
  }

  // Verify the final state
  const { data: finalRelations } = await supabase
    .from('category_relations')
    .select('*')
    .eq('child_id', category.id)
    .eq('user_id', user.id);
  
  console.log('Final relations:', finalRelations);

  return {
    id: updatedCategory.id,
    name: updatedCategory.name,
    description: updatedCategory.description,
    parentId: category.parentId,
    children: [] // The caller should refetch to get the full tree
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Relations will be automatically deleted due to ON DELETE CASCADE

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

function buildCategoryTree(
  categories: Array<any>,
  relations: Array<{ parent_id: string; child_id: string }>
): Category[] {
  // Create a map of all categories first
  const categoryMap = new Map<string, Category>();
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      parentId: null,  // We'll set this in the next step
      children: []
    });
  });

  // Process relations to set up parent-child relationships
  relations.forEach(relation => {
    const child = categoryMap.get(relation.child_id);
    const parent = categoryMap.get(relation.parent_id);
    
    if (child && parent) {
      // Set the parent ID
      child.parentId = relation.parent_id;
      // Add the child to parent's children array if not already added
      if (!parent.children.some(c => c.id === child.id)) {
        parent.children.push(child);
      }
    }
  });

  // Find root categories (those without parents in the relations)
  const rootCategories: Category[] = [];
  categoryMap.forEach(category => {
    if (!relations.some(r => r.child_id === category.id)) {
      rootCategories.push(category);
    }
  });

  // Sort categories
  const sortCategories = (cats: Category[]) => {
    cats.sort((a, b) => a.name.localeCompare(b.name));
    cats.forEach(cat => {
      if (cat.children.length > 0) {
        sortCategories(cat.children);
      }
    });
  };
  sortCategories(rootCategories);

  return rootCategories;
}

// Initialize database constraints
ensureDatabaseConstraints().catch(console.error);