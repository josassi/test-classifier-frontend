import React, { useMemo, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Search, X, Trash2, RotateCcw, RotateCw, Plus, Download, Upload } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import type { Category } from '../types/category';
import CategoryFormTable from './categories/CategoryFormTable';

type FlatCategory = {
  id: string;
  description: string;
  fullPath: string[];
} & {
  [K in `category${number}`]: string | null;
};

type EditableCellProps = {
  value: string | null;
  updateData: (value: string) => void;
};

function getMaxDepth(categories: Category[], currentDepth = 0): number {
  let maxDepth = currentDepth;
  
  categories.forEach(category => {
    if (category.children && category.children.length > 0) {
      const childDepth = getMaxDepth(category.children, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });
  
  return maxDepth;
}

function flattenCategories(categories: Category[]): { flatCategories: FlatCategory[], maxDepth: number } {
  const flatCategories: FlatCategory[] = [];
  const maxDepth = getMaxDepth(categories);

  function traverse(category: Category, ancestors: string[] = []) {
    const currentPath = [...ancestors, category.name];
    const flatCategory: FlatCategory = {
      id: category.id,
      description: category.description,
      fullPath: currentPath,
    };
    
    // Dynamically add category columns based on the path
    for (let i = 0; i < maxDepth + 1; i++) {
      flatCategory[`category${i + 1}`] = currentPath[i] || null;
    }
    
    flatCategories.push(flatCategory);

    if (category.children) {
      category.children.forEach(child => traverse(child, currentPath));
    }
  }

  categories.filter(cat => !cat.parentId).forEach(rootCat => traverse(rootCat));
  return { flatCategories, maxDepth };
}

const columnHelper = createColumnHelper<FlatCategory>();

function EditableCell({ value: initialValue, updateData }: EditableCellProps) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleUpdate = () => {
    if (value !== initialValue && value !== null) {
      updateData(value);
    }
    setIsEditing(false);
  };

  const onBlur = () => handleUpdate();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        value={value || ''}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className="w-full px-2 py-1 border rounded"
      />
    );
  }

  return (
    <div
      className="px-2 py-1 cursor-pointer hover:bg-gray-50"
      onClick={() => setIsEditing(true)}
    >
      {value || '-'}
    </div>
  );
}

