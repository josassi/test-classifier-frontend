import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface ClassificationNodeProps {
  data: {
    label: string;
    summary: string;
    sentiment: string;
    flag: string;
  };
}

export default memo(({ data }: ClassificationNodeProps) => {
  const getBorderStyle = () => {
    switch (data.sentiment.toLowerCase()) {
      case 'positive':
        return 'border-green-300 ring-2 ring-green-300';
      case 'negative':
        return 'border-red-300 ring-2 ring-red-300';
      default:
        return 'border-gray-300 ring-2 ring-gray-300';
    }
  };

  const getOpacity = () => {
    return data.flag === 'General comment' ? 'opacity-50' : 'opacity-100';
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0"
        isConnectable={false}
      />
      <div 
        className={`px-3 py-2 rounded-lg backdrop-blur-sm border shadow-sm w-[250px] transition-all duration-300 text-sm ${getBorderStyle()} ${getOpacity()} bg-white/80`}
        title={data.summary}
      >
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-700">{data.label}</span>
          <span className="text-xs text-gray-500 line-clamp-2">{data.summary}</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0"
        isConnectable={false}
      />
    </>
  );
});
