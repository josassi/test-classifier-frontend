import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, ChevronRight, ChevronDown } from 'lucide-react';

interface CategoryNodeProps {
  data: {
    label: string;
    description: string;
    onEdit: () => void;
    isSelected?: boolean;
    hasChildren: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNewCategory: () => void;
  };
}

export const CategoryNode = memo(({ data }: CategoryNodeProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit();
  };

  const handleNewCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onNewCategory();
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggleCollapse();
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0"
        isConnectable={false}
      />
      <div 
        className={`px-3 py-1 rounded-lg backdrop-blur-sm border shadow-sm cursor-pointer w-[250px] transition-all duration-300 text-sm ${
          data.isSelected 
            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-300' 
            : 'bg-white/80 border-blue-100 hover:border-blue-200'
        }`}
        onClick={handleClick}
        title={data.description || ''}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="flex-1 truncate text-gray-700">{data.label}</span>
          <div className="flex items-center gap-1">
            {/* New Category Button */}
            <button
              onClick={handleNewCategory}
              className="p-1 rounded transition-colors hover:bg-green-100/50 text-green-600"
              title="Add child category"
            >
              <Plus size={16} />
            </button>
            
            {/* Expand/Collapse Button */}
            {data.hasChildren ? (
              <button
                onClick={handleToggleCollapse}
                className={`p-1 rounded transition-colors ${
                  data.hasChildren 
                    ? 'hover:bg-blue-100/50 text-blue-600' 
                    : 'hover:bg-red-100/50 text-red-600 opacity-50 cursor-not-allowed'
                }`}
                title={data.hasChildren 
                  ? (data.isCollapsed ? 'Expand children' : 'Collapse children')
                  : 'No children to expand'}
                disabled={!data.hasChildren}
              >
                {data.hasChildren ? (
                  data.isCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )
                ) : (
                  <div className="p-1 text-blue-200/50">
                    <ChevronRight size={16} />
                  </div>
                )}
              </button>
            ) : (
              <div className="p-1 text-blue-200/50">
                <ChevronRight size={16} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0"
        isConnectable={false}
      />
    </>
  );
});

CategoryNode.displayName = 'CategoryNode';