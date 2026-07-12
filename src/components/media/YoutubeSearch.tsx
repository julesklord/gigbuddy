import React, { useState } from "react";
import { Search, Loader2, Play, Check } from "lucide-react";
import {
  youtubeService,
  YoutubeSearchResult,
} from "../../services/youtubeService";

interface YoutubeSearchProps {
  onSelect: (video: YoutubeSearchResult) => void;
  currentVideoId?: string;
  onClear?: () => void;
  onPlay?: () => void;
}

export const YoutubeSearch: React.FC<YoutubeSearchProps> = ({
  onSelect,
  currentVideoId,
  onClear,
  onPlay,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YoutubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const searchResults = await youtubeService.search(query);
    setResults(searchResults);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-fluid-sm">
      {currentVideoId && (
        <div className="flex flex-col bg-bg-deep/40 border border-[#FF0000]/30 rounded-xl p-4 gap-4 mb-2 shadow-inner">
          <div className="flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 bg-bg-deep rounded overflow-hidden relative border border-white/10 shrink-0">
                <img
                  src={`https://img.youtube.com/vi/${currentVideoId}/default.jpg`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-bg-deep/30">
                  <Play size={12} className="text-white fill-white" />
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] uppercase text-[#FF0000] font-bold tracking-widest mb-1">
                  Attached Reference
                </p>
                <p className="text-[9px] font-mono text-text-dim truncate">
                  ID: {currentVideoId}
                </p>
              </div>
            </div>
          </div>
          {(onClear || onPlay) && (
            <div className="flex justify-between items-center border-t border-[#FF0000]/20 pt-3 mt-1">
              {onPlay ? (
                <button
                  onClick={onPlay}
                  className="text-[9px] flex items-center gap-1.5 text-white hover:text-white uppercase tracking-widest font-bold px-3 py-1.5 bg-[#FF0000] rounded hover:bg-[#FF0000]/80 transition-colors"
                >
                  <Play size={10} fill="currentColor" /> PLAY
                </button>
              ) : (
                <div />
              )}
              {onClear && (
                <button
                  onClick={onClear}
                  className="text-[9px] text-text-dim hover:text-text-bright transition-colors uppercase tracking-widest font-bold px-2 py-1 bg-text-bright/5 hover:bg-text-bright/10 rounded"
                >
                  REMOVE
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSearch} className="relative">
        <label htmlFor="youtube-search-input" className="sr-only">Search YouTube</label>
        <input
          id="youtube-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube for reference..."
          className="w-full bg-bg-deep/60 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-xs text-text-bright focus:border-brand/50 focus:outline-none transition-all"
        />
        <button
          type="submit"
          aria-label="Search YouTube"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-dim hover:text-brand transition-colors focus-visible:ring-2 focus-visible:outline-none rounded"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2 pt-2">
          {results.map((video) => (
            <button
              key={video.id}
              onClick={() => onSelect(video)}
              className={`flex gap-3 p-3 rounded-xl border text-left transition-all duration-200 group ${
                currentVideoId === video.id
                  ? "bg-bg-deep/60 border-[#FF0000]/50 shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                  : "bg-text-bright/5 border-white/5 hover:border-[#FF0000]/30 hover:bg-[#FF0000]/5 hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              <div className="relative w-24 h-14 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 group-hover:border-[#FF0000]/30 transition-colors">
                <img
                  src={video.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-bg-deep/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <Play
                    size={14}
                    className="text-white fill-white drop-shadow-md"
                  />
                </div>
              </div>
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <p className="text-[11px] font-bold text-text-bright truncate leading-tight mb-1 group-hover:text-white transition-colors">
                  {video.title}
                </p>
                <p className="text-[9px] text-[#FF0000]/70 uppercase tracking-widest">
                  {video.channelTitle}
                </p>
              </div>
              {currentVideoId === video.id && (
                <div className="flex items-center text-[#FF0000] drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]">
                  <Check size={16} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
