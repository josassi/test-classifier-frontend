import { Plus, AlertCircle, Loader2, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Category } from '../../types/category';
import { CategorySelect } from './CategorySelect';

interface CategoryFormProps {
  category: Omit<Category, 'id' | 'children'>;
  isEditing: boolean;
  isSubmitting: boolean;
  error: string | null;
  canUndo: boolean;
  canRedo: boolean;
  categories: Category[];
  selectedCategoryId?: string | null;
  onSubmit: () => void;
  onChange: (category: Omit<Category, 'id' | 'children'>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function CategoryForm({
  category,
  isEditing,
  isSubmitting,
  error,
  canUndo,
  canRedo,
  categories,
  selectedCategoryId,
  onSubmit,
  onChange,
  onUndo,
  onRedo,
  onCancel,
  onDelete
}: CategoryFormProps) {
  return (
    <div className="category-form h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Edit Category' : 'Create Category'}
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onUndo}
            disabled={!canUndo || isSubmitting}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-2 flex-1"
            title="Undo"
          >
            <Undo2 size={16} />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isSubmitting}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white flex items-center gap-2 flex-1"
            title="Redo"
          >
            <Redo2 size={16} />
            Redo
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={category.name}
                onChange={(e) => onChange({ ...category, name: e.target.value })}
                placeholder="Enter category name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={category.description}
                onChange={(e) => onChange({ ...category, description: e.target.value })}
                placeholder="Enter category description"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <CategorySelect
                categories={categories}
                value={category.parentId}
                onChange={(value) => onChange({ ...category, parentId: value })}
                disabled={isSubmitting}
                skipId={selectedCategoryId || undefined}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={onSubmit}
              disabled={!category.name.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {isEditing ? 'Update' : 'Create Category'}
            </button>
            {isEditing && (
              <>
                <button
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  disabled={isSubmitting}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
                  title="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}