import React from "react";
import { Reorder } from "motion/react";
import {
  X,
  Layers,
  ExternalLink,
  AlignLeft,
  GripVertical,
  Check,
} from "lucide-react";
import { cn } from "../lib/utils";
import { DraggableStageBlock } from "./DraggableStageBlock";

export const GlobalSettingsView: React.FC<{
  globalTheme: string;
  setGlobalTheme: (theme: any) => void;
  globalMode: string;
  setGlobalMode: (mode: any) => void;
  scrollSpeedMultiplier: number;
  setScrollSpeedMultiplier: (speed: number) => void;
  isLiveSyncEnabled: boolean;
  setIsLiveSyncEnabled: (enabled: boolean) => void;
  textSizeMultiplier: number;
  setTextSizeMultiplier: (size: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  chordBackground: string;
  setChordBackground: (bg: string) => void;
  isTransportFloating: boolean;
  setIsTransportFloating: (floating: boolean) => void;
  stageLayout: string[];
  setStageLayout: (layout: string[]) => void;
  stageVisibility: Record<string, boolean>;
  setStageVisibility: (vis: Record<string, boolean>) => void;
  onBack: () => void;
}> = ({
  globalTheme,
  setGlobalTheme,
  globalMode,
  setGlobalMode,
  scrollSpeedMultiplier,
  setScrollSpeedMultiplier,
  isLiveSyncEnabled,
  setIsLiveSyncEnabled,
  textSizeMultiplier,
  setTextSizeMultiplier,
  fontFamily,
  setFontFamily,
  chordBackground,
  setChordBackground,
  isTransportFloating,
  setIsTransportFloating,
  stageLayout,
  setStageLayout,
  stageVisibility,
  setStageVisibility,
  onBack,
}) => {
  const AVAILABLE_BLOCKS = [
    { id: "header", label: "Title & Metadata", icon: <Layers size={14} /> },
    {
      id: "performance_notes",
      label: "Performance Notes",
      icon: <AlignLeft size={14} />,
    },
    {
      id: "attachments",
      label: "Linked Resources",
      icon: <ExternalLink size={14} />,
    },
    { id: "lyrics", label: "Lyrics & Chords", icon: <AlignLeft size={14} /> },
  ];

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-bg-deep text-text-bright flex flex-col p-4 sm:p-4 sm:p-6 lg:p-12 animate-in slide-in-from-right-8 duration-500 overflow-y-auto z-50 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="max-w-2xl mx-auto w-full flex justify-between items-center mb-8 sm:mb-12 shrink-0 mt-[env(safe-area-inset-top)] pt-4">
        <button
          onClick={onBack}
          aria-label="Close global settings"
          className="p-2 bg-text-bright/5 rounded-full hover:bg-text-bright/10 focus-visible:ring-2 focus-visible:outline-none transition-all"
        >
          <X size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tighter uppercase">
          Global Settings
        </h1>
        <button
          onClick={onBack}
          className="px-4 sm:px-6 py-2 bg-brand text-brand-contrast font-bold rounded-lg hover:scale-105 active:scale-95 transition-all text-sm"
        >
          Done
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full space-y-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-bright tracking-tight">
              Opciones de Escenario
            </h2>
            <p className="text-sm text-text-dim">
              Configuración de la vista visual y en escenario.
            </p>
          </div>

          <div className="bg-bg-card border border-border-main rounded-xl p-4 sm:p-6 space-y-8">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">
                  Velocidad Auto-Scroll Base
                </label>
                <span className="text-brand font-mono">
                  {scrollSpeedMultiplier.toFixed(1)}x
                </span>
              </div>
              <p className="text-[10px] text-text-dim mb-2">
                Ajusta el multiplicador base para el teleprompter en general.
              </p>
              <input
                type="range"
                aria-label="Teleprompter speed multiplier"
                min="0.5"
                max="3"
                step="0.1"
                value={scrollSpeedMultiplier}
                onChange={(e) =>
                  setScrollSpeedMultiplier(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-text-bright/10 rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Tamaño de Texto</label>
                <span className="text-brand font-mono">
                  {(textSizeMultiplier * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-text-dim mb-2">
                Ajusta el tamaño global de las letras y acordes.
              </p>
              <input
                type="range"
                aria-label="Text size multiplier"
                min="0.5"
                max="2"
                step="0.1"
                value={textSizeMultiplier}
                onChange={(e) =>
                  setTextSizeMultiplier(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-text-bright/10 rounded-lg appearance-none cursor-pointer accent-brand"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-text-bright/5 pt-6">
              <h3 className="text-sm font-bold">Fuente Principal</h3>
              <p className="text-[10px] text-text-dim">
                Selecciona el estilo de texto para el modo escenario.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "sans", label: "Inter", class: "font-sans" },
                  { id: "mono", label: "Mono", class: "font-mono" },
                  { id: "serif", label: "Serif", class: "font-serif" },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.id)}
                    className={cn(
                      "py-2 px-3 rounded text-sm transition-all text-center border",
                      font.class,
                      fontFamily === font.id
                        ? "bg-text-bright text-bg-deep border-text-bright font-bold"
                        : "bg-text-bright/5 text-text-dim border-transparent hover:bg-text-bright/10",
                    )}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-text-bright/5 pt-6">
              <h3 className="text-sm font-bold">Chord Background</h3>
              <p className="text-[10px] text-text-dim">
                Visibility style for chords on the stage.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "none", label: "None", previewClass: "text-brand" },
                  {
                    id: "subtle",
                    label: "Subtle",
                    previewClass:
                      "bg-text-bright/5 border border-text-bright/10 text-brand",
                  },
                  {
                    id: "highlight",
                    label: "Highlight",
                    previewClass: "bg-brand text-brand-contrast font-black",
                  },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setChordBackground(bg.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                      chordBackground === bg.id
                        ? "bg-brand/5 border-brand ring-1 ring-brand"
                        : "bg-text-bright/5 border-border-main hover:border-brand/40",
                    )}
                  >
                    <div className="font-bold text-sm mb-1">{bg.label}</div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs shadow-sm",
                        bg.previewClass,
                      )}
                    >
                      C#m7
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-text-bright/5 pt-6">
              <h3 className="text-sm font-bold">Presets Rápidos</h3>
              <p className="text-[10px] text-text-dim">
                Configuraciones optimizadas según tu rol.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGlobalMode("pro");
                    setFontFamily("mono");
                    setChordBackground("highlight");
                    setTextSizeMultiplier(1.2);
                    setStageVisibility({
                      chords: true,
                      lyrics: true,
                      performanceNotes: true,
                    });
                  }}
                  className="py-2 px-3 rounded text-sm transition-all text-left border border-text-bright/10 bg-text-bright/5 hover:bg-text-bright/10 flex flex-col gap-1"
                >
                  <span className="font-bold text-text-bright">
                    Instrumentista / Pro
                  </span>
                  <span className="text-[10px] text-text-dim">
                    Fuente mono, acordes resaltados
                  </span>
                </button>
                <button
                  onClick={() => {
                    setGlobalMode("lyrics");
                    setFontFamily("sans");
                    setChordBackground("none");
                    setTextSizeMultiplier(1.5);
                    setStageVisibility({
                      chords: false,
                      lyrics: true,
                      performanceNotes: true,
                    });
                  }}
                  className="py-2 px-3 rounded text-sm transition-all text-left border border-text-bright/10 bg-text-bright/5 hover:bg-text-bright/10 flex flex-col gap-1"
                >
                  <span className="font-bold text-brand">Vocalista</span>
                  <span className="text-[10px] text-brand/70">
                    Texto gigante sin acordes
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-text-bright/5 pt-6">
              <div className="space-y-1 pr-4">
                <h3 id="floating-transport-label" className="text-sm font-bold">Floating Transport Bar</h3>
                <p id="floating-transport-desc" className="text-[10px] text-text-dim leading-relaxed">
                  When enabled, the playback bar will float in the center. When
                  disabled, it stays fixed at the bottom stretching across the
                  screen.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={isTransportFloating}
                aria-labelledby="floating-transport-label"
                aria-describedby="floating-transport-desc"
                onClick={() => setIsTransportFloating(!isTransportFloating)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep focus-visible:outline-none",
                  isTransportFloating ? "bg-brand" : "bg-text-bright/10",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                    isTransportFloating ? "translate-x-6" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-text-bright/5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-bright tracking-tight">
              Appearance
            </h2>
            <p className="text-sm text-text-dim">
              Cater the look and feel to your environment.
            </p>
          </div>

          <div className="bg-bg-card border border-border-main rounded-xl p-4 sm:p-6 space-y-8">
            {/* Theme Style */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">
                Device Interface Style
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: "brand-tropic-vibes",
                    name: "Tropic Vibes",
                    desc: "Electric Cyan & Balandra Purple.",
                    preview: (
                      <div
                        className="h-full w-full rounded border border-border-main flex items-center justify-center"
                        style={{ backgroundColor: "#050505" }}
                      >
                        <div
                          className="w-1/2 h-2"
                          style={{
                            background:
                              "linear-gradient(135deg, #22d3ee, #a855f7)",
                          }}
                        />
                      </div>
                    ),
                  },
                  {
                    id: "brand-mango",
                    name: "Mango",
                    desc: "Warm ambers and deep browns.",
                    preview: (
                      <div
                        className="h-full w-full rounded border border-border-main flex items-center justify-center"
                        style={{ backgroundColor: "#11100d" }}
                      >
                        <div
                          className="w-1/2 h-2"
                          style={{ background: "#f59e0b" }}
                        />
                      </div>
                    ),
                  },
                  {
                    id: "brand-balandra",
                    name: "Balandra",
                    desc: "Purple and crimson contrast.",
                    preview: (
                      <div
                        className="h-full w-full rounded border border-border-main flex items-center justify-center"
                        style={{ backgroundColor: "#0e0d12" }}
                      >
                        <div
                          className="w-1/2 h-2"
                          style={{ background: "#a855f7" }}
                        />
                      </div>
                    ),
                  },
                  {
                    id: "brand-playa",
                    name: "Playa",
                    desc: "Cool blues and turquoise.",
                    preview: (
                      <div
                        className="h-full w-full rounded border border-border-main flex items-center justify-center"
                        style={{ backgroundColor: "#06b6d4" }}
                      >
                        <div
                          className="w-1/2 h-2"
                          style={{ background: "#06b6d4" }}
                        />
                      </div>
                    ),
                  },
                  {
                    id: "brand-pitahaya",
                    name: "Pitahaya",
                    desc: "Scarlet red and deep crimson.",
                    preview: (
                      <div
                        className="h-full w-full rounded border border-border-main flex items-center justify-center"
                        style={{ backgroundColor: "#120c0d" }}
                      >
                        <div
                          className="w-1/2 h-2"
                          style={{ background: "#ef4444" }}
                        />
                      </div>
                    ),
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setGlobalTheme(t.id as any)}
                    className={cn(
                      "flex flex-col gap-3 p-4 rounded-xl border transition-all text-left group",
                      globalTheme === t.id
                        ? "bg-brand/5 border-brand ring-1 ring-brand"
                        : "bg-text-bright/5 border-border-main hover:border-text-bright/20",
                    )}
                  >
                    <div className="w-full h-16 rounded overflow-hidden">
                      {t.preview}
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center justify-between">
                        {t.name}
                        {globalTheme === t.id && (
                          <Check size={14} className="text-brand" />
                        )}
                      </div>
                      <p className="text-[10px] text-text-dim group-hover:text-text-bright transition-colors">
                        {t.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim">
                Color Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "dark",
                    name: "Stage Dark",
                    desc: "Standard OLED-optimized black for performances.",
                    class: "bg-black text-white border-text-bright/20",
                  },
                  {
                    id: "light",
                    name: "Studio Light",
                    desc: "High visibility daylight mode. Good for rehearsals.",
                    class: "bg-text-bright text-bg-deep border-black/20",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setGlobalMode(m.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                      globalMode === m.id
                        ? "bg-brand/5 border-brand ring-1 ring-brand"
                        : "bg-transparent border-border-main hover:border-brand/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border shrink-0",
                        m.class,
                      )}
                    />
                    <div>
                      <div className="font-bold text-sm flex items-center justify-between">
                        {m.name}
                        {globalMode === m.id && (
                          <Check size={14} className="text-brand" />
                        )}
                      </div>
                      <p className="text-[10px] text-text-dim group-hover:text-text-bright transition-colors">
                        {m.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-text-bright/5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-bright tracking-tight">
              Stage Layout
            </h2>
            <p className="text-sm text-text-dim">
              Customize element positions and visibility on the stage.
            </p>
          </div>

          <div className="bg-bg-card border border-border-main rounded-xl p-4 lg:p-6">
            <Reorder.Group
              axis="y"
              values={stageLayout}
              onReorder={setStageLayout}
              className="space-y-3"
            >
              {stageLayout.map((id) => {
                const blockInfo = AVAILABLE_BLOCKS.find((b) => b.id === id);
                if (!blockInfo) return null;
                const isVisible = stageVisibility[id] ?? true;

                return (
                  <DraggableStageBlock
                    key={id}
                    id={id}
                    blockInfo={blockInfo}
                    isVisible={isVisible}
                    toggleVisibility={() => {
                      setStageVisibility({
                        ...stageVisibility,
                        [id]: !isVisible,
                      });
                    }}
                  />
                );
              })}
            </Reorder.Group>
            <p className="text-[10px] text-text-dim mt-4 flex items-center gap-2">
              <GripVertical size={12} className="opacity-50" />
              Drag elements to reorder them on your stage. Tap the eye icon to
              hide/show them.
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-8 border-t border-text-bright/5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-bright tracking-tight">
              Collaboration
            </h2>
            <p className="text-sm text-text-dim">
              Manage how changes sync with bandmates.
            </p>
          </div>

          <div className="bg-bg-card border border-border-main rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 pr-4">
                <h3 id="live-sync-label" className="font-bold">Real-time Stage Sync</h3>
                <p id="live-sync-desc" className="text-[10px] text-text-dim leading-relaxed">
                  When enabled, any song selected by the band leader will
                  automatically change on all members' screens over the network.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={isLiveSyncEnabled}
                aria-labelledby="live-sync-label"
                aria-describedby="live-sync-desc"
                onClick={() => setIsLiveSyncEnabled(!isLiveSyncEnabled)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep focus-visible:outline-none",
                  isLiveSyncEnabled ? "bg-brand" : "bg-text-bright/10",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                    isLiveSyncEnabled ? "translate-x-6" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
