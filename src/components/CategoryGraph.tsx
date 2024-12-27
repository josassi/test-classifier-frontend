import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  MarkerType,
  Position,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Category } from '../types/category';
import { Maximize2, LayoutGrid, Plus, Lock, Unlock, Layers, Search } from 'lucide-react';
import { CategoryNode } from './categories/CategoryNode';

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: 'rgba(59, 130, 246, 0.3)',
  },
};

const nodeTypes = {
  categoryNode: CategoryNode,
};

interface CategoryGraphProps {
  categories: Category[];
  onRemoveCategory: (id: string) => void;
  onEditCategory: (id: string) => void;
  onNewCategory: (parentId: string | null) => void;
  selectedCategoryId?: string | null;
  onClearSelection?: () => void;
}

function Flow({ categories, onEditCategory, onNewCategory, selectedCategoryId, onClearSelection }: CategoryGraphProps) {
  const reactFlowInstance = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [maxDepth, setMaxDepth] = useState(0);
  const [search, setSearch] = useState('');
  const initialized = useRef(false);
  const prevNodesCount = useRef(0);

  // Function to find a category and its ancestors
  const findCategoryAndAncestors = useCallback((
    searchText: string,
    cats: Category[],
    ancestors: Set<string> = new Set(),
    parentMap: Map<string, string> = new Map()
  ): { found: Category | null; ancestors: Set<string>; parentMap: Map<string, string> } => {
    for (const cat of cats) {
      if (cat.name.toLowerCase().includes(searchText.toLowerCase())) {
        return { found: cat, ancestors, parentMap };
      }
      
      cat.children.forEach(child => {
        parentMap.set(child.id, cat.id);
      });
      
      const result = findCategoryAndAncestors(searchText, cat.children, ancestors, parentMap);
      if (result.found) {
        let currentId = result.found.id;
        while (parentMap.has(currentId)) {
          const parentId = parentMap.get(currentId)!;
          result.ancestors.add(parentId);
          currentId = parentId;
        }
        return result;
      }
    }
    return { found: null, ancestors, parentMap };
  }, []);

  const handleSearch = useCallback((searchText: string) => {
    if (!searchText.trim()) return;
    
    const { found, ancestors } = findCategoryAndAncestors(searchText, categories);
    if (found) {
      // Expand all ancestors
      setCollapsedNodes(prev => {
        const next = new Set(prev);
        ancestors.forEach(id => next.delete(id));
        return next;
      });
      
      // Select the found category
      onEditCategory(found.id);
      
      // Center on the found node
      setTimeout(() => {
        const node = nodes.find(n => n.id === found.id);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 125, node.position.y + 16, { duration: 800 });
        }
      }, 100);
    }
  }, [categories, nodes, onEditCategory, reactFlowInstance]);

  // Function to calculate the depth of each category
  const calculateCategoryDepth = useCallback((cat: Category, depth = 0, depthMap: Map<string, number>) => {
    depthMap.set(cat.id, depth);
    setMaxDepth(current => Math.max(current, depth));
    cat.children.forEach(child => calculateCategoryDepth(child, depth + 1, depthMap));
    return depthMap;
  }, []);

  // Function to get all category IDs at or beyond a certain depth
  const getCategoryIdsByDepth = useCallback((cats: Category[], targetDepth: number, currentDepth = 0): string[] => {
    return cats.flatMap(cat => {
      const result: string[] = [];
      if (currentDepth === targetDepth) {
        result.push(cat.id);
      }
      if (currentDepth > targetDepth) {
        result.push(cat.id);
      }
      return [...result, ...getCategoryIdsByDepth(cat.children, targetDepth, currentDepth + 1)];
    });
  }, []);

  const handleLayerClick = useCallback((depth: number) => {
    setCollapsedNodes(new Set(getCategoryIdsByDepth(categories, depth)));
    // Add a small delay to let the nodes collapse before recentering
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);
  }, [categories, getCategoryIdsByDepth, reactFlowInstance]);

  const createNodesAndEdges = useCallback((
    cats: Category[],
    level = 0,
    parentY = 0,
    isFirstChild = true
  ): { nodes: Node[]; edges: Edge[]; height: number } => {
    const NODE_HEIGHT = 32;
    const LEVEL_PADDING = 300;
    const VERTICAL_SPACING = 4;
    const INITIAL_X_OFFSET = 10; // Add initial X offset
    const INITIAL_Y_OFFSET = 10; // Add initial Y offset
    
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let currentY = parentY + INITIAL_Y_OFFSET;
    let totalHeight = 0;

    cats.forEach((cat, index) => {
      if (!isFirstChild || index > 0) {
        currentY += VERTICAL_SPACING;
      }

      let nodeY = currentY;
      let childrenHeight = 0;

      if (cat.children.length > 0 && !collapsedNodes.has(cat.id)) {
        const { nodes: childNodes, edges: childEdges, height } = createNodesAndEdges(
          cat.children,
          level + 1,
          currentY,
          true
        );
        
        childrenHeight = height;
        
        if (childrenHeight > 0) {
          nodeY = currentY + (childrenHeight - NODE_HEIGHT) / 2;
          nodes.push(...childNodes);
          edges.push(...childEdges);
          currentY += childrenHeight;
        }
      }

      nodes.push({
        id: cat.id,
        type: 'categoryNode',
        position: { x: INITIAL_X_OFFSET + level * LEVEL_PADDING, y: nodeY },
        data: {
          label: cat.name,
          description: cat.description,
          onEdit: () => onEditCategory(cat.id),
          isSelected: selectedCategoryId === cat.id,
          hasChildren: cat.children.length > 0,
          isCollapsed: collapsedNodes.has(cat.id),
          onToggleCollapse: () => {
            setCollapsedNodes(prev => {
              const next = new Set(prev);
              if (next.has(cat.id)) {
                next.delete(cat.id);
                // Add a small delay to let the nodes expand before recentering
                setTimeout(() => {
                  reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
                }, 50);
              } else {
                next.add(cat.id);
                // Add a small delay to let the nodes collapse before recentering
                setTimeout(() => {
                  reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
                }, 50);
              }
              return next;
            });
          },
          onNewCategory: () => onNewCategory(cat.id)
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      if (cat.parentId) {
        edges.push({
          id: `e-${cat.parentId}-${cat.id}`,
          source: cat.parentId,
          target: cat.id,
          ...defaultEdgeOptions,
        });
      }

      if (childrenHeight > 0) {
        totalHeight = currentY - parentY;
      } else {
        currentY += NODE_HEIGHT;
        totalHeight = Math.max(totalHeight, currentY - parentY);
      }
    });

    return { nodes, edges, height: Math.max(totalHeight, NODE_HEIGHT) };
  }, [collapsedNodes, onEditCategory, selectedCategoryId]);

  useEffect(() => {
    const rootCategories = categories.filter(cat => !cat.parentId);
    const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(rootCategories, 0, 0, true);
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Calculate max depth
    const depthMap = new Map<string, number>();
    setMaxDepth(0); // Reset max depth
    rootCategories.forEach(cat => calculateCategoryDepth(cat, 0, depthMap));
    
    // Check if nodes were added (excluding initial load)
    if (initialized.current && newNodes.length > prevNodesCount.current) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }, 50);
    }
    prevNodesCount.current = newNodes.length;
    
    if (!initialized.current && categories.length > 0) {
      initialized.current = true;
      reactFlowInstance.fitView({ padding: 0.2, duration: 0 });
    }
  }, [categories, createNodesAndEdges, setNodes, setEdges, reactFlowInstance, calculateCategoryDepth]);

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    if (onClearSelection && event.target === event.currentTarget) {
      onClearSelection();
    }
  }, [onClearSelection]);

  const handleResetLayout = useCallback(() => {
    setCollapsedNodes(new Set());
    const rootCategories = categories.filter(cat => !cat.parentId);
    const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(rootCategories, 0, 0, true);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);
  }, [categories, createNodesAndEdges, setNodes, setEdges, reactFlowInstance]);

  const handleRecenter = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionMode={ConnectionMode.Strict}
      nodesDraggable={!isLocked}
      nodesConnectable={false}
      elementsSelectable={false}
      onPaneClick={handlePaneClick}
      minZoom={0.1}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      fitViewOptions={{ padding: 0.2, duration: 0 }}
      fitView
      className="bg-gradient-to-br from-[#fff5eb] via-white to-[#f0f7ff]"
    >
      <Background color="#3b82f6" size={1} gap={16}/>
      <Panel position="top-left" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-2.5 top-2.5 text-blue-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(search)}
              placeholder="Search categories..."
              className="w-[200px] pl-9 pr-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-lg text-blue-900 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-sm"
            />
          </div>
          <button
            onClick={() => onNewCategory(null)}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 text-sm flex items-center gap-2 shadow-sm hover:border-blue-200"
          >
            <Plus size={16} />
            New
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecenter}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 text-sm flex items-center gap-2 shadow-sm hover:border-blue-200"
          >
            <Maximize2 size={16} />
            Recenter
          </button>
          <button
            onClick={handleResetLayout}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 text-sm flex items-center gap-2 shadow-sm hover:border-blue-200"
          >
            <LayoutGrid size={16} />
            Reset
          </button>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 text-sm flex items-center gap-2 shadow-sm hover:border-blue-200"
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-lg border border-blue-100 shadow-sm">
          <Layers size={16} className="text-blue-400" />
          {Array.from({ length: maxDepth + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => handleLayerClick(i)}
              className="w-6 h-6 flex items-center justify-center text-blue-600 text-sm bg-blue-50/50 hover:bg-blue-100/50 rounded transition-colors"
              title={`Show up to layer ${i}`}
            >
              {i}
            </button>
          ))}
        </div>
      </Panel>
    </ReactFlow>
  );
}

function CategoryGraph(props: CategoryGraphProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default CategoryGraph;