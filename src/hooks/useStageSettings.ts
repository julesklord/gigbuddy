import { useState, useEffect } from "react";

export function useStageSettings() {
  const [textSizeMultiplier, setTextSizeMultiplier] = useState<number>(() => {
    const cached = localStorage.getItem("gigbuddy_text_size");
    return cached ? parseFloat(cached) : 1;
  });

  const [isTransportFloating, setIsTransportFloating] = useState<boolean>(() => {
    const cached = localStorage.getItem("gigbuddy_transport_floating");
    return cached === "true";
  });

  const [isYouTubeDocked, setIsYouTubeDocked] = useState<boolean>(() => {
    const cached = localStorage.getItem("gigbuddy_youtube_docked");
    return cached === "true";
  });

  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem("gigbuddy_font_family") || "sans";
  });

  const [chordBackground, setChordBackground] = useState<string>(() => {
    return localStorage.getItem("gigbuddy_chord_bg") || "none";
  });

  const [stageLayout, setStageLayout] = useState<string[]>(() => {
    const cached = localStorage.getItem("gigbuddy_stage_layout");
    return cached
      ? JSON.parse(cached)
      : ["header", "performance_notes", "attachments", "lyrics"];
  });

  const [stageVisibility, setStageVisibility] = useState<Record<string, boolean>>(() => {
    const cached = localStorage.getItem("gigbuddy_stage_visibility");
    return cached
      ? JSON.parse(cached)
      : {
          header: true,
          performance_notes: true,
          attachments: true,
          lyrics: true,
        };
  });

  useEffect(() => {
    localStorage.setItem("gigbuddy_font_family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem("gigbuddy_chord_bg", chordBackground);
  }, [chordBackground]);

  useEffect(() => {
    localStorage.setItem("gigbuddy_stage_layout", JSON.stringify(stageLayout));
  }, [stageLayout]);

  useEffect(() => {
    localStorage.setItem(
      "gigbuddy_stage_visibility",
      JSON.stringify(stageVisibility),
    );
  }, [stageVisibility]);

  useEffect(() => {
    localStorage.setItem("gigbuddy_text_size", textSizeMultiplier.toString());
  }, [textSizeMultiplier]);

  useEffect(() => {
    localStorage.setItem(
      "gigbuddy_transport_floating",
      isTransportFloating.toString(),
    );
  }, [isTransportFloating]);

  useEffect(() => {
    localStorage.setItem("gigbuddy_youtube_docked", isYouTubeDocked.toString());
  }, [isYouTubeDocked]);

  return {
    textSizeMultiplier,
    setTextSizeMultiplier,
    isTransportFloating,
    setIsTransportFloating,
    isYouTubeDocked,
    setIsYouTubeDocked,
    fontFamily,
    setFontFamily,
    chordBackground,
    setChordBackground,
    stageLayout,
    setStageLayout,
    stageVisibility,
    setStageVisibility,
  };
}