function ColumnFilter({ column }: { column: any }) {
  const [filterValue, setFilterValue] = useState('');

  return (
    <div className="flex items-center gap-1 mt-2">
      <input
        type="text"
        value={filterValue}
        onChange={e => {
          setFilterValue(e.target.value);
          column.setFilterValue(e.target.value);
        }}
        placeholder={`Filter ${column.id}...`}
        className="px-2 py-1 border rounded text-sm w-full"
      />
      {filterValue && (
        <button
          onClick={() => {
            setFilterValue('');
            column.setFilterValue('');
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function CategoriesTable() {
  const { categories, updateCategory, deleteCategory, undo, redo, canUndo, canRedo, addCategory, refresh } = useCategories();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { flatCategories, maxDepth } = useMemo(() => flattenCategories(categories), [categories]);

  const findOriginalCategory = (id: string): Category | undefined => {
    const findInTree = (cats: Category[]): Category | undefined => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findInTree(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInTree(categories);
  };

  const updateData = async (rowId: string, columnId: string, value: string) => {
    console.log('updateData called with:', { rowId, columnId, value });
    try {
      const flatCategory = flatCategories.find(cat => cat.id === rowId);
      if (!flatCategory) {
        console.error('Flat category not found:', rowId);
        return;
      }

      const originalCategory = findOriginalCategory(rowId);
      if (!originalCategory) {
        console.error('Original category not found:', rowId);
        return;
      }

      console.log('Found original category:', originalCategory);

      // Create update object with all required fields
      const updateObj = {
        id: originalCategory.id,
        name: originalCategory.name,
        description: originalCategory.description,
        parentId: originalCategory.parentId
      };

      // Update the specific field based on the column
      if (columnId === 'description') {
        updateObj.description = value;
      } else if (columnId.startsWith('category')) {
        updateObj.name = value;
      }

      console.log('Updating category with:', updateObj);
      await updateCategory(updateObj);
      console.log('Category updated successfully:', updateObj);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const category = findOriginalCategory(id);
      if (!category) {
        console.error('Category not found:', id);
        return;
      }
      
      if (category.children && category.children.length > 0) {
        if (!window.confirm('This category has subcategories. Deleting it will also delete all its subcategories. Are you sure you want to proceed?')) {
          return;
        }
      }

      await deleteCategory(id);
      console.log('Category deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDownload = () => {
    // Get all visible columns except actions
    const visibleColumns = table
      .getAllColumns()
      .filter(col => {
        const columnId = col.id;
        return columnId !== 'actions' && 
               (columnId.startsWith('category') || columnId === 'description');
      });

    // Get the current table data (respecting sorting and filtering)
    const data = table.getRowModel().rows.map(row => {
      const values: string[] = [];
      visibleColumns.forEach(column => {
        const value = row.getValue(column.id);
        values.push(String(value ?? ''));
      });
      return values;
    });

    // Create CSV header
    const headers = visibleColumns.map(col => {
      const columnId = col.id;
      if (columnId.startsWith('category')) {
        return `Category ${parseInt(columnId.replace('category', ''))}`;
      }
      return columnId.charAt(0).toUpperCase() + columnId.slice(1); // Capitalize first letter
    });

    // Combine headers and data
    const csvContent = [
      headers.join(';'),
      ...data.map(row => row.join(';'))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'categories.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
    }
    // Reset the input
    event.target.value = '';
  };

  const handleImport = async (mode: 'replace' | 'add') => {
    if (!importFile) return;
    
    setImportLoading(true);
    setImportError(null);

    try {
      console.log('Starting import with mode:', mode);
      const text = await importFile.text();
      const lines = text.split('\n');
      
      // Detect delimiter (comma or semicolon)
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      console.log('Using delimiter:', delimiter);

      const headers = firstLine.split(delimiter).map(h => h.trim().replace('\r', ''));
      const rows = lines.slice(1).filter(line => line.trim());

      console.log('Parsed CSV:', { headers, rowCount: rows.length });

      // Get initial categories
      let currentCategories = [...categories];

      if (mode === 'replace') {
        console.log('Replace mode: deleting existing categories');
        // Delete all existing categories first
        for (const category of currentCategories) {
          await deleteCategory(category.id);
        }
        currentCategories = [];
      }

      // Helper function to check if a category is the last in its path
      const isLastInPath = (values: string[], currentIndex: number) => 
        !values.slice(currentIndex + 1, values.length - 1).some(v => v !== '');

      // Helper function to get description if category is last
      const getDescription = (values: string[], currentIndex: number) => 
        isLastInPath(values, currentIndex) ? values[values.length - 1] : '';

      // Helper function to find existing category
      const findExistingCategory = (categoryName: string, parentId: string | null) => 
        currentCategories.find(cat => {
          if (!parentId) {
            return cat.name === categoryName && !cat.parentId;
          }
          return cat.name === categoryName && cat.parentId === parentId;
        });

      // Process each row
      for (const row of rows) {
        const values = row.split(delimiter).map(v => v.trim().replace('\r', ''));
        console.log('Processing row:', values);

        // Build the category path for this row
        let parentId: string | null = null;

        // Process each category level (excluding description)
        for (let i = 0; i < values.length - 1; i++) {
          const categoryName = values[i];
          if (!categoryName) continue; // Skip empty categories

          const existingCategory = findExistingCategory(categoryName, parentId);
          const description = getDescription(values, i);

          if (!existingCategory) {
            console.log('Creating new category:', {
              name: categoryName,
              description,
              parentId
            });

            const newCategory = await addCategory({
              name: categoryName,
              description,
              parentId
            });

            // Add the new category to our local array
            currentCategories.push({
              ...newCategory,
              children: []
            });

            parentId = newCategory.id;
          } else {
            console.log('Using existing category:', {
              id: existingCategory.id,
              name: existingCategory.name,
              parentId: existingCategory.parentId
            });

            // Update description if needed
            if (description && description !== existingCategory.description) {
              console.log('Updating category description:', {
                id: existingCategory.id,
                description
              });

              const updatedCategory = await updateCategory({
                ...existingCategory,
                description
              });

              // Update the category in our local array
              const index = currentCategories.findIndex(c => c.id === existingCategory.id);
              if (index !== -1) {
                currentCategories[index] = {
                  ...updatedCategory,
                  children: currentCategories[index].children
                };
              }
            }

            parentId = existingCategory.id;
          }
        }
      }

      console.log('Import completed successfully');
      
      // Close modal and reset state
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportError(null);

      // Final refresh to ensure UI is up to date
      await refresh();
    } catch (error) {
      console.error('Error importing categories:', error);
      setImportError('Error importing categories. Please check the console for details.');
    } finally {
      setImportLoading(false);
    }
  };

  const columns = useMemo(() => {
    // Common filter function for text fields
    const textFilterFn = (row: any, columnId: string, filterValue: string) => {
      const value = row.getValue(columnId);
      return value ? String(value).toLowerCase().includes(filterValue.toLowerCase()) : false;
    };

    // Common cell renderer for editable cells
    const renderEditableCell = (info: any) => {
      const value = info.getValue();
      return (
        <EditableCell
          value={typeof value === 'string' ? value : null}
          updateData={(newValue) => {
            updateData(info.row.original.id, info.column.id, newValue);
          }}
        />
      );
    };

    const cols = [];
    
    // Add category level columns
    for (let i = 0; i < maxDepth + 1; i++) {
      const categoryKey = `category${i + 1}` as keyof FlatCategory;
      cols.push(
        columnHelper.accessor(categoryKey, {
          header: `Category ${i + 1}`,
          cell: renderEditableCell,
          filterFn: textFilterFn,
        })
      );
    }
    
    // Add description column
    cols.push(
      columnHelper.accessor('description', {
        header: 'Description',
        cell: renderEditableCell,
        filterFn: textFilterFn,
      })
    );

    // Add actions column
    cols.push(
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: info => (
          <div className="flex justify-end">
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete category"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      })
    );
    
    return cols;
  }, [maxDepth, updateData]);

  const table = useReactTable({
    data: flatCategories,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _, filterValue) => { 
      const searchValue = filterValue.toLowerCase();
      return Object.entries(row.original)
        .filter(([key, value]) => (key.startsWith('category') || key === 'description') && value !== null)
        .some(([_, value]) => (value as string).toLowerCase().includes(searchValue));
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search a category..."
              className="w-full pl-10 pr-8 py-2 border rounded-lg"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className={`p-2 rounded ${canUndo ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400'}`}
              title="Undo"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              className={`p-2 rounded ${canRedo ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400'}`}
              title="Redo"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Upload size={16} />
            Import
          </label>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            New Category
          </button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50 border-b">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp size={16} />,
                          desc: <ChevronDown size={16} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                    {header.column.getCanFilter() && <ColumnFilter column={header.column} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          title="Add new category"
        >
          <Plus size={20} />
        </button>
      </div>

      {isFormOpen && <CategoryFormTable onClose={() => setIsFormOpen(false)} />}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Import Categories</h2>
            <p className="mb-6 text-gray-600">
              Do you want to replace existing categories or add these categories to the existing ones?
            </p>
            {importError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {importError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                disabled={importLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleImport('add')}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={importLoading}
              >
                {importLoading ? 'Adding...' : 'Add to Existing'}
              </button>
              <button
                onClick={() => handleImport('replace')}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={importLoading}
              >
                {importLoading ? 'Replacing...' : 'Replace All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
