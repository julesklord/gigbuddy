import React from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export const DraggableStageBlock = ({ id, blockInfo, isVisible, toggleVisibility }: any) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={id}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "flex justify-between items-center p-3 lg:p-4 bg-text-bright/5 border border-text-bright/10 rounded-lg shadow-sm transition-all",
        !isVisible && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3 lg:gap-4">
        <div 
          className="text-text-dim/50 cursor-grab active:cursor-grabbing p-2 -ml-2"
          onPointerDown={(e) => controls.start(e)}
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-text-bright flex items-center gap-2">
            {blockInfo.icon}
            {blockInfo.label}
          </span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleVisibility(); }}
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${blockInfo.label}`}
        className={cn(
          "p-2 rounded-full transition-colors flex items-center gap-2 border focus-visible:ring-2 focus-visible:outline-none",
          isVisible ? "bg-brand/10 text-brand border-brand/20 hover:bg-brand/20" : "bg-text-bright/5 text-text-dim border-border-main hover:text-text-bright"
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </Reorder.Item>
  );
};