import React from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { Trash2, Globe, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { Song, SongStatus } from '../types';
import { Badge } from './ui/Badge';

interface SetlistReorderItemProps {
  song: Song;
  index: number;
  totalSongs: number;
  activeSongId: string | null;
  onSelect: (song: Song) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export const SetlistReorderItem: React.FC<SetlistReorderItemProps> = ({
  song, index, totalSongs, activeSongId, onSelect, onDelete, onMove
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={song}
      id={song.id}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "px-4 lg:px-6 py-5 flex flex-col gap-2 border-b border-bg-card/30 transition-all cursor-pointer group relative ",
        activeSongId === song.id ? "bg-bg-card/80 backdrop-blur-xl border-l-[3px] border-brand" : "hover:bg-text-bright/[0.03]"
      )}
      onClick={() => onSelect(song)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div 
            className="text-text-dim/50 hover:text-text-bright transition-colors cursor-grab active:cursor-grabbing p-2 shrink-0 touch-none"
            onPointerDown={(e) => dragControls.start(e)}
            aria-hidden="true"
          >
            <GripVertical size={16} />
          </div>
          <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded", activeSongId === song.id ? "bg-brand text-brand-contrast" : "bg-text-bright/5 text-text-dim/60")}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={cn("text-[14px] font-bold transition-colors tracking-tight leading-tight", activeSongId === song.id ? "text-text-bright italic" : "text-text-dim group-hover:text-text-bright")}>
            {song.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {song.status === SongStatus.PENDING && <span title="Offline - Pending Sync"><Globe size={10} className="text-amber-500 animate-spin" /></span>}
          <button 
            onClick={(e) => onDelete(song.id, e)}
            className="opacity-100 lg:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete Song"
            aria-label="Delete Song"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1 pl-10">
        <div className="flex gap-2">
          <Badge variant={activeSongId === song.id ? "blue" : "ghost"}>{song.key}</Badge>
          {song.bpm && <Badge variant={activeSongId === song.id ? "brand" : "ghost"}>{song.bpm} BPM</Badge>}
          {song.duration > 0 && <Badge variant="ghost" className="font-mono">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</Badge>}
        </div>
      </div>
      
      <div className="flex gap-2 mt-2 pt-2 border-t border-text-bright/5 pl-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }}
          disabled={index === 0}
          aria-label="Move song up"
          className="p-2 hover:bg-text-bright/10 rounded disabled:opacity-30 flex items-center gap-1 text-[10px] font-bold uppercase transition-all focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronRight size={14} className="-rotate-90" /> Up
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }}
          disabled={index === totalSongs - 1}
          aria-label="Move song down"
          className="p-2 hover:bg-text-bright/10 rounded disabled:opacity-30 flex items-center gap-1 text-[10px] font-bold uppercase transition-all focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronRight size={14} className="rotate-90" /> Down
        </button>
      </div>
    </Reorder.Item>
  );
};
