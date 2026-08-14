import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertTriangle, Activity, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DecibelMeter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [db, setDb] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const toggleListening = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setIsListening(true);
      setIsOpen(true);
      updateLevel();
    } catch (err) {
      console.error("Mic access denied or error:", err);
      alert("Microphone access denied. Please allow it to use the decibel meter.");
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    setIsListening(false);
    setDb(0);
  };

  const updateLevel = () => {
    if (!analyserRef.current) return;
    const array = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(array);
    
    let sumSquares = 0;
    for (let i = 0; i < array.length; i++) {
      sumSquares += array[i] * array[i];
    }
    const rms = Math.sqrt(sumSquares / array.length);
    
    let currentDb = 0;
    if (rms > 0) {
      // 0 dBFS to ~100 dB SPL approximation mapping for typical mic inputs
      const dbFS = 20 * Math.log10(rms);
      currentDb = Math.max(0, dbFS + 100); 
    }
    
    setDb(prev => {
      const smoothed = prev * 0.85 + currentDb * 0.15; // smooth the jitter
      setMaxDb(m => Math.max(m, smoothed));
      return smoothed;
    });

    animationFrameRef.current = requestAnimationFrame(updateLevel);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const isDanger = db >= 85;
  const isWarning = db >= 70 && db < 85;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-bold shadow-md",
          isListening 
            ? isDanger 
              ? "bg-red-500 text-white border-red-400 animate-pulse glow-red"
              : isWarning
                ? "bg-amber-500 text-black border-amber-400 glow-amber"
                : "bg-brand/20 text-brand border-brand/50 glow-green"
            : "bg-white/5 text-text-dim border-border-main hover:bg-white/10"
        )}
      >
        <Volume2 size={14} className={cn(isListening && isDanger && "animate-bounce")} />
        {isListening ? (
          <span className="font-mono">{Math.round(db)} dB</span>
        ) : (
          <span>Noise</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-bg-card border border-border-main rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-4 border-b border-border-main bg-black/40 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-text-bright">
              <Activity size={14} className="text-brand" />
              Decibel Meter
            </h3>
            <button 
              onClick={toggleListening}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isListening ? "bg-red-500 text-white hover:bg-red-600" : "bg-brand text-black hover:bg-brand/80"
              )}
              title={isListening ? "Stop Monitoring" : "Start Monitoring"}
              aria-label={isListening ? "Stop Monitoring" : "Start Monitoring"}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="relative h-4 bg-black rounded-full overflow-hidden border border-white/10">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-75",
                  isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-brand"
                )}
                style={{ width: `${Math.min(100, Math.max(0, (db / 120) * 100))}%` }}
              />
              <div 
                className="absolute inset-y-0 w-0.5 bg-white/50 transition-all duration-300"
                style={{ left: `${Math.min(100, Math.max(0, (maxDb / 120) * 100))}%` }}
              />
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Current</div>
                <div className={cn("text-3xl font-bold font-mono tracking-tighter", isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-brand")}>
                  {Math.round(db)} <span className="text-sm">dB</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-dim font-mono uppercase tracking-widest">Max</div>
                <div className="text-xl font-bold font-mono text-text-bright tracking-tighter">
                  {Math.round(maxDb)} <span className="text-xs text-text-dim">dB</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-3">Health Standards</h4>
              
              <div className="flex items-start gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-brand mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-text-bright">Safe (&lt; 70 dB)</span>
                  <p className="text-text-dim mt-0.5">Normal conversation. Safe for any duration.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-amber-500">Moderate (70-85 dB)</span>
                  <p className="text-text-dim mt-0.5">Heavy traffic. Limit long term exposure.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-red-500">Dangerous (&gt; 85 dB)</span>
                  <p className="text-text-dim mt-0.5">Concerts/Clubs. Can cause permanent damage without earplugs.</p>
                </div>
              </div>
            </div>

            {isDanger && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2 text-red-400">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">Levels are critically high. Ear protection is strongly recommended.</p>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setMaxDb(0)} 
                className="text-[10px] text-text-dim hover:text-text-bright uppercase font-bold tracking-widest transition-colors"
              >
                Reset Peak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
