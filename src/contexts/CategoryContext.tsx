import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Category } from '../types/category';
import * as categoryService from '../services/categoryService';
import { useHistory } from '../hooks/useHistory';

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id' | 'children'>) => Promise<Category>;
  updateCategory: (category: Omit<Category, 'children'>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  refresh: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const {
    state: categories,
    setState: setCategories,
    reset: resetCategories,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.fetchCategories();
      resetCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Only load categories once when the provider mounts
  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'children'>) => {
    try {
      setError(null);
      const newCategory = await categoryService.createCategory(category);
      const updatedCategories = await categoryService.fetchCategories();
      setCategories(updatedCategories);
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
      throw err;
    }
  }, [setCategories]);

  const updateCategory = useCallback(async (category: Omit<Category, 'children'>) => {
    try {
      setError(null);
      const updatedCategory = await categoryService.updateCategory(category);
      const updatedCategories = await categoryService.fetchCategories();
      setCategories(updatedCategories);
      return updatedCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      throw err;
    }
  }, [setCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setError(null);
      await categoryService.deleteCategory(id);
      const updatedCategories = await categoryService.fetchCategories();
      setCategories(updatedCategories);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  }, [setCategories]);

  const refresh = useCallback(async () => {
    await loadCategories();
  }, []);

  const value = {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    undo,
    redo,
    canUndo,
    canRedo,
    refresh
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
