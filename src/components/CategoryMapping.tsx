import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, AlertCircle, Undo2, Redo2, Loader2, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryGraph from './CategoryGraph';
import { Category } from '../types/category';
import { useCategories } from '../contexts/CategoryContext';
import { CategorySelect } from './categories/CategorySelect';

function CategoryMapping() {
  const {
    categories,
    loading: isSubmitting,
    error: serviceError,
    addCategory,
    updateCategory,
    deleteCategory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCategories();

  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaneCollapsed, setIsPaneCollapsed] = useState(true);
  const [paneWidth, setPaneWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const [newCategory, setNewCategory] = useState<Omit<Category, 'id' | 'children'>>({
    name: '',
    description: '',
    parentId: null
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Auto-expand pane when selecting a category or editing
  useEffect(() => {
    if ((selectedCategoryId || isEditing) && isPaneCollapsed) {
      setIsPaneCollapsed(false);
    }
  }, [selectedCategoryId, isEditing]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.pageX,
      startWidth: paneWidth,
    };
  }, [paneWidth]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;

    const diff = e.pageX - resizeRef.current.startX;
    const newWidth = Math.max(240, Math.min(480, resizeRef.current.startWidth + diff));
    setPaneWidth(newWidth);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  const resetForm = (parentId: string | null = null) => {
    setNewCategory({
      name: '',
      description: '',
      parentId
    });
    setIsEditing(false);
    setSelectedCategoryId(null);
    setError(null);
    setIsPaneCollapsed(false); // Auto-expand when creating new category
  };

  const handleEditCategory = (id: string) => {
    const category = findCategoryById(id, categories);
    if (category) {
      setNewCategory({
        name: category.name,
        description: category.description,
        parentId: category.parentId
      });
      setIsEditing(true);
      setSelectedCategoryId(id);
      setIsPaneCollapsed(false); // Auto-expand when editing
    }
  };

  const findCategoryById = (id: string, categories: Category[]): Category | null => {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.children) {
        const found = findCategoryById(id, category.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      if (isEditing && selectedCategoryId) {
        console.log('Editing category:', selectedCategoryId);
        console.log('New category data:', newCategory);
        const existingCategory = findCategoryById(selectedCategoryId, categories);
        if (!existingCategory) {
          setError('Category not found');
          return;
        }
        console.log('Existing category:', existingCategory);
        await updateCategory({
          id: selectedCategoryId,
          name: newCategory.name,
          description: newCategory.description,
          parentId: newCategory.parentId
        });
      } else {
        await addCategory(newCategory);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category');
    }
  };

  const handlePaneToggle = () => {
    setIsPaneCollapsed(!isPaneCollapsed);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left pane */}
      <div
        className={`bg-white shadow-lg flex-none overflow-hidden transition-all duration-300 ease-in-out relative ${
          isPaneCollapsed ? 'w-0' : ''
        }`}
        style={{ width: isPaneCollapsed ? 0 : paneWidth }}
      >
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {serviceError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle size={20} />
                <p className="text-sm">{serviceError}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-900">
                {isEditing ? 'Edit Category' : 'Create Category'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <Undo2 size={18} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <Redo2 size={18} />
                </button>
              </div>
            </div>

            {/* Category Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-blue-900 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 bg-white/50 border border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-blue-900 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/50 border border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label htmlFor="parent" className="block text-sm font-medium text-blue-900 mb-1">
                  Parent Category (Optional)
                </label>
                <CategorySelect
                  categories={categories}
                  value={newCategory.parentId}
                  onChange={(value) => setNewCategory({ ...newCategory, parentId: value })}
                  disabled={isSubmitting}
                  skipId={selectedCategoryId || undefined}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newCategory.name.trim() || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : isEditing ? (
                    <>
                      <Save size={18} />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create category
                    </>
                  )}
                </button>
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        resetForm();
                      }}
                      className="px-4 py-2 bg-white/50 hover:bg-blue-50 text-blue-800 rounded-lg transition-colors border border-blue-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => selectedCategoryId && deleteCategory(selectedCategoryId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Resizer */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/20 ${
            isResizing ? 'bg-blue-400/20' : ''
          }`}
          onMouseDown={handleResizeStart}
        />
      </div>

      {/* Collapse/Expand button */}
      <button
        onClick={handlePaneToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-r-lg p-1.5 text-blue-600 hover:bg-blue-50 shadow-sm"
        style={{ left: isPaneCollapsed ? 0 : paneWidth }}
      >
        {isPaneCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Main content */}
      <div className="flex-1 relative">
        <CategoryGraph
          categories={categories}
          onEditCategory={handleEditCategory}
          onRemoveCategory={deleteCategory}
          onNewCategory={(parentId: string | null) => {
            resetForm(parentId);
          }}
          selectedCategoryId={selectedCategoryId}
          onClearSelection={() => resetForm()}
        />
      </div>
    </div>
  );
}

export default CategoryMapping;