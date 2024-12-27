import { useState } from 'react';
import { Send, Network } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { classifyText, GraphData } from '../services/openaiService';
import ReactFlow, { 
  Background, 
  ConnectionMode,
  MarkerType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import ClassificationNode from './ClassificationNode';

const nodeTypes = {
  classificationNode: ClassificationNode,
};

const defaultEdgeOptions = {
  animated: true,
  type: 'default',
  style: { 
    strokeWidth: 2,
    stroke: '#93c5fd',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#93c5fd',
  },
};

function Classifier() {
  const { categories } = useCategories();
  const [text, setText] = useState('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    if (!text.trim() || categories.length === 0) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await classifyText(text);
      setGraphData(result.graphData);
    } catch (error) {
      console.error('Classification error:', error);
      setGraphData(null);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white/50 px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Animated Title Section */}
        <div className="text-center space-y-4 mb-16 opacity-0 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900">
            Test your categories!
          </h1>
          <p className="text-blue-600/80 text-lg md:text-xl opacity-0 animate-fade-in-up animation-delay-200">
            Analyze your text and visualize how it relates to your categories
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 items-start">
          {/* Left Panel */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-blue-100 animate-fade-in-left">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Text to classify</h2>
            <div className="flex flex-col h-[400px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                className="flex-1 px-4 py-3 bg-blue-50/30 border border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 resize-none"
              />
              <button
                onClick={handleClassify}
                disabled={loading || !text.trim() || categories.length === 0}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  'Classifying...'
                ) : (
                  <>
                    <Send size={18} />
                    Classify Text
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 animate-fade-in-right overflow-hidden">
            <div className="h-[500px]">
              {graphData ? (
                <ReactFlow
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  nodeTypes={nodeTypes}
                  defaultEdgeOptions={defaultEdgeOptions}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="bg-blue-50/50 hide-attribution"
                >
                  <Background />
                  <Panel position="top-right" className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg shadow-md m-4">
                    <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-green-300 ring-1 ring-green-300 rounded-sm"></div>
                        <span>Positive</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-red-300 ring-1 ring-red-300 rounded-sm"></div>
                        <span>Negative</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-gray-300 ring-1 ring-gray-300 rounded-sm"></div>
                        <span>Neutral</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-gray-300 ring-1 ring-gray-300 opacity-50 rounded-sm"></div>
                        <span>General</span>
                      </div>
                    </div>
                  </Panel>
                </ReactFlow>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300 bg-blue-50/50">
                  <Network size={64} className="animate-bounce mb-4" />
                  <span className="text-lg">Enter text and click classify to see the results</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Classifier;