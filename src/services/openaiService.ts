import { fetchRawCategories } from './categoryService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface ClassificationNode {
  id: string;
  name: string;
  layer: number;
  summary: string;
  sentiment: string;
  flag: string;
  parent_id?: string;
}

interface ClassificationResult {
  nodes: ClassificationNode[];
  text: string;
}

interface ClassificationResponse {
  classification: string;
  graph_data: ClassificationResult;
  error?: string;
}

export interface GraphNode {
  id: string;
  type: 'classificationNode';
  position: { x: number; y: number };
  data: {
    label: string;
    summary: string;
    sentiment: string;
    flag: string;
    layer: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'default';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Converts classification nodes to React Flow graph format
 */
function convertToGraphData(nodes: ClassificationNode[]): GraphData {
  const VERTICAL_SPACING = 150;
  const NODE_WIDTH = 250;
  const HORIZONTAL_SPACING = 100; // Add extra spacing between nodes
  const layerNodes: { [key: number]: ClassificationNode[] } = {};
  
  // Group nodes by layer
  nodes.forEach(node => {
    if (!layerNodes[node.layer]) {
      layerNodes[node.layer] = [];
    }
    layerNodes[node.layer].push(node);
  });

  const graphNodes: GraphNode[] = [];
  const graphEdges: GraphEdge[] = [];

  // Create nodes with positions
  Object.entries(layerNodes).forEach(([layer, layerNodeList]) => {
    const layerNum = parseInt(layer);
    const totalWidth = (layerNodeList.length - 1) * (NODE_WIDTH + HORIZONTAL_SPACING);
    const startX = -(totalWidth / 2);

    layerNodeList.forEach((node, index) => {
      graphNodes.push({
        id: node.id,
        type: 'classificationNode',
        position: {
          x: startX + (index * (NODE_WIDTH + HORIZONTAL_SPACING)),
          y: (layerNum - 1) * VERTICAL_SPACING
        },
        data: {
          label: node.name,
          summary: node.summary,
          sentiment: node.sentiment,
          flag: node.flag,
          layer: node.layer
        }
      });

      // Create edge if there's a parent
      if (node.parent_id) {
        graphEdges.push({
          id: `${node.parent_id}-${node.id}`,
          source: node.parent_id,
          target: node.id,
          type: 'default'
        });
      }
    });
  });

  return { nodes: graphNodes, edges: graphEdges };
}

/**
 * Classifies text using the categories hierarchy via the Python backend
 */
export async function classifyText(text: string): Promise<{ textResult: string; graphData: GraphData }> {
  try {
    // Get raw categories and relations directly from Supabase
    const { categories: rawCategories, relations } = await fetchRawCategories();

    const response = await fetch(`${API_URL}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        text,
        categories: {
          categories: rawCategories,
          relations: relations
        }
      })
    });

    if (!response.ok) {
      // Try to parse as JSON first
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || 'Failed to classify text';
      } catch {
        // If parsing as JSON fails, get the text response
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    let data: ClassificationResponse;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Server response was not in valid JSON format');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      textResult: data.classification,
      graphData: convertToGraphData(data.graph_data.nodes)
    };
  } catch (error) {
    console.error('Classification error:', error);
    throw error instanceof Error ? error : new Error('Failed to classify text');
  }
}
