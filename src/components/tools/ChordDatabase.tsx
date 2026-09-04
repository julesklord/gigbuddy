import React, { useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface ChordDef {
  name: string;
  variants: string[];
  notes: string;
  tabs?: string;
}

const CHORD_DB: Record<string, ChordDef[]> = {
  A: [
    { name: "A", variants: ["A major"], notes: "A, C#, E", tabs: "X02220" },
    { name: "Am", variants: ["A minor"], notes: "A, C, E", tabs: "X02210" },
    {
      name: "A7",
      variants: ["A dominant 7"],
      notes: "A, C#, E, G",
      tabs: "X02020",
    },
    {
      name: "Am7",
      variants: ["A minor 7"],
      notes: "A, C, E, G",
      tabs: "X02010",
    },
    {
      name: "Amaj7",
      variants: ["A major 7"],
      notes: "A, C#, E, G#",
      tabs: "X02120",
    },
  ],
  B: [
    { name: "B", variants: ["B major"], notes: "B, D#, F#", tabs: "X24442" },
    { name: "Bm", variants: ["B minor"], notes: "B, D, F#", tabs: "X24432" },
    {
      name: "B7",
      variants: ["B dominant 7"],
      notes: "B, D#, F#, A",
      tabs: "X21202",
    },
    {
      name: "Bm7",
      variants: ["B minor 7"],
      notes: "B, D, F#, A",
      tabs: "X24232",
    },
  ],
  C: [
    { name: "C", variants: ["C major"], notes: "C, E, G", tabs: "X32010" },
    { name: "Cm", variants: ["C minor"], notes: "C, Eb, G", tabs: "X35543" },
    {
      name: "C7",
      variants: ["C dominant 7"],
      notes: "C, E, G, Bb",
      tabs: "X32310",
    },
    {
      name: "Cmaj7",
      variants: ["C major 7"],
      notes: "C, E, G, B",
      tabs: "X32000",
    },
    {
      name: "Cadd9",
      variants: ["C added 9"],
      notes: "C, E, G, D",
      tabs: "X32030",
    },
  ],
  D: [
    { name: "D", variants: ["D major"], notes: "D, F#, A", tabs: "XX0232" },
    { name: "Dm", variants: ["D minor"], notes: "D, F, A", tabs: "XX0231" },
    {
      name: "D7",
      variants: ["D dominant 7"],
      notes: "D, F#, A, C",
      tabs: "XX0212",
    },
    {
      name: "Dm7",
      variants: ["D minor 7"],
      notes: "D, F, A, C",
      tabs: "XX0211",
    },
  ],
  E: [
    { name: "E", variants: ["E major"], notes: "E, G#, B", tabs: "022100" },
    { name: "Em", variants: ["E minor"], notes: "E, G, B", tabs: "022000" },
    {
      name: "E7",
      variants: ["E dominant 7"],
      notes: "E, G#, B, D",
      tabs: "020100",
    },
    {
      name: "Em7",
      variants: ["E minor 7"],
      notes: "E, G, B, D",
      tabs: "022030",
    },
  ],
  F: [
    { name: "F", variants: ["F major"], notes: "F, A, C", tabs: "133211" },
    { name: "Fm", variants: ["F minor"], notes: "F, Ab, C", tabs: "133111" },
    {
      name: "Fmaj7",
      variants: ["F major 7"],
      notes: "F, A, C, E",
      tabs: "XX3210",
    },
  ],
  G: [
    { name: "G", variants: ["G major"], notes: "G, B, D", tabs: "320003" },
    { name: "Gm", variants: ["G minor"], notes: "G, Bb, D", tabs: "355333" },
    {
      name: "G7",
      variants: ["G dominant 7"],
      notes: "G, B, D, F",
      tabs: "320001",
    },
  ],
};

const ALL_CHORDS = Object.entries(CHORD_DB).flatMap(([group, chords]) =>
  chords.map((c) => ({ ...c, group })),
);

export const ChordDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>("C");

  const filteredChords = searchQuery.trim()
    ? ALL_CHORDS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.variants.some((v) =>
            v.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : [];

  return (
    <div className="bg-bg-card border border-border-main rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-widest uppercase text-brand">
          Chord Database
        </h3>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search size={14} className="text-text-dim" />
        </div>
        <input
          type="text"
          aria-label="Search chords"
          placeholder="Search chords (e.g. Cmaj7)..."
          className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-text-bright placeholder-text-dim/50 focus:outline-none focus:border-brand/50 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        {searchQuery.trim() ? (
          filteredChords.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 mt-2">
              {filteredChords.map((chord) => (
                <ChordCard key={chord.name} chord={chord} />
              ))}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center text-text-dim gap-3 animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-full bg-text-bright/5 flex items-center justify-center mb-1">
                <Search size={20} className="opacity-50" />
              </div>
              <p className="text-sm font-bold text-text-bright">
                No chords found matching "{searchQuery}"
              </p>
              <p className="text-[10px] max-w-[200px] leading-relaxed">
                Try a different search term or check the available chords below.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {Object.keys(CHORD_DB).map((group) => (
                <button
                  key={group}
                  onClick={() =>
                    setActiveGroup(group === activeGroup ? null : group)
                  }
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    activeGroup === group
                      ? "bg-brand text-black"
                      : "bg-white/5 text-text-dim hover:text-text-bright hover:bg-white/10",
                  )}
                >
                  {group}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeGroup && (
                <motion.div
                  key={activeGroup}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="grid grid-cols-1 gap-2"
                >
                  {CHORD_DB[activeGroup].map((chord) => (
                    <ChordCard key={chord.name} chord={chord} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const ChordCard: React.FC<{ chord: ChordDef }> = ({ chord }) => {
  return (
    <div className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-lg font-bold text-text-bright leading-none group-hover:text-brand transition-colors">
            {chord.name}
          </div>
          <div className="text-[10px] text-text-dim mt-1">
            {chord.variants.join(", ")}
          </div>
        </div>
        <div className="bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-brand/80 border border-white/5 tracking-widest">
          {chord.tabs}
        </div>
      </div>
      <div className="text-[10px] text-text-dim/80 font-mono mt-2">
        <span className="opacity-50 uppercase mr-1">Notes:</span> {chord.notes}
      </div>
    </div>
  );
};
