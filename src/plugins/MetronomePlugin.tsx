import React, { useState, useEffect, useRef, useCallback } from "react";
import { PluginContainer } from "./PluginSystem";
import { Zap } from "lucide-react";

export const MetronomePlugin: React.FC = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tick, setTick] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentTickRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const scheduleAheadTime = 0.1;
  const lookahead = 25.0;

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return;

    while (
      nextNoteTimeRef.current <
      audioCtxRef.current.currentTime + scheduleAheadTime
    ) {
      // Schedule Audio
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      const isFirstBeat = currentTickRef.current === 0;
      osc.frequency.value = isFirstBeat ? 1000 : 800; // Higher pitch on downbeat

      gain.gain.setValueAtTime(1, nextNoteTimeRef.current);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        nextNoteTimeRef.current + 0.1,
      );

      osc.start(nextNoteTimeRef.current);
      osc.stop(nextNoteTimeRef.current + 0.1);

      // Schedule Visual Sync
      const timeToPlay =
        (nextNoteTimeRef.current - audioCtxRef.current.currentTime) * 1000;
      const tickToSet = currentTickRef.current;
      setTimeout(
        () => {
          setTick(tickToSet);
        },
        Math.max(0, timeToPlay),
      );

      // Advance time for next note
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
      currentTickRef.current = (currentTickRef.current + 1) % 4;
    }

    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      currentTickRef.current = 0;
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      scheduler();
    } else {
      if (timerIDRef.current !== null) {
        clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
      setTick(0);
    }

    return () => {
      if (timerIDRef.current !== null) {
        clearTimeout(timerIDRef.current);
      }
    };
  }, [isPlaying, scheduler]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <PluginContainer title="Live Metronome">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs">
          <span>Tempo: {bpm} BPM</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${tick === i && isPlaying ? "bg-brand scale-125 shadow-[0_0_5px_#00FF41]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>
        <input
          type="range"
          aria-label="Metronome BPM"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="w-full accent-brand bg-white/10 h-1 rounded-lg appearance-none cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        />
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-full py-1 text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${isPlaying ? "bg-red-900/30 text-red-300" : "bg-brand/20 text-brand"}`}
        >
          <Zap size={10} /> {isPlaying ? "Stop Sync" : "Start Click"}
        </button>
      </div>
    </PluginContainer>
  );
};
