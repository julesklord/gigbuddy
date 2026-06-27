import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Settings,
  Users,
  Music,
  ExternalLink,
  Clock,
  Layers,
  Edit2,
  Save,
  X,
  Menu,
  ChevronRight,
  Check,
  Globe,
  Trash2,
  LogOut,
  UserCircle,
  Shield,
  ArrowDown,
  Upload,
  Search,
  Printer,
  AlignLeft,
  User as UserIcon,
  LayoutTemplate,
} from "lucide-react";
import { SongStatus, Song, SetlistItem, UserProfile, Band } from "./types";
import {
  auth,
  signIn,
  signOut,
  signInGuest,
  isFirebaseConfigured,
} from "./services/firebase";
import { bandService } from "./services/bandService";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { motion, Reorder } from "motion/react";
import { MetronomePlugin } from "./plugins/MetronomePlugin";
import { ChordDatabase } from "./components/tools/ChordDatabase";
import {
  SpotifyPlayer,
  SpotifyPlayerRef,
} from "./components/media/SpotifyPlayer";
import { YouTubePlayer } from "./components/media/YouTubePlayer";
import { YoutubeSearch } from "./components/media/YoutubeSearch";
import { CollaborativeNotes } from "./components/collaboration/CollaborativeNotes";
import { AttachmentsManager } from "./components/files/AttachmentsManager";
import { PrintView } from "./components/PrintView";
import { transposeChord, transposeKey } from "./lib/musicUtils";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Badge } from "./components/ui/Badge";
import { DecibelMeter } from "./components/tools/DecibelMeter";

import { LyricLine } from "./components/LyricLine";
import { GlobalSettingsView } from "./components/GlobalSettingsView";
import { UserConfigView } from "./components/UserConfigView";
import { BandConfigView } from "./components/BandConfigView";
import { SetlistReorderItem } from "./components/SetlistReorderItem";
import { useTheme } from "./hooks/useTheme";
import { useStageSettings } from "./hooks/useStageSettings";
// Playback Types
interface MediaSource {
  type: "spotify" | "youtube" | "none";
  id?: string;
  isActive: boolean;
}

// Render a single line of lyrics with chords above
export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleSignOut = async () => {
    localStorage.removeItem("gigbuddy_guest_mode");
    setUser(null);
    await signOut();
  };

  const handleGuestLogin = async () => {
    localStorage.setItem("gigbuddy_guest_mode", "true");
    try {
      const userCred = await signInGuest();
      const uid = userCred.user.uid;
      setUser(userCred.user);
      setBandId("local-gig-band");
      setGigId("local-gig-band");
      setBandData({
        id: "local-gig-band",
        name: "Gig Local (Offline)",
        ownerId: uid,
        members: [uid],
        setlist: [],
        createdAt: null,
        updatedAt: null,
      } as any);
      setIsLiveSyncEnabled(false);
    } catch {
      setUser({
        uid: "local-guest",
        displayName: "Musico Invitado",
        isAnonymous: true,
        email: "guest@gigbuddy.local",
      } as any);
      setBandId("local-gig-band");
      setGigId("local-gig-band");
      setBandData({
        id: "local-gig-band",
        name: "Gig Local (Offline)",
        ownerId: "local-guest",
        members: ["local-guest"],
        setlist: [],
        createdAt: null,
        updatedAt: null,
      } as any);
      setIsLiveSyncEnabled(false);
    }
  };
  const [songs, setSongs] = useState<Song[]>(() => {
    // Initial load from localStorage for offline quick-start
    const cached = localStorage.getItem("gigbuddy_cache_songs");
    return cached ? JSON.parse(cached) : [];
  });

  const [activeSongId, setActiveSongId] = useState<string | null>(() => {
    return localStorage.getItem("gigbuddy_cache_active_id");
  });
  const [bandId, setBandId] = useState<string | null>(() => {
    return localStorage.getItem("gigbuddy_current_band_id");
  });
  const [gigId, setGigId] = useState<string | null>(() => {
    return localStorage.getItem("gigbuddy_current_gig_id");
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [pendingSyncs, setPendingSyncs] = useState(0); // test edit
  const [isEditing, setIsEditing] = useState(false);

  const {
    globalTheme,
    setGlobalTheme,
    globalMode,
    setGlobalMode,
  } = useTheme();

  const {
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
  } = useStageSettings();

  const [appView, setAppView] = useState<
    "main" | "userConfig" | "bandConfig" | "globalSettings"
  >("main");

  const [isLiveSyncEnabled, setIsLiveSyncEnabled] = useState(false);
  const [bandData, setBandData] = useState<Band | null>(null);
  const [userBands, setUserBands] = useState<Band[]>([]);

  useEffect(() => {
    if (user && user.uid !== "local-guest" && !bandId && !gigId) {
      bandService.getUserBands().then(setUserBands).catch(console.error);
    }
  }, [user, bandId, gigId]);

  // Apply band styles overrides
  useEffect(() => {
    let overrideStyleElement = document.getElementById("band-styles-override");
    if (!overrideStyleElement) {
      overrideStyleElement = document.createElement("style");
      overrideStyleElement.id = "band-styles-override";
      document.head.appendChild(overrideStyleElement);
    }

    if (
      bandData &&
      (bandData.accentColor || bandData.fontFamily) &&
      appView === "main"
    ) {
      let customCSS = `:root {`;
      if (bandData.accentColor) {
        customCSS += `\n  --color-brand: ${bandData.accentColor};`;
        const hex = bandData.accentColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        const contrast = yiq >= 128 ? "#000000" : "#ffffff";
        customCSS += `\n  --color-brand-contrast: ${contrast};`;
      }
      if (bandData.fontFamily)
        customCSS += `\n  --font-sans: "${bandData.fontFamily}", ui-sans-serif, system-ui, sans-serif;`;
      customCSS += `\n}`;
      overrideStyleElement.textContent = customCSS;
    } else {
      overrideStyleElement.textContent = "";
    }
  }, [bandData, appView]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editedLyrics, setEditedLyrics] = useState("");
  const [editMode, setEditMode] = useState<"visual" | "raw">("visual");
  const [visualSections, setVisualSections] = useState<any[]>([]);
  const [visualMetadata, setVisualMetadata] = useState<{
    title?: string;
    artist?: string;
    key: string;
    bpm?: number;
    capo: number;
    duration: number;
    notes: string[];
    youtubeId: string;
    attachments: any[];
  }>({
    title: "",
    artist: "",
    key: "",
    capo: 0,
    duration: 0,
    notes: [],
    youtubeId: "",
    attachments: [],
  });

  // Teleprompter State
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(() => {
    const cached = localStorage.getItem("gigbuddy_scroll_speed");
    return cached ? parseFloat(cached) : 1;
  });

  useEffect(() => {
    localStorage.setItem(
      "gigbuddy_scroll_speed",
      scrollSpeedMultiplier.toString(),
    );
  }, [scrollSpeedMultiplier]);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const lastAutoScrollTop = useRef(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setlist Library State
  const [savedSetlists, setSavedSetlists] = useState<
    import("./types").SavedSetlist[]
  >([]);
  const [setlistView, setSetlistView] = useState<"current" | "library">(
    "current",
  );
  const [isSavingSetlist, setIsSavingSetlist] = useState(false);
  const [newSetlistTitle, setNewSetlistTitle] = useState("");

  // Animation States
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">(
    "idle",
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync checker
    const syncInterval = setInterval(() => {
      setPendingSyncs(bandService.getPendingSyncCount());
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, []);
  // Computed active song
  const activeSong = songs.find((s) => s.id === activeSongId) || songs[0];

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Simulate guest session if offline/unconfigured
      if (localStorage.getItem("gigbuddy_guest_mode") === "true") {
        setUser({
          uid: "local-guest",
          displayName: "Musico Invitado",
          isAnonymous: true,
          email: "guest@gigbuddy.local",
        } as any);
      }
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (localStorage.getItem("gigbuddy_guest_mode") === "true" && !u) {
        setUser({
          uid: "local-guest",
          displayName: "Musico Invitado",
          isAnonymous: true,
          email: "guest@gigbuddy.local",
        } as any);
        setUserProfile({
          uid: "local-guest",
          displayName: "Musico Invitado",
          photoURL: "",
          bio: "Ready to play.",
          updatedAt: null,
        });
        return;
      }
      setUser(u);
      if (u) {
        const profile = await bandService.getProfile(u.uid);
        if (profile) {
          setUserProfile(profile);
          if (profile.stageLayout) setStageLayout(profile.stageLayout);
          if (profile.stageVisibility)
            setStageVisibility(profile.stageVisibility);
        } else {
          // Initialize profile
          const initial = {
            displayName: u.displayName || "Musician",
            photoURL: u.photoURL || "",
            bio: "",
          };
          await bandService.updateProfile(u.uid, initial);
          setUserProfile({ ...initial, uid: u.uid, updatedAt: null });
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (bandId) {
      bandService
        .getBand(bandId)
        .then((b) => {
          if (b) setBandData(b);
        })
        .catch((err) => {
          if (err && err.code === "permission-denied") {
            console.warn("Access denied. Leaving band.");
            setBandId(null);
            localStorage.removeItem("gigbuddy_current_band_id");
          }
        });
    } else {
      setBandData(null);
    }
  }, [bandId]);

  // Sync state to local storage for offline access
  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem("gigbuddy_cache_songs", JSON.stringify(songs));
    }
    if (activeSongId) {
      localStorage.setItem("gigbuddy_cache_active_id", activeSongId);
    }
    if (bandId) localStorage.setItem("gigbuddy_current_band_id", bandId);
    if (gigId) localStorage.setItem("gigbuddy_current_gig_id", gigId);
  }, [songs, activeSongId, bandId, gigId]);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || (!bandId && !gigId)) return;

    const context = bandId ? "bands" : "gigs";
    const targetId = (bandId || gigId) as string;

    // Listen for the active song ID synced globally
    const unsubSession = bandService.subscribeToSession(
      context,
      targetId,
      (session) => {
        if (isLiveSyncEnabled && session.activeSongId) {
          setActiveSongId(session.activeSongId);
        }

        // Sync setlist order if enabled
        if (
          isLiveSyncEnabled &&
          session.setlist &&
          session.setlist.length > 0
        ) {
          setSongs((prevSongs) => {
            const sorted = [...prevSongs].sort((a, b) => {
              const itemA = session.setlist.find((i) => i.songId === a.id);
              const itemB = session.setlist.find((i) => i.songId === b.id);
              return (itemA?.order ?? 999) - (itemB?.order ?? 999);
            });
            return sorted;
          });
        }
      },
    );

    // We only subscribe to songs if we are in a BAND context
    // In GIG context, songs are typically pulled from a band or shared context,
    // but for now, we'll assume the band songs are available if a bandId exists.
    let unsubSongs = () => {};
    let unsubSetlists = () => {};
    if (bandId) {
      unsubSongs = bandService.subscribeToSongs(bandId, (fetchedSongs) => {
        setSongs(fetchedSongs);
      });
      unsubSetlists = bandService.subscribeToSavedSetlists(
        bandId,
        (fetchedSetlists) => {
          setSavedSetlists(fetchedSetlists);
        },
      );
    }

    return () => {
      unsubSession();
      unsubSongs();
      unsubSetlists();
    };
  }, [user, bandId, gigId, isLiveSyncEnabled]);

  const toggleEdit = () => {
    if (!activeSong) return;
    const isNowEditing = !isEditing;
    setIsEditing(isNowEditing);
    setAppMode(isNowEditing ? "edit" : "live");
    if (isNowEditing) {
      setEditedLyrics(JSON.stringify(activeSong.sections, null, 2));
      setVisualSections(JSON.parse(JSON.stringify(activeSong.sections))); // Deep clone
      setVisualMetadata({
        title: activeSong.title,
        artist: activeSong.artist,
        key: activeSong.key,
        bpm: activeSong.bpm,
        capo: activeSong.capo || 0,
        duration: activeSong.duration || 0,
        notes: [...activeSong.notes],
        youtubeId: activeSong.youtubeId || "",
        attachments: activeSong.attachments || [],
      });
    }
  };

  const handleSave = async () => {
    if (!activeSong) return;
    try {
      setSaveState("saving");

      let newSections;
      let metadata;

      if (editMode === "raw") {
        newSections = JSON.parse(editedLyrics);
        metadata = visualMetadata;
      } else {
        newSections = visualSections;
        metadata = visualMetadata;
      }

      const updatedSong: Song = {
        ...activeSong,
        sections: newSections,
        title: metadata.title || activeSong.title,
        artist: metadata.artist || activeSong.artist,
        key: metadata.key,
        bpm: metadata.bpm,
        capo: metadata.capo,
        duration: metadata.duration,
        notes: metadata.notes,
        youtubeId: metadata.youtubeId,
        attachments: metadata.attachments,
        status: SongStatus.PENDING, // Local indicator
      };

      // Optimistic local update
      setSongs((prev) =>
        prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)),
      );

      await bandService.saveSong(bandId!, updatedSong);

      setSaveState("success");
      setTimeout(() => {
        setSaveState("idle");
        setIsEditing(false);
        setAppMode("live");
      }, 1500);
    } catch {
      alert("Invalid JSON format for sections.");
      setSaveState("idle");
    }
  };

  const updateVisualLine = (sIdx: number, lIdx: number, text: string) => {
    const newSections = [...visualSections];
    newSections[sIdx].lines[lIdx].text = text;
    setVisualSections(newSections);
    setEditedLyrics(JSON.stringify(newSections, null, 2));
  };

  const updateSectionTitle = (sIdx: number, title: string) => {
    const newSections = [...visualSections];
    newSections[sIdx].title = title;
    setVisualSections(newSections);
    setEditedLyrics(JSON.stringify(newSections, null, 2));
  };

  const addVisualLine = (sIdx: number) => {
    const newSections = [...visualSections];
    newSections[sIdx].lines.push({ text: "", chords: [] });
    setVisualSections(newSections);
    setEditedLyrics(JSON.stringify(newSections, null, 2));
  };

  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [viewingSongId, setViewingSongId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"setlist" | "stage" | "notes">(
    "setlist",
  );
  const [sessionToolsTab, setSessionToolsTab] = useState<
    "sync" | "notes" | "tools" | "youtube"
  >("sync");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [appMode, setAppMode] = useState<"live" | "edit">("live");
  const [printMode, setPrintMode] = useState<"library" | "setlist" | null>(
    null,
  );
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleExportPDF = (mode: "library" | "setlist") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  useEffect(() => {
    const afterPrint = () => setPrintMode(null);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [isLiveViewActive, setIsLiveViewActive] = useState(false);
  const [transposeOffset, setTransposeOffset] = useState(0);

  // Media Integration States
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [mediaSource, setMediaSource] = useState<MediaSource>({
    type: "none",
    isActive: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const spotifyPlayerRef = useRef<SpotifyPlayerRef>(null);

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) return songs;
    const query = songSearchQuery.toLowerCase();
    return songs.filter((song) => {
      const titleMatch = song.title.toLowerCase().includes(query);
      const artistMatch = song.artist?.toLowerCase().includes(query);
      return titleMatch || artistMatch;
    });
  }, [songs, songSearchQuery]);

  // Teleprompter Auto-Scroll Effect
  useEffect(() => {
    lastAutoScrollTop.current = -1;
    if (
      !isAutoScrollEnabled ||
      !isPlaying ||
      isEditing ||
      appMode !== "live" ||
      !stageScrollRef.current
    ) {
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollLoop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (stageScrollRef.current && activeSong) {
        // Base pixels per second based on BPM (assuming ~0.3px per BPM as a baseline)
        const basePixelsPerSecond = (activeSong.bpm || 120) * 0.3;
        const currentSpeed = basePixelsPerSecond * scrollSpeedMultiplier;

        const el = stageScrollRef.current;
        if (lastAutoScrollTop.current === -1) {
          lastAutoScrollTop.current = el.scrollTop;
        }

        // Only scroll downward if we haven't reached the bottom
        if (el.scrollTop + el.clientHeight < el.scrollHeight) {
          el.scrollTop += currentSpeed * (deltaTime / 1000);
          lastAutoScrollTop.current = el.scrollTop;
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isAutoScrollEnabled,
    isPlaying,
    isEditing,
    appMode,
    scrollSpeedMultiplier,
    activeSong,
  ]);

  useEffect(() => {
    // Check for tokens on load
    const checkTokens = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (data.spotify_access_token)
          setSpotifyToken(data.spotify_access_token);
      } catch (err) {
        console.warn("Auth status fetch issue:", err);
      }
    };
    checkTokens();
  }, []);

  // Listen for OAuth Success Messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS") {
        window.location.reload(); // Refresh to get cookies/tokens
      }
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        window.location.reload();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const youtubePlayerRef =
    useRef<import("./components/media/YouTubePlayer").YouTubePlayerRef>(null);

  const togglePlayback = () => {
    if (mediaSource.type === "spotify" && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.togglePlay();
    } else if (mediaSource.type === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.togglePlay();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = () => {
    if (mediaSource.type === "spotify" && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.nextTrack();
    } else if (mediaSource.type === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekForward(15);
    } else {
      if (songs.length === 0) return;
      const currentIndex = songs.findIndex((s) => s.id === activeSongId);
      const nextIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
      handleSongSelect(songs[nextIndex]);
    }

    if (stageScrollRef.current) {
      stageScrollRef.current.scrollTop = 0;
      lastAutoScrollTop.current = 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));

    if (mediaSource.type === "youtube" && youtubePlayerRef.current) {
      const duration =
        youtubePlayerRef.current.getDuration() || activeSong?.duration || 0;
      if (duration > 0) {
        youtubePlayerRef.current.seekTo(duration * progress);
      }
    }

    if (stageScrollRef.current) {
      const el = stageScrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0) {
        el.scrollTop = maxScroll * progress;
        lastAutoScrollTop.current = el.scrollTop;
      }
    }
  };

  useEffect(() => {
    if (
      !isPlaying ||
      mediaSource.type !== "youtube" ||
      !youtubePlayerRef.current
    )
      return;

    const updateProgress = () => {
      if (youtubePlayerRef.current) {
        const duration = youtubePlayerRef.current.getDuration();
        const current = youtubePlayerRef.current.getCurrentTime();
        if (duration > 0) {
          const progress = current / duration;
          const progressEls = document.querySelectorAll(
            ".transport-progress-bar",
          );
          progressEls.forEach((p) => {
            if (p instanceof HTMLElement) {
              p.style.width = `${progress * 100}%`;
            }
          });
        }
      }
      if (isPlaying) {
        requestAnimationFrame(updateProgress);
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, mediaSource.type]);

  const skipBackward = () => {
    if (mediaSource.type === "spotify" && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.previousTrack();
    } else if (mediaSource.type === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekBackward(15);
    } else {
      if (songs.length === 0) return;
      const currentIndex = songs.findIndex((s) => s.id === activeSongId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
      handleSongSelect(songs[prevIndex]);
    }

    if (stageScrollRef.current) {
      stageScrollRef.current.scrollTop = 0;
      lastAutoScrollTop.current = 0;
    }
  };

  const viewingSong = songs.find((s) => s.id === viewingSongId);

  const handleAddNewSong = async (e: any) => {
    e.preventDefault();
    if (!newSongTitle.trim() || !bandId) {
      if (!bandId)
        alert("Cannot add songs. You must be in an active band session.");
      return;
    }

    const newSong: Partial<Song> = {
      title: newSongTitle,
      key: "C Major",
      bpm: undefined,
      duration: 0,
      capo: 0,
      sections: [
        {
          title: "Verse 1",
          lines: [{ text: "Start typing here...", chords: [] }],
        },
      ],
      notes: [],
      status: SongStatus.PENDING,
    };

    const id = await bandService.saveSong(bandId, newSong);

    // Optimistic local update
    setSongs((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return [{ ...newSong, id } as Song, ...filtered];
    });

    setNewSongTitle("");
    setIsAddingSong(false);
    setActiveSongId(id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        let unwrapped = parsed;
        if (parsed.repertorio && Array.isArray(parsed.repertorio)) {
          unwrapped = parsed.repertorio;
        } else if (parsed.songs && Array.isArray(parsed.songs)) {
          unwrapped = parsed.songs;
        }

        const importedItems = Array.isArray(unwrapped)
          ? unwrapped
          : [unwrapped];

        const validSongs: Partial<Song>[] = importedItems
          .filter(
            (item) =>
              item && typeof item === "object" && (item.title || item.titulo),
          )
          .map((item) => ({
            title: item.title || item.titulo,
            artist: item.artist || item.artista || "",
            key: item.key || item.acordes || "C Major",
            bpm: item.bpm,
            duration: item.duration || 0,
            capo: item.capo || 0,
            sections: item.sections ||
              item.letra || [
                {
                  title: "Verse 1",
                  lines: [{ text: "Start typing here...", chords: [] }],
                },
              ],
            notes: item.notes || [],
            status: SongStatus.PENDING,
            youtubeId: item.youtubeId,
            streamingUrl: item.streamingUrl,
          }));

        if (validSongs.length === 0) {
          alert(
            'No valid songs found in the JSON file. A song needs at least a "title" or "titulo".',
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const newSongs: Song[] = [];
        for (const songTemplate of validSongs) {
          if (!bandId) {
            alert(
              "Cannot import songs. You must be in an active band session.",
            );
            return;
          }
          const id = await bandService.saveSong(bandId, songTemplate);
          newSongs.push({ ...songTemplate, id } as Song);
        }

        setSongs((prev) => {
          const prevFiltered = prev.filter(
            (p) => !newSongs.some((n) => n.id === p.id),
          );
          return [...newSongs, ...prevFiltered];
        });
        setActiveSongId(newSongs[0].id);

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Invalid JSON file. Make sure it matches the gigBuddy format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearSetlist = async () => {
    setConfirmDialog({
      message:
        "Are you sure you want to clear the entire current setlist? This will remove all songs from the active session. If you haven't saved it to the library, it will be lost.",
      onConfirm: async () => {
        if (bandId) {
          // Delete from backend in parallel
          await Promise.all(
            songs.map((song) => bandService.deleteSong(bandId, song.id)),
          );
          await bandService.updateSetlist("bands", bandId, []);
          await bandService.updateActiveSong("bands", bandId, null);
        } else if (gigId) {
          await bandService.updateSetlist("gigs", gigId, []);
          await bandService.updateActiveSong("gigs", gigId, null);
        }
        setSongs([]);
        setActiveSongId(null);
      },
    });
  };

  const handleSaveSetlist = async (e: any) => {
    e.preventDefault();
    if (!newSetlistTitle.trim() || !bandId || songs.length === 0) return;

    await bandService.saveSetlistToLibrary(bandId, newSetlistTitle, songs);
    setNewSetlistTitle("");
    setIsSavingSetlist(false);
  };

  const handleDeleteSong = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      message: "Delete this song?",
      onConfirm: async () => {
        if (bandId) {
          await bandService.deleteSong(bandId, songId);
        }
        const filtered = songs.filter((s) => s.id !== songId);
        setSongs(filtered);
        if (activeSongId === songId) {
          setActiveSongId(filtered.length > 0 ? filtered[0].id : null);
        }
      },
    });
  };

  const handleLoadSavedSetlist = async (
    saved: import("./types").SavedSetlist,
  ) => {
    setConfirmDialog({
      message: `Load "${saved.title}"? This will clear the current setlist.`,
      onConfirm: async () => {
        if (bandId) {
          // Clear current
          await Promise.all(
            songs.map((song) => bandService.deleteSong(bandId!, song.id)),
          );

          // Import saved
          for (const songTemplate of saved.songs) {
            // Strip ID to let saveSong generate a new one, or keep same ID logic?
            // generating new copies for the session ensures edits in one session don't accidentally corrupt a previous library save's internal pointers.
            const cleanSongTemplate = { ...songTemplate } as any;
            delete cleanSongTemplate.id;
            await bandService.saveSong(bandId, cleanSongTemplate);
          }
        }
        setSetlistView("current");
      },
    });
  };

  // Effect for countdown timer
  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && pendingSongId) {
      handlePushToStage(pendingSongId);
      setIsLiveViewActive(true);
      setCountdown(null);
      setPendingSongId(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, pendingSongId]);

  const handleSongSelect = (song: Song) => {
    setActiveSongId(song.id);

    if (appMode === "edit") {
      setEditedLyrics(JSON.stringify(song.sections, null, 2));
      setVisualSections(JSON.parse(JSON.stringify(song.sections)));
      setVisualMetadata({
        title: song.title,
        artist: song.artist,
        key: song.key,
        bpm: song.bpm,
        capo: song.capo || 0,
        duration: song.duration || 0,
        notes: song.notes,
        youtubeId: song.youtubeId || "",
        attachments: song.attachments || [],
      });
      setIsEditing(true);
      setMobileView("stage");
    } else {
      // In Live Mode, just select the song globally if sync is enabled
      if (isLiveSyncEnabled && (bandId || gigId)) {
        const context = bandId ? "bands" : "gigs";
        const targetId = (bandId || gigId) as string;
        bandService.updateActiveSong(context, targetId, song.id);
      }
      setMobileView("stage");
    }
  };

  const cancelCountdown = () => {
    setCountdown(null);
    setPendingSongId(null);
  };

  const handlePushToStage = async (id: string) => {
    const context = bandId ? "bands" : "gigs";
    const targetId = (bandId || gigId) as string;
    await bandService.updateActiveSong(context, targetId, id);
    setViewingSongId(null);
    setTransposeOffset(0); // Reset transpose when a new song is launched
  };

  const handleReorderSongs = async (newSongs: Song[]) => {
    setSongs(newSongs);

    if (isLiveSyncEnabled && (bandId || gigId)) {
      const context = bandId ? "bands" : "gigs";
      const targetId = (bandId || gigId) as string;
      const newSetlist: SetlistItem[] = newSongs.map((s, i) => ({
        id: `idx-${i}`,
        songId: s.id,
        order: i,
        status: SongStatus.PENDING,
      }));
      await bandService.updateSetlist(context, targetId, newSetlist);
    }
  };

  const handleMoveSong = async (index: number, direction: "up" | "down") => {
    const newSongs = [...songs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSongs.length) return;

    const temp = newSongs[index];
    newSongs[index] = newSongs[targetIndex];
    newSongs[targetIndex] = temp;

    handleReorderSongs(newSongs);
  };

  const handleCreateBand = async (name: string) => {
    const id = await bandService.createBand(name);
    setBandId(id);
    setGigId(null);
  };

  const handleSoloMode = async () => {
    if (user && !user.isAnonymous) {
      const soloId = `solo-${user.uid}`;
      try {
        if (navigator.onLine) {
          await bandService.ensureBandExists(
            soloId,
            `Solo • ${user.displayName || "Músico"}`,
          );
        }
      } catch (err) {
        console.error("Failed to setup persistent solo mode", err);
      }
      setBandId(soloId);
      setGigId(null);
      return;
    }

    setBandId("local-solo");
    setGigId("local-solo");
    setIsLiveSyncEnabled(false);
    setBandData({
      id: "local-solo",
      name: "Actuación en Solitario",
      ownerId: user?.uid || "local-guest",
      members: [user?.uid || "local-guest"],
      setlist: [],
      createdAt: new Date().toISOString(),
    } as any);
  };

  const handleLeaveBand = async (
    e: React.MouseEvent,
    bandId: string,
    isOwner: boolean,
  ) => {
    e.stopPropagation();
    if (
      confirm(
        isOwner
          ? "Are you sure you want to delete this squad permanently?"
          : "Are you sure you want to leave this squad?",
      )
    ) {
      try {
        if (isOwner) {
          await bandService.deleteBand(bandId);
        } else {
          await bandService.leaveBand(bandId);
        }
        setUserBands((prev) => prev.filter((b) => b.id !== bandId));
      } catch (err) {
        console.error(err);
        alert("Failed to remove squad.");
      }
    }
  };

  const handleJoinSession = async (id: string) => {
    try {
      const cleanedId = id.trim();
      if (cleanedId.toLowerCase().startsWith("band-")) {
        await bandService.joinBand(cleanedId);
        setBandId(cleanedId);
        setGigId(null);
      } else if (cleanedId.toLowerCase().startsWith("gig-")) {
        setGigId(cleanedId);
        setBandId(null);
      } else {
        alert("Invalid ID format. Must start with band- or gig-");
      }
    } catch {
      alert("Session not found or connection error.");
    }
  };

  const logoutSession = () => {
    setBandId(null);
    setGigId(null);
    setSongs([]);
    setBandData(null);
    setAppView("main");
    localStorage.removeItem("gigbuddy_current_band_id");
    localStorage.removeItem("gigbuddy_current_gig_id");
  };

  if (!user) {
    return (
      <div className="h-dvh bg-bg-deep flex flex-col items-center justify-center p-8 gap-8 sm:gap-12 relative overflow-hidden">
        {/* Animated Background Accents */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand/10 blur-[150px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"
        />

        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <Badge variant="brand" size="sm" className="mb-4">
            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse mr-2" />
            System Online
          </Badge>
          <h1 className="text-8xl lg:text-[10rem] font-mono font-bold tracking-tighter text-text-bright italic leading-[0.85] select-none">
            gig<span className="text-brand">Buddy</span>
          </h1>
          <p className="text-text-dim/60 uppercase tracking-[0.5em] text-[10px] lg:text-xs max-w-sm mx-auto leading-relaxed">
            Precision tools for the modern touring musician.
          </p>
        </div>

        <Card className="w-full max-w-xs p-fluid-md lg:p-fluid-lg space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 relative z-10">
          <Button
            onClick={signIn}
            size="full"
            icon={<Users size={20} />}
            className="h-14 shadow-[0_0_20px_rgba(255,69,0,0.15)]"
          >
            Sign in with Google
          </Button>

          <Button
            onClick={handleGuestLogin}
            variant="secondary"
            size="full"
            icon={<UserCircle size={20} />}
            className="h-14"
          >
            Offline Local Mode
          </Button>
        </Card>

        <div className="mt-8 flex gap-12 text-text-bright/10 relative z-10">
          <div className="flex flex-col items-center gap-2 group transition-all cursor-default">
            <div className="p-3 border border-text-bright/5 bg-text-bright/5 rounded-2xl group-hover:bg-brand/10 group-hover:border-brand/20 group-hover:text-brand transition-all">
              <Music size={24} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold group-hover:text-text-bright transition-colors">
              Repertoire
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 group transition-all cursor-default">
            <div className="p-3 border border-text-bright/5 bg-text-bright/5 rounded-2xl group-hover:bg-brand/10 group-hover:border-brand/20 group-hover:text-brand transition-all">
              <Globe size={24} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold group-hover:text-text-bright transition-colors">
              Live Sync
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 group transition-all cursor-default">
            <div className="p-3 border border-text-bright/5 bg-text-bright/5 rounded-2xl group-hover:bg-brand/10 group-hover:border-brand/20 group-hover:text-brand transition-all">
              <Shield size={24} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono font-bold group-hover:text-text-bright transition-colors">
              Private
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-30 text-[8px] font-mono uppercase tracking-[0.2em]">
          Fearless Toys (Division encargada de desarrollo) - Fearless Media
          Group (Matrix)
        </div>
      </div>
    );
  }

  // --- SESSION PORTAL (JOIN OR CREATE) ---
  if (!bandId && !gigId) {
    return (
      <div className="h-dvh bg-bg-deep text-text-bright flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl w-full space-y-12 animate-in fade-in duration-500 relative z-10">
          <header className="text-center space-y-2">
            <h2 className="text-brand font-mono text-xs uppercase tracking-[0.5em]">
              Command Center
            </h2>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter">
              Enter the Hive.
            </h1>
            <p className="text-text-dim text-sm uppercase tracking-widest">
              Join your squad or start a new performance session.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {/* Saved Bands */}
            {userBands.length > 0 && (
              <div className="lg:col-span-2 bg-text-bright/5 border border-border-main p-fluid-md lg:p-fluid-lg rounded-3xl space-y-6 flex flex-col hover:border-brand/40 transition-all group">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-brand transition-colors">
                    Your Squads
                  </h3>
                  <p className="text-[10px] uppercase font-mono text-text-bright/40 tracking-widest mt-1">
                    Select a saved group to enter
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userBands.map((b) => {
                    const isOwner = b.ownerId === user?.uid;
                    return (
                      <div key={b.id} className="relative group/band">
                        <button
                          onClick={() => handleJoinSession(b.id)}
                          className="w-full px-4 py-3 bg-bg-deep/40 border border-text-bright/10 rounded-xl hover:border-brand/50 hover:bg-brand/10 transition-all text-left flex items-center gap-3 active:scale-[0.98]"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand/20 flex shrink-0 items-center justify-center text-brand font-bold text-sm">
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 pr-6">
                            <div className="font-bold text-sm truncate">
                              {b.name}
                            </div>
                            <div className="text-[9px] text-text-dim font-mono tracking-widest uppercase">
                              Select to join
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleLeaveBand(e, b.id, isOwner)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-dim hover:text-red-500 opacity-0 group-hover/band:opacity-100 transition-all"
                          title={isOwner ? "Delete Squad" : "Leave Squad"}
                        >
                          {isOwner ? (
                            <Trash2 size={14} />
                          ) : (
                            <LogOut size={14} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Join Existing */}
            <div className="bg-text-bright/5 border border-border-main p-8 rounded-3xl space-y-6 flex flex-col hover:border-brand/40 transition-all group">
              <div>
                <h3 className="text-xl font-bold group-hover:text-brand transition-colors">
                  Join Session
                </h3>
                <p className="text-[10px] uppercase font-mono text-text-bright/40 tracking-widest mt-1">
                  Enter a Group or Gig ID
                </p>
              </div>
              <input
                type="text"
                placeholder="Ex: group-K9XJ3P"
                className="w-full bg-bg-deep/40 border border-text-bright/10 rounded-xl px-4 py-3 text-brand font-mono uppercase tracking-widest focus:border-brand/50 focus:outline-none placeholder:text-text-bright/10 transition-all"
                id="session-code-input"
              />
              <Button
                onClick={async () => {
                  const val = (
                    document.getElementById(
                      "session-code-input",
                    ) as HTMLInputElement
                  ).value;
                  if (!val) return;
                  try {
                    await handleJoinSession(val);
                  } catch {
                    alert(
                      "No se pudo unir a la sesión. Revisa el ID e inténtalo de nuevo.",
                    );
                  }
                }}
                size="full"
              >
                Sync with Group
              </Button>
            </div>

            {/* Create New */}
            <div className="bg-text-bright/5 border border-border-main p-8 rounded-3xl space-y-6 flex flex-col hover:border-brand/40 transition-all group">
              <div>
                <h3 className="text-xl font-bold group-hover:text-brand transition-colors">
                  New Session
                </h3>
                <p className="text-[10px] uppercase font-mono text-text-bright/40 tracking-widest mt-1">
                  Create a unique ID
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCreateBand("My New Group")}
                  className="w-full py-4 border border-text-bright/10 rounded-xl flex items-center justify-center gap-4 hover:bg-text-bright/5 transition-all group active:scale-[0.98] text-left"
                >
                  <div className="p-2 bg-brand/10 rounded-lg group-hover:bg-brand transition-colors">
                    <Users
                      size={18}
                      className="text-brand group-hover:text-brand-contrast transition-colors"
                    />
                  </div>
                  <div className="grow">
                    <div className="text-sm font-bold uppercase tracking-tight">
                      Permanent Group
                    </div>
                    <div className="text-[9px] text-text-dim uppercase tracking-widest font-mono">
                      Full collaboration ID
                    </div>
                  </div>
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-text-bright/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[8px] font-mono text-text-bright/20">
                    <span className="bg-bg-deep px-2">OR</span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const id =
                        await bandService.createPerformance("One-Time Gig");
                      setGigId(id);
                    } catch {
                      alert("System Error: No se pudo crear la performance.");
                    }
                  }}
                  className="w-full py-4 border border-text-bright/10 rounded-xl flex items-center justify-center gap-4 hover:bg-text-bright/5 transition-all group active:scale-[0.98] text-left"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500 transition-colors">
                    <Clock
                      size={18}
                      className="text-blue-400 group-hover:text-black transition-colors"
                    />
                  </div>
                  <div className="grow">
                    <div className="text-sm font-bold uppercase tracking-tight">
                      Single Performance
                    </div>
                    <div className="text-[9px] text-text-dim uppercase tracking-widest font-mono">
                      ID for one event only
                    </div>
                  </div>
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-text-bright/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[8px] font-mono text-text-bright/20">
                    <span className="bg-bg-deep px-2">OR</span>
                  </div>
                </div>

                <button
                  onClick={handleSoloMode}
                  className="w-full py-4 border border-text-bright/10 rounded-xl flex items-center justify-center gap-4 hover:bg-text-bright/5 transition-all group active:scale-[0.98] text-left"
                >
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500 transition-colors">
                    <UserIcon
                      size={18}
                      className="text-green-400 group-hover:text-black transition-colors"
                    />
                  </div>
                  <div className="grow">
                    <div className="text-sm font-bold uppercase tracking-tight">
                      Solo Mode
                    </div>
                    <div className="text-[9px] text-text-dim uppercase tracking-widest font-mono">
                      Play offline / individually
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <footer className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              icon={<LogOut size={14} />}
            >
              Cancel & Logout
            </Button>
          </footer>
        </div>
      </div>
    );
  }

  // --- CONFIG VIEWS ---
  if (appView === "globalSettings") {
    return (
      <GlobalSettingsView
        globalTheme={globalTheme}
        setGlobalTheme={setGlobalTheme}
        globalMode={globalMode}
        setGlobalMode={setGlobalMode}
        scrollSpeedMultiplier={scrollSpeedMultiplier}
        setScrollSpeedMultiplier={setScrollSpeedMultiplier}
        isLiveSyncEnabled={isLiveSyncEnabled}
        setIsLiveSyncEnabled={setIsLiveSyncEnabled}
        textSizeMultiplier={textSizeMultiplier}
        setTextSizeMultiplier={setTextSizeMultiplier}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        chordBackground={chordBackground}
        setChordBackground={setChordBackground}
        isTransportFloating={isTransportFloating}
        setIsTransportFloating={setIsTransportFloating}
        stageLayout={stageLayout}
        setStageLayout={setStageLayout}
        stageVisibility={stageVisibility}
        setStageVisibility={setStageVisibility}
        onBack={async () => {
          setAppView("main");
          if (user && user.uid !== "local-guest") {
            await bandService.updateProfile(user.uid, {
              stageLayout,
              stageVisibility,
            });
          }
        }}
      />
    );
  }

  if (appView === "userConfig" && user) {
    return (
      <UserConfigView
        user={user}
        profile={userProfile}
        onSave={async (p) => {
          await bandService.updateProfile(user.uid, p);
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: p.displayName,
              photoURL: p.photoURL,
            });
            setUser({ ...auth.currentUser });
          }
          setUserProfile((prev) => (prev ? { ...prev, ...p } : null));
        }}
        onBack={() => setAppView("main")}
        onSignIn={async () => {
          localStorage.removeItem("gigbuddy_guest_mode");
          if (bandId === "local-gig-band") {
            localStorage.removeItem("gigbuddy_current_band_id");
            localStorage.removeItem("gigbuddy_current_gig_id");
            setBandId(null);
            setGigId(null);
          }
          setAppView("main");
          await signIn();
        }}
      />
    );
  }

  if (appView === "bandConfig" && bandData && user) {
    return (
      <BandConfigView
        user={user}
        band={bandData}
        isOnline={isOnline}
        onUpdate={(updates) =>
          setBandData((prev) => (prev ? { ...prev, ...updates } : null))
        }
        onBack={() => setAppView("main")}
        onLeave={logoutSession}
      />
    );
  }

  // --- STAGE VIEW (CLEAN LIVE INTERFACE) ---
  const TransportSourceSelector = () => {
    if (!activeSong?.youtubeId && mediaSource.type !== "youtube") return null;
    return (
      <div className="flex bg-bg-deep p-1 rounded-xl border border-text-bright/10 mx-auto max-w-fit mb-3 pointer-events-auto shadow-xl">
        <button
          onClick={() => setMediaSource({ type: "none", isActive: true })}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
            mediaSource.type !== "youtube"
              ? "bg-brand text-brand-contrast shadow-lg shadow-brand/20"
              : "text-text-dim hover:text-text-bright",
          )}
        >
          AutoScroll
        </button>
        <button
          onClick={() => setMediaSource({ type: "youtube", isActive: true })}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1.5",
            mediaSource.type === "youtube"
              ? "bg-[#FF0000] text-white shadow-lg shadow-[#FF0000]/20"
              : "text-text-dim hover:text-text-bright",
          )}
        >
          <Play size={10} fill="currentColor" /> YouTube
        </button>
      </div>
    );
  };

  if (isLiveViewActive && activeSong) {
    return (
      <div className="h-dvh w-full bg-bg-deep text-text-bright flex flex-col overflow-hidden animate-in fade-in duration-500 relative">
        {/* Persistent Tactical Header - Optimized for Mobile */}
        <header className="h-16 lg:h-24 bg-bg-deep/90 backdrop-blur-xl border-b border-border-main flex items-center justify-between px-4 md:px-8 lg:px-12 z-50 sticky top-0 shrink-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] lg:text-xs font-mono text-brand uppercase tracking-[0.3em] lg:tracking-[0.5em]">
                Live
              </span>
              {!isOnline && (
                <span className="text-[8px] bg-red-600 text-text-bright px-1.5 py-0.5 rounded animate-pulse font-bold">
                  OFFLINE
                </span>
              )}
              <button
                onClick={() => setIsLiveViewActive(false)}
                className="hidden lg:flex items-center gap-1.5 ml-2 lg:ml-4 px-2 py-0.5 rounded bg-text-bright/5 hover:bg-text-bright/10 border border-text-bright/5 text-[10px] uppercase font-bold tracking-widest text-text-dim hover:text-text-bright transition-colors"
                title="Return to Dashboard"
              >
                <ExternalLink size={12} />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setIsLiveViewActive(false);
                  setAppView("globalSettings");
                }}
                className="flex items-center gap-1.5 ml-2 lg:ml-2 px-2 py-0.5 rounded bg-text-bright/5 hover:bg-text-bright/10 border border-text-bright/5 text-[10px] uppercase font-bold tracking-widest text-text-dim hover:text-text-bright transition-colors"
                title="Stage Settings"
              >
                <Settings size={12} />
                <span className="hidden lg:inline">Settings</span>
              </button>
            </div>
            <h2 className="text-lg lg:text-4xl font-bold tracking-tighter text-text-bright truncate max-w-30 sm:max-w-50 lg:max-w-md">
              {activeSong.title}
            </h2>
          </div>

          <div className="flex items-center gap-3 lg:gap-12">
            <div className="flex flex-col items-center">
              <span className="text-[8px] lg:text-[10px] uppercase font-bold text-text-dim tracking-widest">
                Key
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTransposeOffset((prev) => prev - 1)}
                  className="w-5 h-5 lg:w-8 lg:h-8 flex items-center justify-center bg-text-bright/5 border border-border-main rounded text-[10px] lg:text-base hover:bg-text-bright/10"
                >
                  –
                </button>
                <span className="text-lg lg:text-4xl font-mono text-brand leading-none min-w-[1.5ch] text-center">
                  {transposeKey(activeSong.key, transposeOffset)}
                </span>
                <button
                  onClick={() => setTransposeOffset((prev) => prev + 1)}
                  className="w-5 h-5 lg:w-8 lg:h-8 flex items-center justify-center bg-text-bright/5 border border-border-main rounded text-[10px] lg:text-base hover:bg-text-bright/10"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center border-x border-text-bright/5 px-4 sm:px-6 lg:px-8">
              <span className="text-[8px] lg:text-[10px] uppercase font-bold text-text-dim tracking-widest">
                BPM
              </span>
              <span className="text-lg lg:text-4xl font-mono text-text-bright leading-none">
                {activeSong.bpm || "UNSET"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] lg:text-[10px] uppercase font-bold text-text-dim tracking-widest">
                Capo
              </span>
              <span className="text-lg lg:text-4xl font-mono text-text-bright leading-none">
                {activeSong.capo || 0}
              </span>
            </div>
          </div>
        </header>

        {/* Clean Lyrics Scroll Area - Optimized for Mobile */}
        <main
          ref={stageScrollRef}
          onTouchMove={() => {
            if (isAutoScrollEnabled) setIsAutoScrollEnabled(false);
          }}
          onWheel={() => {
            if (isAutoScrollEnabled) setIsAutoScrollEnabled(false);
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const maxScroll = el.scrollHeight - el.clientHeight;
            const progress = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
            const progressEls = document.querySelectorAll(
              ".transport-progress-bar",
            );
            progressEls.forEach((p) => {
              if (p instanceof HTMLElement) {
                p.style.width = `${progress * 100}%`;
              }
            });

            if (!isAutoScrollEnabled) return;
            if (!isPlaying) {
              setIsAutoScrollEnabled(false);
              return;
            }
            const diff = Math.abs(el.scrollTop - lastAutoScrollTop.current);
            if (diff > 5 && lastAutoScrollTop.current !== -1) {
              setIsAutoScrollEnabled(false);
            }
          }}
          className="grow overflow-y-auto custom-scrollbar px-4 sm:px-8 md:px-12 xl:px-24 py-8 lg:py-16 pb-[50vh]"
        >
          <div
            className={cn(
              "max-w-4xl mx-auto space-y-16 lg:space-y-24",
              `font-${fontFamily}`,
            )}
          >
            {(activeSong?.sections || []).map((section, sidx) => (
              <div key={sidx}>
                <div className="flex items-center gap-4 lg:gap-6 mb-8 lg:mb-12">
                  <span className="text-[10px] lg:text-sm font-bold bg-text-bright text-bg-deep px-2 lg:px-4 py-0.5 lg:py-1 uppercase tracking-widest leading-none">
                    {section.title}
                  </span>
                  <div className="h-px grow bg-text-bright/10"></div>
                </div>

                <div className="space-y-10 lg:space-y-20">
                  {(section?.lines || []).map((line, lidx) => {
                    const isChordsOnly =
                      !line.text?.trim() && (line?.chords || []).length > 0;
                    return (
                      <div
                        key={lidx}
                        className={cn(
                          "space-y-2 lg:space-y-4",
                          isChordsOnly ? "mb-16" : "",
                        )}
                      >
                        {/* Live Chord Display (Super Clear) */}
                        <div
                          className="flex font-mono font-bold text-brand tracking-widest items-end"
                          style={{
                            fontSize: isChordsOnly
                              ? `calc(clamp(1.5rem, 3vw, 2.5rem) * ${textSizeMultiplier})`
                              : `calc(clamp(1rem, 2vw, 1.5rem) * ${textSizeMultiplier})`,
                            height: isChordsOnly
                              ? `calc(clamp(2rem, 4vw, 3rem) * ${textSizeMultiplier})`
                              : `calc(clamp(1.5rem, 3vw, 2rem) * ${textSizeMultiplier})`,
                          }}
                        >
                          {(line?.chords || []).length > 0 ? (
                            (line?.chords || [])
                              .sort((a, b) => a.position - b.position)
                              .map((c, i, arr) => {
                                const prevPos =
                                  i === 0 ? 0 : arr[i - 1].position;
                                const offset = c.position - prevPos;
                                // Mobile adjustment for spacing via CSS custom properties and breakpoints
                                return (
                                  <span
                                    key={i}
                                    style={
                                      {
                                        "--offset": i === 0 ? 0 : offset,
                                      } as React.CSSProperties
                                    }
                                    className="inline-block pl-[calc(var(--offset)*1ch)] sm:pl-[calc(var(--offset)*1.5ch)]"
                                  >
                                    <motion.span
                                      key={transposeOffset}
                                      initial={{
                                        backgroundColor:
                                          "rgba(255,255,255,0.4)",
                                        scale: 1.1,
                                      }}
                                      animate={{
                                        backgroundColor: "rgba(255,69,0,0.15)",
                                        scale: 1,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className={cn(
                                        "inline-flex items-center justify-center font-black rounded-md",
                                        isChordsOnly
                                          ? "px-4 py-2"
                                          : "px-1.5 py-0.5",
                                        chordBackground === "none"
                                          ? "text-brand shadow-none border border-transparent"
                                          : chordBackground === "subtle"
                                            ? "bg-text-bright/5 text-brand border border-text-bright/10 shadow-sm"
                                            : "bg-brand text-brand-contrast border border-brand",
                                      )}
                                    >
                                      {transposeChord(c.chord, transposeOffset)}
                                    </motion.span>
                                  </span>
                                );
                              })
                          ) : (
                            <span className="opacity-0">0</span>
                          )}
                        </div>
                        {/* Live Text Display (High Contrast) */}
                        {!isChordsOnly && (
                          <div
                            className="font-semibold text-text-bright tracking-tight"
                            style={{
                              fontSize: `calc(clamp(1.5rem, 5vw, 4.5rem) * ${textSizeMultiplier})`,
                              lineHeight: 1.1,
                            }}
                          >
                            {line.text || "\u00A0"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Quick Media Transport (Stage Mode) */}
        <div
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-50 transition-all",
            isTransportFloating
              ? "bottom-[calc(88px+env(safe-area-inset-bottom)+70px)] lg:bottom-29.5"
              : "bottom-[calc(76px+env(safe-area-inset-bottom)+110px)] lg:bottom-25",
          )}
        >
          <TransportSourceSelector />
        </div>
        {isTransportFloating ? (
          <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-bg-deep/80 backdrop-blur-md border border-border-main p-1 rounded-full z-50 shadow-2xl overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-text-bright/5"></div>
            {/* Progress bar line for visual feedback */}
            <div
              className="absolute bottom-0 left-4 right-4 h-3 cursor-pointer flex items-end pb-px"
              onClick={handleProgressClick}
            >
              <div className="w-full h-0.5 bg-text-bright/10 overflow-hidden rounded-full hover:h-1 transition-all">
                <div
                  className="h-full bg-brand shadow-[0_0_10px_#00FF41] transport-progress-bar"
                  style={{ width: "0%" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 px-8 py-4">
              <button
                onClick={skipBackward}
                className="text-text-dim hover:text-text-bright transition-colors"
              >
                <SkipBack size={24} />
              </button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayback}
                className="w-12 h-12 flex items-center justify-center bg-text-bright text-bg-deep rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </motion.button>
              <button
                onClick={skipForward}
                className="text-text-dim hover:text-text-bright transition-colors"
              >
                <SkipForward size={24} />
              </button>
              <div className="w-px h-6 bg-text-bright/20 mx-2"></div>
              <button
                onClick={() => setIsTransportFloating(!isTransportFloating)}
                className="text-text-dim hover:text-text-bright transition-colors"
                title="Dock Transport"
              >
                <Layers size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="shrink-0 bg-bg-card/95 backdrop-blur-md border-t border-border-main z-50 flex items-center pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 relative">
            <div
              className="absolute top-0 left-0 right-0 h-4 cursor-pointer flex items-center -mt-2 group"
              onClick={handleProgressClick}
            >
              <div className="h-1.5 w-full bg-bg-deep border border-border-main rounded-full overflow-hidden relative group-hover:h-2 transition-all">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-brand shadow-[0_0_15px_#00FF41] transport-progress-bar"
                  style={{ width: "0%" }}
                />
              </div>
            </div>

            <div className="flex w-full items-center justify-center gap-8 pt-4">
              <button
                onClick={skipBackward}
                className="text-text-dim hover:text-brand transition-colors p-2"
              >
                <SkipBack size={24} className="lg:w-7 lg:h-7" />
              </button>
              <button
                onClick={togglePlayback}
                className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-brand text-brand-contrast rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,69,0,0.2)]"
              >
                {isPlaying ? (
                  <Pause
                    size={28}
                    className="lg:w-8 lg:h-8"
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    size={28}
                    className="lg:w-8 lg:h-8 ml-1"
                    fill="currentColor"
                  />
                )}
              </button>
              <button
                onClick={skipForward}
                className="text-text-dim hover:text-brand transition-colors p-2"
              >
                <SkipForward size={24} className="lg:w-7 lg:h-7" />
              </button>
            </div>

            <div className="absolute right-6 top-1/2 -translate-y-1/2 pt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTransportFloating(!isTransportFloating)}
                title="Toggle Floating UI"
                className="h-10 w-10"
              >
                <Layers size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Back Overlay (Floating Mobile) */}
        <button
          onClick={() => setIsLiveViewActive(false)}
          className="lg:hidden absolute bottom-6 right-6 w-12 h-12 bg-text-bright text-bg-deep rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center z-50 active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Global Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-100 flex items-center justify-center animate-in fade-in">
          <div
            className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div className="relative bg-bg-card p-5 sm:p-6 border border-border-main rounded-xl max-w-sm w-full mx-4 shadow-2xl z-10 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-text-bright mb-4 tracking-tight">
              Confirm Action
            </h3>
            <p className="text-sm text-text-dim mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-text-dim hover:text-text-bright hover:bg-text-bright/5 transition-all outline-none focus:ring-2 focus:ring-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-400 border border-red-500/30 transition-all font-bold outline-none focus:ring-2 focus:ring-red-500/50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-dvh w-full bg-bg-deep text-text-bright font-sans flex flex-col overflow-hidden lg:border-[clamp(8px,1vw,16px)] lg:border-bg-card relative print:hidden">
        <header className="h-14 lg:h-20 border-b border-border-main bg-bg-side flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 z-30 relative py-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-1.5 text-brand hover:bg-text-bright/5 rounded transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="hidden lg:block w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0"></div>
            <h1 className="font-mono font-black italic tracking-tighter text-lg sm:text-xl lg:text-3xl text-brand select-none flex items-center shrink-0">
              gig<span className="text-brand">Buddy</span>
              <span className="hidden xl:inline-block ml-4 text-[10px] font-normal not-italic uppercase tracking-widest text-text-dim/40 border border-text-bright/5 bg-text-bright/5 py-0.5 px-2 rounded-full align-middle">
                v1.0.4
              </span>
            </h1>
            {!isOnline && (
              <span className="text-[8px] lg:text-[10px] font-mono bg-red-600 text-text-bright px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-lg shadow-red-900/20 shrink-0">
                <Clock size={10} className="hidden sm:block" /> Offline
              </span>
            )}
            {pendingSyncs > 0 && (
              <span className="text-[8px] lg:text-[10px] font-mono bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1 animate-bounce shadow-lg shadow-amber-900/20 shrink-0">
                <Globe
                  size={10}
                  className="animate-spin text-black/40 hidden sm:block"
                />{" "}
                {pendingSyncs} <span className="hidden sm:inline">Syncing</span>
              </span>
            )}
            <div className="h-6 w-px bg-text-bright/10 mx-1 hidden lg:block shrink-0"></div>
            <span className="text-[9px] lg:text-xs font-mono uppercase tracking-[0.2em] text-text-dim/60 truncate min-w-10">
              {userProfile?.displayName
                ? `${userProfile.displayName.split(" ")[0]}'s Booth`
                : "Station"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 lg:gap-6 shrink-0 justify-end">
            {activeSong && (
              <Button
                variant="brand-ghost"
                size="sm"
                onClick={() => setIsLiveViewActive(true)}
                className="hidden lg:flex border-brand/20 active:scale-95 h-9 sm:h-10 text-[10px] sm:text-xs"
                icon={<ExternalLink size={14} />}
              >
                Stage Mode
              </Button>
            )}

            <div className="hidden lg:block">
              <DecibelMeter />
            </div>

            {bandId && bandId !== "local-solo" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppView("bandConfig")}
                className="hidden lg:flex text-[9px] lg:text-[10px] h-9 sm:h-10"
                icon={<Shield size={14} />}
              >
                Squad
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAppView("globalSettings")}
              className="hidden lg:flex text-[9px] lg:text-[10px] h-9 sm:h-10"
              icon={<Settings size={14} />}
            >
              Settings
            </Button>

            <button
              onClick={() => setAppView("userConfig")}
              className="hidden lg:flex items-center gap-2 bg-bg-card px-2 lg:px-3 py-1 lg:py-2 rounded border border-border-main hover:border-brand/40 transition-all cursor-pointer group shadow-sm mr-1 sm:mr-0"
            >
              {userProfile?.photoURL || user.photoURL ? (
                <img
                  src={userProfile?.photoURL || user.photoURL || ""}
                  className="w-5 h-5 lg:w-8 lg:h-8 rounded-full border border-border-main object-cover"
                />
              ) : (
                <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-brand/20 text-brand border border-brand/30 flex items-center justify-center text-[10px] lg:text-xs font-bold uppercase">
                  {user.email?.charAt(0) || "U"}
                </div>
              )}
              <span className="hidden sm:inline-block text-[8px] lg:text-[10px] font-mono uppercase text-brand group-hover:glow-green transition-all">
                Profile
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-60 flex">
            <div
              className="absolute inset-0 bg-bg-deep/90 md:bg-bg-deep/50 md:backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="relative w-full md:w-[320px] h-full bg-bg-deep/95 md:bg-bg-deep/80 md:backdrop-blur-xl border-r border-border-main shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col pt-[env(safe-area-inset-top)]">
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <div className="flex justify-between items-center">
                  <h2 className="text-brand font-mono font-bold tracking-widest uppercase">
                    Navigation
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-text-bright"
                  >
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex flex-col gap-6">
                  <button
                    onClick={() => {
                      setMobileView("stage");
                      setIsLiveViewActive(true);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 transition-colors",
                      mobileView === "stage" && isLiveViewActive
                        ? "text-brand"
                        : "text-text-bright hover:text-brand",
                    )}
                  >
                    <ExternalLink size={24} /> Stage Mode
                  </button>
                  <button
                    onClick={() => {
                      setMobileView("setlist");
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 transition-colors",
                      mobileView === "setlist"
                        ? "text-brand"
                        : "text-text-bright hover:text-brand",
                    )}
                  >
                    <Music size={24} /> Setlist
                  </button>
                  <button
                    onClick={() => {
                      setMobileView("notes");
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 transition-colors",
                      mobileView === "notes"
                        ? "text-brand"
                        : "text-text-bright hover:text-brand",
                    )}
                  >
                    <Layers size={24} /> Session Tools
                  </button>
                  <div className="h-px bg-text-bright/5 my-2" />
                  {bandId && bandId !== "local-solo" && (
                    <button
                      onClick={() => {
                        setAppView("bandConfig");
                        setIsMenuOpen(false);
                      }}
                      className="text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 text-text-bright hover:text-brand transition-colors"
                    >
                      <Shield size={24} /> Squad Sync
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAppView("globalSettings");
                      setIsMenuOpen(false);
                    }}
                    className="text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 text-text-bright hover:text-brand transition-colors"
                  >
                    <Settings size={24} /> Global Settings
                  </button>
                  <button
                    onClick={() => {
                      setAppView("userConfig");
                      setIsMenuOpen(false);
                    }}
                    className="text-2xl font-bold uppercase tracking-tighter text-left flex items-center gap-4 text-text-bright hover:text-brand transition-colors"
                  >
                    <UserCircle size={24} /> User Profile
                  </button>
                </nav>
                <div className="pt-8 border-t border-text-bright/5">
                  <MetronomePlugin />
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 flex overflow-hidden relative">
          {/* Setlist Sidebar - Hidden on mobile/tablet unless active */}
          <aside
            className={cn(
              "dock-panel w-full lg:w-75 xl:w-[320px] 2xl:w-95 shrink-0 absolute lg:relative top-0 right-0 left-0 bottom-[env(safe-area-inset-bottom)] lg:bottom-0 z-20",
              mobileView === "setlist" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="dock-panel-header flex-col items-stretch gap-3">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <h2 className="dock-panel-title">Setlist</h2>
                  {setlistView === "current" && (
                    <div className="tag primary">
                      {Math.floor(
                        songs.reduce((acc, s) => acc + (s.duration || 0), 0) /
                          60,
                      )}
                      m{" "}
                      {songs.reduce((acc, s) => acc + (s.duration || 0), 0) %
                        60}
                      s
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {setlistView === "current" && appMode === "live" && (
                    <button
                      onClick={() => {
                        setMobileView("notes");
                        setSessionToolsTab("sync");
                      }}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border transition-all flex items-center gap-1",
                        isLiveSyncEnabled
                          ? "bg-brand/20 border-brand text-brand"
                          : "bg-text-bright/5 border-border-main text-text-bright/40",
                      )}
                    >
                      <Globe
                        size={10}
                        className={isLiveSyncEnabled ? "animate-spin-slow" : ""}
                      />
                      Sync {isLiveSyncEnabled ? "On" : "Off"}
                    </button>
                  )}
                  {setlistView === "current" && appMode === "edit" && (
                    <>
                      <button
                        onClick={() => handleExportPDF("setlist")}
                        className="text-text-dim hover:text-text-bright p-1"
                        title="Export PDF"
                      >
                        <Printer size={12} />
                      </button>
                      <button
                        onClick={handleClearSetlist}
                        className="text-red-500/70 hover:text-red-400 p-1"
                        title="Clear Setlist"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setMobileView("stage")}
                    className="lg:hidden p-1 text-text-bright"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex gap-2 p-0.5 rounded-lg flex-1">
                  <button
                    onClick={() => {
                      setAppMode("live");
                      setIsEditing(false);
                    }}
                    className={cn(
                      "ui-tab-btn flex-1 justify-center",
                      appMode === "live" && "active",
                    )}
                  >
                    Live
                  </button>
                  <button
                    onClick={() => {
                      const canEdit =
                        !activeSong || bandData?.ownerId === user?.uid;
                      if (!canEdit) {
                        alert(
                          "Only the author or band admin can edit this song.",
                        );
                        return;
                      }
                      setAppMode("edit");
                      if (activeSong) {
                        setEditedLyrics(
                          JSON.stringify(activeSong.sections, null, 2),
                        );
                        setVisualSections(
                          JSON.parse(JSON.stringify(activeSong.sections)),
                        );
                        setVisualMetadata({
                          title: activeSong.title,
                          artist: activeSong.artist,
                          key: activeSong.key,
                          bpm: activeSong.bpm,
                          capo: activeSong.capo || 0,
                          duration: activeSong.duration || 0,
                          notes: activeSong.notes,
                          youtubeId: activeSong.youtubeId || "",
                          attachments: activeSong.attachments || [],
                        });
                        setIsEditing(true);
                      }
                    }}
                    className={cn(
                      "ui-tab-btn flex-1 justify-center",
                      appMode === "edit" && "active",
                    )}
                  >
                    Edit
                  </button>
                </div>

                {appMode === "edit" && (
                  <div className="flex gap-2 p-0.5 rounded-lg">
                    <button
                      onClick={() => setSetlistView("current")}
                      className={cn(
                        "ui-tab-btn justify-center",
                        setlistView === "current" && "active",
                      )}
                    >
                      Setlist
                    </button>
                    <button
                      onClick={() => setSetlistView("library")}
                      className={cn(
                        "ui-tab-btn justify-center",
                        setlistView === "library" && "active",
                      )}
                    >
                      Lib
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <input
                  type="text"
                  placeholder="Search by title or artist..."
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  className="w-full bg-bg-deep/40 border border-border-main rounded-md pl-8 pr-3 py-1.5 text-[10px] text-text-bright placeholder:text-text-bright/30 focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>
            </div>

            {setlistView === "current" ? (
              <>
                <div className="dock-panel-content flex flex-col flex-1 min-h-0 relative">
                  {songSearchQuery.trim() === "" ? (
                    appMode === "edit" ? (
                      <Reorder.Group
                        axis="y"
                        values={songs}
                        onReorder={handleReorderSongs}
                        className="grow overflow-y-auto custom-scrollbar flex flex-col bg-bg-deep/20"
                      >
                        {songs.map((song, i) => (
                          <SetlistReorderItem
                            key={song.id}
                            song={song}
                            index={i}
                            totalSongs={songs.length}
                            activeSongId={activeSongId}
                            onSelect={handleSongSelect}
                            onDelete={handleDeleteSong}
                            onMove={handleMoveSong}
                          />
                        ))}

                        {songs.length === 0 && (
                          <div className="p-8 text-center text-text-dim text-xs uppercase font-mono tracking-widest opacity-40">
                            No songs in library
                          </div>
                        )}
                      </Reorder.Group>
                    ) : (
                      <div className="grow overflow-y-auto custom-scrollbar flex flex-col bg-bg-deep/20 pb-20">
                        {songs.map((song, i) => (
                          <div
                            key={song.id}
                            className={cn(
                              "px-4 lg:px-6 py-5 flex flex-col gap-2 border-b border-bg-card/30 transition-all cursor-pointer group relative ",
                              activeSongId === song.id
                                ? "bg-bg-card/80 backdrop-blur-xl border-l-[3px] border-brand"
                                : "hover:bg-text-bright/3",
                            )}
                            onClick={() => handleSongSelect(song)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                                    activeSongId === song.id
                                      ? "bg-brand text-brand-contrast"
                                      : "bg-text-bright/5 text-text-dim/60",
                                  )}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <h3
                                  className={cn(
                                    "text-[14px] font-bold transition-colors tracking-tight leading-tight",
                                    activeSongId === song.id
                                      ? "text-text-bright italic"
                                      : "text-text-dim group-hover:text-text-bright",
                                  )}
                                >
                                  {song.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                {song.status === SongStatus.PENDING && (
                                  <span title="Offline - Pending Sync">
                                    <Globe
                                      size={10}
                                      className="text-amber-500 animate-spin"
                                    />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <div className="flex gap-2">
                                <Badge
                                  variant={
                                    activeSongId === song.id ? "blue" : "ghost"
                                  }
                                >
                                  {song.key}
                                </Badge>
                                {song.bpm && (
                                  <Badge
                                    variant={
                                      activeSongId === song.id
                                        ? "brand"
                                        : "ghost"
                                    }
                                  >
                                    {song.bpm} BPM
                                  </Badge>
                                )}
                                {song.duration > 0 && (
                                  <Badge variant="ghost" className="font-mono">
                                    {Math.floor(song.duration / 60)}:
                                    {(song.duration % 60)
                                      .toString()
                                      .padStart(2, "0")}
                                  </Badge>
                                )}
                              </div>

                              {activeSongId !== song.id && (
                                <span className="text-[8px] uppercase tracking-widest text-text-dim/0 group-hover:text-brand/60 transition-all font-bold">
                                  Launch Stage
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                        {songs.length === 0 && (
                          <div className="p-8 text-center text-text-dim text-xs uppercase font-mono tracking-widest opacity-40">
                            No songs in library
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="grow overflow-y-auto custom-scrollbar flex flex-col bg-bg-deep/20">
                      {filteredSongs.length === 0 ? (
                        <div className="p-8 text-center text-text-dim">
                          <p className="text-sm">No songs match your search.</p>
                        </div>
                      ) : (
                        filteredSongs.map((song) => {
                          const originalIndex = songs.findIndex(
                            (s) => s.id === song.id,
                          );
                          return (
                            <div
                              key={song.id}
                              className={cn(
                                "px-4 lg:px-6 py-4 flex flex-col gap-1.5 border-b border-bg-card/50 transition-all cursor-pointer group relative ",
                                activeSongId === song.id
                                  ? "bg-bg-card matrix-border border-l-brand"
                                  : "hover:bg-text-bright/5",
                              )}
                              onClick={() => handleSongSelect(song)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "text-[10px] font-mono",
                                      activeSongId === song.id
                                        ? "text-brand"
                                        : "text-text-dim",
                                    )}
                                  >
                                    {String(originalIndex + 1).padStart(2, "0")}
                                    .{" "}
                                    {activeSongId === song.id
                                      ? "PLAYING"
                                      : "IDLE"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {song.status === SongStatus.PENDING && (
                                    <span title="Offline - Pending Sync">
                                      <Globe
                                        size={10}
                                        className="text-amber-500 animate-spin"
                                      />
                                    </span>
                                  )}
                                  {appMode === "edit" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSong(song.id, e);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-all mx-2"
                                      title="Delete Song"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                  <span className="text-[10px] text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                                    Push to Stage
                                  </span>
                                </div>
                              </div>
                              <h3
                                className={cn(
                                  "text-[15px] font-semibold transition-colors tracking-tight",
                                  activeSongId === song.id
                                    ? "text-text-bright"
                                    : "text-text-dim group-hover:text-text-bright",
                                )}
                              >
                                {song.title}
                              </h3>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[9px] bg-blue-900/30 text-blue-300 px-1.5 rounded">
                                  {song.key}
                                </span>
                                {song.bpm && (
                                  <span className="text-[9px] bg-text-bright/10 text-text-bright px-1.5 rounded">
                                    {song.bpm} BPM
                                  </span>
                                )}
                                {song.duration > 0 && (
                                  <span className="text-[9px] bg-text-bright/10 text-text-bright px-1.5 rounded font-mono">
                                    {Math.floor(song.duration / 60)}:
                                    {(song.duration % 60)
                                      .toString()
                                      .padStart(2, "0")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 lg:p-6 border-t border-border-main bg-bg-deep flex flex-col gap-3">
                  {appMode === "edit" && (
                    <div className="mb-2">
                      {isSavingSetlist ? (
                        <form
                          onSubmit={handleSaveSetlist}
                          className="flex gap-2"
                        >
                          <input
                            autoFocus
                            value={newSetlistTitle}
                            onChange={(e) => setNewSetlistTitle(e.target.value)}
                            placeholder="Setlist Name..."
                            className="grow bg-bg-side border border-brand/40 px-2 text-[10px] text-text-bright rounded outline-none h-8"
                          />
                          <button
                            type="submit"
                            className="px-3 h-8 bg-brand text-brand-contrast text-[10px] font-bold uppercase rounded"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsSavingSetlist(false)}
                            className="px-2 h-8 bg-text-bright/5 text-[10px] uppercase rounded"
                          >
                            X
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsSavingSetlist(true)}
                          className="w-full py-2 border border-border-main text-text-dim hover:text-text-bright hover:border-text-bright/30 text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center transition-all bg-text-bright/5"
                        >
                          Save as Library Setlist
                        </button>
                      )}
                    </div>
                  )}

                  {appMode === "edit" &&
                    (isAddingSong ? (
                      <form
                        onSubmit={handleAddNewSong}
                        className="flex flex-col gap-2"
                      >
                        <input
                          autoFocus
                          value={newSongTitle}
                          onChange={(e) => setNewSongTitle(e.target.value)}
                          placeholder="Song Title..."
                          className="w-full bg-bg-side border border-brand/40 p-2 text-xs text-text-bright rounded outline-none focus:border-brand"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="grow py-1 bg-brand text-brand-contrast text-[10px] font-bold uppercase rounded"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSong(false)}
                            className="px-2 py-1 bg-text-bright/5 text-[10px] uppercase rounded"
                          >
                            X
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsAddingSong(true)}
                          className="grow py-2 bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 hover:bg-brand/20 transition-all active:scale-[0.98]"
                        >
                          <Plus size={12} /> ADD SONG
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-text-bright/5 border border-border-main text-text-bright/70 hover:text-text-bright text-[10px] font-bold uppercase tracking-widest rounded flex items-center justify-center transition-all"
                          title="Import JSON Library"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          onClick={() => handleExportPDF("library")}
                          className="px-3 py-2 bg-text-bright/5 border border-border-main text-text-bright/70 hover:text-text-bright text-[10px] font-bold uppercase tracking-widest rounded flex items-center justify-center transition-all"
                          title="Export Library PDF"
                        >
                          <Printer size={14} />
                        </button>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                        />
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="grow flex flex-col pt-4">
                <div className="px-4 lg:px-6 pb-4 border-b border-text-bright/5 flex items-center gap-3">
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                    Saved Setlist Library
                  </h2>
                </div>
                <div className="grow overflow-auto custom-scrollbar p-4 lg:p-6 space-y-4">
                  {savedSetlists.length === 0 ? (
                    <div className="text-center opacity-50 py-10">
                      <Layers size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs">No saved setlists.</p>
                    </div>
                  ) : (
                    savedSetlists.map((saved) => (
                      <div
                        key={saved.id}
                        className="bg-bg-card border border-text-bright/5 p-4 rounded-xl shadow-lg group hover:border-brand/40 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-sm tracking-tight text-text-bright">
                            {saved.title}
                          </h3>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setConfirmDialog({
                                message: "Delete this saved setlist directly?",
                                onConfirm: async () => {
                                  await bandService.deleteSavedSetlist(
                                    bandId!,
                                    saved.id,
                                  );
                                },
                              });
                            }}
                            className="text-text-dim hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="flex gap-2 mb-4 text-[10px] font-mono text-text-dim">
                          <span>{saved.songs?.length || 0} tracks</span>
                          <span>•</span>
                          <span>
                            {new Date(
                              saved.createdAt?.seconds * 1000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLoadSavedSetlist(saved)}
                          className="w-full py-1.5 bg-brand/10 text-brand text-[10px] uppercase font-bold tracking-widest rounded hover:bg-brand/20 transition-all flex items-center justify-center gap-2"
                        >
                          Load Setlist <ChevronRight size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Main Stage Section - Responsive behavior */}
          <section
            ref={stageScrollRef}
            onTouchMove={() => {
              if (isAutoScrollEnabled) setIsAutoScrollEnabled(false);
            }}
            onWheel={() => {
              if (isAutoScrollEnabled) setIsAutoScrollEnabled(false);
            }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const maxScroll = el.scrollHeight - el.clientHeight;
              const progress = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
              const progressEls = document.querySelectorAll(
                ".transport-progress-bar",
              );
              progressEls.forEach((p) => {
                if (p instanceof HTMLElement) {
                  p.style.width = `${progress * 100}%`;
                }
              });

              if (!isAutoScrollEnabled) return;
              if (!isPlaying) {
                setIsAutoScrollEnabled(false);
                return;
              }
              const diff = Math.abs(el.scrollTop - lastAutoScrollTop.current);
              if (diff > 5 && lastAutoScrollTop.current !== -1) {
                setIsAutoScrollEnabled(false);
              }
            }}
            className={cn(
              "flex-1 min-w-0 flex flex-col bg-bg-deep p-fluid-md pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-fluid-lg lg:pb-fluid-lg overflow-y-auto custom-scrollbar relative z-10",
              mobileView === "stage" ? "flex" : "hidden lg:flex",
            )}
          >
            {/* Stage Background Ambient Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div
                className="absolute top-0 left-1/4 w-[50%] h-75 bg-brand/5 blur-[120px] -rotate-12 transition-all duration-1000"
                style={{ opacity: isPlaying ? 0.15 : 0.05 }}
              ></div>
              <div
                className="absolute bottom-0 right-1/4 w-[40%] h-100 bg-blue-500/5 blur-[150px] rotate-12 transition-all duration-1000"
                style={{ opacity: isPlaying ? 0.1 : 0.03 }}
              ></div>
            </div>

            {activeSong ? (
              <div className="flex flex-col min-h-full max-w-5xl mx-auto w-full">
                <div
                  className={cn(
                    "flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0 mb-10 pb-6 border-b border-text-bright/5",
                    !isEditing && stageVisibility["header"] === false
                      ? "hidden"
                      : "",
                  )}
                  style={{
                    order: isEditing ? -1 : stageLayout.indexOf("header"),
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-brand-contrast text-[10px] font-bold uppercase",
                          bandId || gigId ? "bg-brand" : "bg-text-bright/40",
                        )}
                      >
                        {bandId || gigId ? "SESSION" : "LOCAL"}
                      </span>
                      <button
                        onClick={() => {
                          setMobileView("notes");
                          setSessionToolsTab("sync");
                        }}
                        className={cn(
                          "font-mono text-[9px] lg:text-xs italic tracking-widest hover:opacity-80 transition-opacity",
                          !bandId && !gigId
                            ? "text-text-dim"
                            : isLiveSyncEnabled
                              ? "text-brand"
                              : "text-amber-500",
                        )}
                        title="Configure Live Sync"
                      >
                        REAL-TIME SYNC:{" "}
                        {!(bandId || gigId)
                          ? "OFFLINE"
                          : isEditing
                            ? "PAUSED"
                            : isLiveSyncEnabled
                              ? "ACTIVE"
                              : "MUTED"}
                      </button>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-7xl font-bold tracking-tight text-text-bright glow-green leading-none drop-shadow-md">
                      {activeSong.title}
                    </h2>
                    {activeSong.youtubeId && !isEditing && (
                      <button
                        onClick={() => {
                          setMediaSource({ type: "youtube", isActive: true });
                          setIsPlaying(true);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-[10px] lg:text-xs font-bold uppercase tracking-widest text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors bg-[#FF0000]/10 px-3 py-1.5 border border-[#FF0000]/30 rounded-full w-max"
                      >
                        <Play size={12} fill="currentColor" /> Play Reference
                      </button>
                    )}
                  </div>
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <div className="flex flex-col items-end gap-2 bg-text-bright/5 p-1 px-3 rounded-lg border border-border-main">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setIsAutoScrollEnabled(!isAutoScrollEnabled)
                              }
                              className={cn(
                                "px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all flex items-center gap-1",
                                isAutoScrollEnabled
                                  ? "bg-brand text-brand-contrast"
                                  : "text-text-dim hover:text-text-bright",
                              )}
                              title={
                                isAutoScrollEnabled
                                  ? "Teleprompter Ready (Plays when audio plays)"
                                  : "Enable Teleprompter"
                              }
                            >
                              <ArrowDown size={14} /> Teleprompter{" "}
                              {isAutoScrollEnabled ? "Ready" : "Off"}
                            </button>
                          </div>
                          {isAutoScrollEnabled && (
                            <div className="flex items-center gap-2 pb-1">
                              <span className="text-[9px] text-text-dim font-mono uppercase">
                                Speed
                              </span>
                              <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={scrollSpeedMultiplier}
                                onChange={(e) =>
                                  setScrollSpeedMultiplier(
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-16 h-1 bg-text-bright/20 rounded-lg appearance-none cursor-pointer accent-brand"
                              />
                              <span className="text-[9px] text-brand font-mono">
                                {scrollSpeedMultiplier.toFixed(1)}x
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {(!isEditing || appMode === "edit") && (
                        <button
                          onClick={toggleEdit}
                          className="p-2 bg-text-bright/5 hover:bg-text-bright/10 rounded-lg text-text-dim hover:text-brand transition-all flex items-center gap-2 text-xs h-full"
                        >
                          {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                          <span className="hidden sm:inline">
                            {isEditing ? "Cancel / Live Mode" : "Edit"}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => setAppView("globalSettings")}
                        className="p-2 bg-text-bright/5 hover:bg-text-bright/10 rounded-lg text-text-dim hover:text-brand transition-all flex items-center gap-2 text-xs h-full"
                        title="Display & Stage Settings"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                    <div className="text-right flex flex-col lg:items-end mt-2">
                      <div className="text-[10px] lg:text-xs uppercase text-text-dim font-bold mb-1 tracking-[0.2em]">
                        Capo: {activeSong.capo || 0}th Fret
                      </div>
                      <div className="text-xl lg:text-4xl font-mono text-text-bright tracking-widest font-bold">
                        [{activeSong.key.split(" ")[0]}]
                      </div>
                    </div>
                  </div>
                </div>

                {mediaSource.type === "youtube" &&
                  isYouTubeDocked &&
                  !isEditing && (
                    <div
                      className="mb-10 w-full bg-bg-deep border border-[#FF0000]/20 rounded-xl overflow-hidden shadow-2xl relative z-20 group animate-in slide-in-from-top-4 fade-in duration-300"
                      style={{ order: stageLayout.indexOf("header") }}
                    >
                      <div className="bg-[#111]/80 backdrop-blur-sm px-4 py-2 border-b border-[#FF0000]/20 flex justify-between items-center z-10 relative group-hover:opacity-100 lg:opacity-0 transition-opacity">
                        <span className="text-[10px] text-[white] font-mono uppercase tracking-widest flex items-center gap-2">
                          <Play
                            size={12}
                            className="text-[#FF0000] fill-[#FF0000]"
                          />{" "}
                          Reference Sync
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsYouTubeDocked(false)}
                            className="text-text-dim hover:text-text-bright text-[10px] flex items-center gap-1 uppercase tracking-widest font-mono"
                            title="Pop out"
                          >
                            <LayoutTemplate size={12} /> Float
                          </button>
                          <button
                            onClick={() =>
                              setMediaSource({ type: "none", isActive: false })
                            }
                            className="text-text-dim hover:text-text-bright"
                            title="Close"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="w-full max-w-4xl mx-auto p-2 lg:p-4 bg-bg-deep">
                        <YouTubePlayer
                          ref={youtubePlayerRef}
                          videoId={activeSong?.youtubeId || null}
                          isPlaying={isPlaying}
                          onPlayChange={setIsPlaying}
                          visible={true}
                        />
                      </div>
                    </div>
                  )}

                {!isEditing &&
                  activeSong.notes &&
                  activeSong.notes.length > 0 &&
                  stageVisibility["performance_notes"] !== false && (
                    <div
                      className="mb-10 bg-[#262600]/10 border border-[#4D4D00]/50 rounded-xl p-6 relative z-20"
                      style={{
                        order: stageLayout.indexOf("performance_notes"),
                      }}
                    >
                      <h3 className="text-[11px] uppercase font-bold text-yellow-500/70 tracking-[0.2em] mb-4 flex items-center gap-2">
                        <AlignLeft size={14} /> Performance Notes
                      </h3>
                      <div className="space-y-3">
                        {activeSong.notes.map((note, nIdx) => (
                          <div
                            key={nIdx}
                            className="text-sm font-medium italic text-[#FFFF66] opacity-90 pl-3 border-l-2 border-[#FFFF66]/30"
                          >
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {!isEditing &&
                  activeSong.attachments &&
                  activeSong.attachments.length > 0 &&
                  stageVisibility["attachments"] !== false && (
                    <div
                      className="mb-10 border border-border-main bg-bg-card/40 rounded-xl p-6 shadow-lg relative z-20"
                      style={{ order: stageLayout.indexOf("attachments") }}
                    >
                      <h3 className="text-[11px] uppercase font-bold text-text-dim tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Layers size={14} /> Linked Resources
                      </h3>
                      <AttachmentsManager
                        attachments={activeSong.attachments}
                        onChange={() => {}}
                        readOnly={true}
                      />
                    </div>
                  )}

                {isEditing ? (
                  <div
                    className="grow flex flex-col gap-6"
                    style={{ order: 0 }}
                  >
                    {/* Mode Switcher */}
                    <div className="flex bg-text-bright/5 p-1 rounded-lg self-start">
                      <button
                        onClick={() => setEditMode("visual")}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                          editMode === "visual"
                            ? "bg-brand text-brand-contrast"
                            : "text-text-dim hover:text-text-bright",
                        )}
                      >
                        Visual Editor
                      </button>
                      <button
                        onClick={() => setEditMode("raw")}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                          editMode === "raw"
                            ? "bg-brand text-brand-contrast"
                            : "text-text-dim hover:text-text-bright",
                        )}
                      >
                        Raw JSON
                      </button>
                    </div>

                    {editMode === "visual" ? (
                      <div className="grow space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Song Metadata Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-card p-4 sm:p-6 rounded-xl border border-border-main">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              Title
                            </label>
                            <input
                              value={visualMetadata.title || ""}
                              onChange={(e) =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  title: e.target.value,
                                })
                              }
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-text-bright font-medium rounded outline-none focus:border-brand"
                              placeholder="Song Title"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              Artist
                            </label>
                            <input
                              value={visualMetadata.artist || ""}
                              onChange={(e) =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  artist: e.target.value,
                                })
                              }
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-text-bright rounded outline-none focus:border-brand"
                              placeholder="Artist Name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-bg-card p-4 sm:p-6 rounded-xl border border-border-main">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              Key
                            </label>
                            <input
                              value={visualMetadata.key || ""}
                              onChange={(e) =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  key: e.target.value,
                                })
                              }
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-brand font-mono rounded outline-none focus:border-brand"
                              placeholder="e.g. G Major"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              BPM
                            </label>
                            <input
                              type="number"
                              value={visualMetadata.bpm || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVisualMetadata({
                                  ...visualMetadata,
                                  bpm: val ? parseInt(val) : undefined,
                                });
                              }}
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-text-bright font-mono rounded outline-none focus:border-brand"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              Time (s)
                            </label>
                            <input
                              type="number"
                              value={visualMetadata.duration || ""}
                              onChange={(e) =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  duration: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="Seconds"
                              title="Duration in seconds"
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-brand font-mono rounded outline-none focus:border-brand"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">
                              Capo
                            </label>
                            <input
                              type="number"
                              value={visualMetadata.capo || ""}
                              onChange={(e) =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  capo: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-text-bright/5 border border-border-main p-2 text-sm text-text-bright font-mono rounded outline-none focus:border-brand"
                            />
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-bg-card p-6 rounded-xl border border-border-main space-y-4">
                          <h3 className="text-[10px] uppercase font-bold text-text-dim tracking-[0.2em] mb-4">
                            Performance Notes
                          </h3>
                          <div className="space-y-3">
                            {(visualMetadata?.notes || []).map((note, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  value={note || ""}
                                  onChange={(e) => {
                                    const newNotes = [...visualMetadata.notes];
                                    newNotes[idx] = e.target.value;
                                    setVisualMetadata({
                                      ...visualMetadata,
                                      notes: newNotes,
                                    });
                                  }}
                                  className="grow bg-text-bright/5 border border-border-main p-2 text-xs text-text-bright rounded outline-none focus:border-brand"
                                />
                                <button
                                  onClick={() => {
                                    const newNotes =
                                      visualMetadata.notes.filter(
                                        (_, i) => i !== idx,
                                      );
                                    setVisualMetadata({
                                      ...visualMetadata,
                                      notes: newNotes,
                                    });
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                setVisualMetadata({
                                  ...visualMetadata,
                                  notes: [...visualMetadata.notes, ""],
                                })
                              }
                              className="text-[10px] text-brand/60 hover:text-brand flex items-center gap-1"
                            >
                              <Plus size={10} /> Add Note
                            </button>
                          </div>
                        </div>

                        {/* YouTube Integration */}
                        <div className="bg-bg-card p-6 rounded-xl border border-border-main space-y-4">
                          <h3 className="text-[10px] uppercase font-bold text-text-dim tracking-[0.2em] mb-4">
                            YouTube Reference
                          </h3>
                          <YoutubeSearch
                            currentVideoId={visualMetadata.youtubeId}
                            onPlay={() => {
                              setMediaSource({
                                type: "youtube",
                                isActive: true,
                              });
                              setIsPlaying(true);
                            }}
                            onClear={() =>
                              setVisualMetadata({
                                ...visualMetadata,
                                youtubeId: "",
                              })
                            }
                            onSelect={(video) =>
                              setVisualMetadata({
                                ...visualMetadata,
                                youtubeId: video.id,
                              })
                            }
                          />
                        </div>

                        {/* Attachments / Files */}
                        <div className="bg-bg-card p-6 rounded-xl border border-border-main space-y-4">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-[10px] uppercase font-bold text-text-dim tracking-[0.2em]">
                              Files & Stage Plots
                            </h3>
                            <p className="text-[10px] text-text-dim opacity-70">
                              Link PDF Tabs, Stage Plots, or Google Drive
                              folders.
                            </p>
                          </div>
                          <AttachmentsManager
                            attachments={visualMetadata.attachments}
                            onChange={(newAttachments) =>
                              setVisualMetadata({
                                ...visualMetadata,
                                attachments: newAttachments,
                              })
                            }
                          />
                        </div>

                        {(visualSections || []).map((section, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-bg-card border border-text-bright/5 rounded-xl p-6 space-y-4"
                          >
                            <div className="flex items-center gap-4">
                              <input
                                value={section.title || ""}
                                onChange={(e) =>
                                  updateSectionTitle(sIdx, e.target.value)
                                }
                                className="bg-transparent text-xs font-bold uppercase tracking-widest text-brand border-b border-brand/20 focus:border-brand outline-none pb-1"
                                placeholder="Section Title (e.g. CHORUS)"
                              />
                              <div className="h-px grow bg-text-bright/5"></div>
                            </div>

                            <div className="space-y-3">
                              {(section?.lines || []).map(
                                (line: any, lIdx: number) => (
                                  <div
                                    key={lIdx}
                                    className="flex gap-3 items-center group"
                                  >
                                    <span className="text-[10px] text-text-bright/20 font-mono w-4">
                                      {lIdx + 1}
                                    </span>
                                    <input
                                      value={line.text || ""}
                                      onChange={(e) =>
                                        updateVisualLine(
                                          sIdx,
                                          lIdx,
                                          e.target.value,
                                        )
                                      }
                                      className="grow bg-text-bright/5 border border-transparent focus:border-text-bright/20 p-2 text-sm text-text-bright rounded outline-none"
                                      placeholder="Type lyric line..."
                                    />
                                  </div>
                                ),
                              )}
                              <button
                                onClick={() => addVisualLine(sIdx)}
                                className="text-[10px] text-brand/60 hover:text-brand flex items-center gap-1 mt-2"
                              >
                                <Plus size={10} /> Add Line
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setVisualSections([
                              ...visualSections,
                              {
                                title: "NEW SECTION",
                                lines: [{ text: "", chords: [] }],
                              },
                            ]);
                          }}
                          className="w-full py-4 border-2 border-dashed border-text-bright/5 text-text-dim hover:text-brand hover:border-brand/40 transition-all rounded-xl uppercase font-bold tracking-widest text-xs"
                        >
                          + Add Section
                        </button>
                      </div>
                    ) : (
                      <div className="grow flex flex-col gap-4">
                        <span className="text-[10px] text-text-dim uppercase font-bold text-brand">
                          Advanced Mode: JSON Live Buffer
                        </span>
                        <textarea
                          value={editedLyrics}
                          onChange={(e) => {
                            setEditedLyrics(e.target.value);
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setVisualSections(parsed);
                            } catch {
                              // intentional ignore
                            }
                          }}
                          className="grow min-h-75 bg-bg-card border border-brand/20 p-4 font-mono text-xs text-brand focus:border-brand transition-all rounded-lg outline-none"
                          spellCheck={false}
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={toggleEdit}
                        className="w-full sm:w-1/3 py-4 text-text-dim hover:text-text-bright bg-text-bright/5 hover:bg-text-bright/10 font-bold uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2"
                      >
                        <X size={18} /> Cancel
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={saveState !== "idle"}
                        className={cn(
                          "w-full sm:w-2/3 py-4 text-black font-bold uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2",
                          saveState === "idle"
                            ? "bg-brand hover:bg-brand/90"
                            : saveState === "saving"
                              ? "bg-brand/50 cursor-not-allowed"
                              : "bg-emerald-400",
                        )}
                      >
                        {saveState === "idle" && (
                          <>
                            <Save size={18} /> Update Dashboard
                          </>
                        )}
                        {saveState === "saving" && (
                          <>
                            <Settings size={18} className="animate-spin" />{" "}
                            Saving...
                          </>
                        )}
                        {saveState === "success" && (
                          <>
                            <Check size={18} /> Saved successfully!
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  stageVisibility["lyrics"] !== false && (
                    <motion.div
                      key={activeSong.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="grow font-mono text-text-dim pb-32"
                      style={{ order: stageLayout.indexOf("lyrics") }}
                    >
                      {(activeSong?.sections || []).map((section, sidx) => (
                        <div
                          key={sidx}
                          className="mb-14 group/section relative"
                        >
                          {/* Section marker */}
                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-text-bright/5 group-hover/section:bg-brand/20 transition-colors rounded-full" />

                          <div className="flex items-center gap-4 mb-8 sticky top-0 bg-bg-deep/80 backdrop-blur-md z-20 py-3 -mx-2 px-2 border-b border-text-bright/5">
                            <Badge
                              variant="brand"
                              size="sm"
                              className="bg-brand text-brand-contrast font-black italic"
                            >
                              {section.title}
                            </Badge>
                            <div className="h-px grow bg-text-bright/10"></div>
                          </div>
                          <div className="space-y-6">
                            {(section?.lines || []).map((line, lidx) => (
                              <LyricLine
                                key={lidx}
                                line={line}
                                transposeOffset={transposeOffset}
                                textSizeMultiplier={textSizeMultiplier}
                                fontFamily={fontFamily}
                                chordBackground={chordBackground}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )
                )}
              </div>
            ) : (
              <div className="grow flex flex-col items-center justify-center opacity-40">
                <Music size={64} className="mb-4" />
                <p className="font-mono text-sm uppercase tracking-widest text-center">
                  Loading Stage Monitor...
                </p>
              </div>
            )}

            <div
              className={cn(
                "fixed left-1/2 lg:left-[calc(50%+160px)] 2xl:left-[calc(50%+190px)] -translate-x-1/2 z-50 transition-all",
                isTransportFloating
                  ? "bottom-[calc(env(safe-area-inset-bottom)+94px)] lg:bottom-25"
                  : "bottom-[calc(env(safe-area-inset-bottom)+80px)] lg:bottom-25",
              )}
            >
              <TransportSourceSelector />
            </div>

            {isTransportFloating ? (
              <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+24px)] lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-bg-deep/80 backdrop-blur-md border border-border-main p-1 rounded-full z-50 shadow-2xl overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-text-bright/5"></div>
                {/* Progress bar line for visual feedback */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-3 cursor-pointer flex items-end pb-px"
                  onClick={handleProgressClick}
                >
                  <div className="w-full h-0.5 bg-text-bright/10 overflow-hidden rounded-full hover:h-1 transition-all">
                    <div
                      className="h-full bg-brand shadow-[0_0_10px_#00FF41] transport-progress-bar"
                      style={{ width: "0%" }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 px-8 py-4">
                  <button
                    onClick={skipBackward}
                    className="text-text-dim hover:text-text-bright transition-colors"
                  >
                    <SkipBack size={24} />
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlayback}
                    className="w-12 h-12 flex items-center justify-center bg-text-bright text-bg-deep rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {isPlaying ? (
                      <Pause size={24} fill="currentColor" />
                    ) : (
                      <Play size={24} fill="currentColor" className="ml-1" />
                    )}
                  </motion.button>
                  <button
                    onClick={skipForward}
                    className="text-text-dim hover:text-text-bright transition-colors"
                  >
                    <SkipForward size={24} />
                  </button>
                  <div className="w-px h-6 bg-text-bright/20 mx-2"></div>
                  <button
                    onClick={() => setIsTransportFloating(!isTransportFloating)}
                    className="text-text-dim hover:text-text-bright transition-colors"
                    title="Dock Transport"
                  >
                    <Layers size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="fixed bottom-[env(safe-area-inset-bottom)] lg:bottom-0 left-0 right-0 xl:left-80 xl:right-80 2xl:left-95 2xl:right-95 h-20 lg:h-24 bg-bg-card/95 backdrop-blur-md border-t border-border-main z-40 shadow-2xl flex items-center transition-all">
                <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 items-center">
                  {/* Left: Track info & Progress - Hidden on small desktops to save space */}
                  <div className="hidden xl:flex items-center gap-6 overflow-hidden pr-4">
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {currentTrack && (
                        <div className="flex items-center gap-2 border border-text-bright/5 bg-bg-deep/20 p-1.5 px-3 rounded-full self-start max-w-full">
                          <div className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0"></div>
                          <span className="text-[10px] font-bold text-text-bright truncate">
                            {currentTrack.title}
                          </span>
                          <span className="text-[10px] text-text-dim truncate opacity-60">
                            · {currentTrack.artist}
                          </span>
                        </div>
                      )}
                      <div
                        className="h-4 w-full cursor-pointer flex items-center group -ml-2 pl-2"
                        onClick={handleProgressClick}
                      >
                        <div className="h-1.5 w-full bg-bg-deep border border-border-main rounded-full overflow-hidden relative group-hover:h-2 transition-all">
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-brand shadow-[0_0_15px_#00FF41] transport-progress-bar"
                            style={{ width: "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Main Controls */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                    <button
                      onClick={skipBackward}
                      className="p-2 rounded-full text-text-dim hover:text-brand hover:bg-text-bright/5 active:scale-90 transition-all"
                    >
                      <SkipBack
                        size={20}
                        className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                      />
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePlayback}
                      className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-brand text-brand-contrast hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,69,0,0.3)]"
                    >
                      {isPlaying ? (
                        <Pause
                          size={24}
                          className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          size={24}
                          className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ml-1"
                          fill="currentColor"
                        />
                      )}
                    </motion.button>
                    <button
                      onClick={skipForward}
                      className="p-2 rounded-full text-text-dim hover:text-brand hover:bg-text-bright/5 active:scale-90 transition-all"
                    >
                      <SkipForward
                        size={20}
                        className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                      />
                    </button>
                  </div>

                  {/* Right: Mode Switcher */}
                  <div className="hidden lg:flex justify-end items-center gap-2 xl:gap-4">
                    <div className="h-8 xl:h-10 w-px bg-text-bright/5 mx-1 xl:mx-2"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setIsTransportFloating(!isTransportFloating)
                      }
                      title="Toggle Floating UI"
                      className="h-8 w-8 xl:h-10 xl:w-10"
                    >
                      <Layers size={16} className="xl:base" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Song Notes Sidebar - Hidden on mobile/tablet unless active */}
          <aside
            className={cn(
              "dock-panel w-full lg:w-75 xl:w-[320px] 2xl:w-95 shrink-0 absolute lg:relative top-0 right-0 left-0 bottom-[env(safe-area-inset-bottom)] lg:bottom-0 z-20",
              mobileView === "notes" ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="dock-panel-header flex-col items-stretch gap-3 border-b-0 pb-0">
              <div className="flex justify-between items-center w-full">
                <h2 className="dock-panel-title">Session Tools</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileView("stage")}
                    className="lg:hidden p-2 text-text-bright"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-2">
                <button
                  onClick={() => setSessionToolsTab("sync")}
                  className={cn(
                    "ui-tab-btn shrink-0",
                    sessionToolsTab === "sync" && "active",
                  )}
                >
                  Live Sync
                </button>
                <button
                  onClick={() => setSessionToolsTab("notes")}
                  className={cn(
                    "ui-tab-btn shrink-0",
                    sessionToolsTab === "notes" && "active",
                  )}
                >
                  Notes
                </button>
                <button
                  onClick={() => setSessionToolsTab("tools")}
                  className={cn(
                    "ui-tab-btn shrink-0",
                    sessionToolsTab === "tools" && "active",
                  )}
                >
                  Tools
                </button>
                <button
                  onClick={() => setSessionToolsTab("youtube")}
                  className={cn(
                    "ui-tab-btn shrink-0",
                    sessionToolsTab === "youtube" && "active",
                  )}
                >
                  YouTube
                </button>
              </div>
            </div>

            <div className="dock-panel-content p-fluid-md lg:p-fluid-lg grow custom-scrollbar">
              {sessionToolsTab === "sync" && (
                <div className="flex flex-col gap-fluid-gap">
                  <div
                    className={cn(
                      "p-fluid-md lg:p-fluid-lg rounded-3xl border transition-all relative overflow-hidden",
                      isLiveSyncEnabled
                        ? "bg-brand/10 border-brand/40"
                        : "bg-text-bright/5 border-text-bright/10",
                    )}
                  >
                    {isLiveSyncEnabled && (
                      <div className="absolute -top-4 -right-4 p-4 opacity-20 pointer-events-none">
                        <Globe
                          size={120}
                          className="text-brand animate-pulse"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3
                          className={cn(
                            "text-lg font-bold tracking-tight mb-1 flex items-center gap-2",
                            isLiveSyncEnabled
                              ? "text-brand"
                              : "text-text-bright",
                          )}
                        >
                          {isLiveSyncEnabled ? (
                            <Globe className="animate-spin-slow" size={18} />
                          ) : (
                            <Globe size={18} />
                          )}
                          Live Sync
                        </h3>
                        <Badge
                          variant={isLiveSyncEnabled ? "brand" : "gray"}
                          size="xs"
                        >
                          {isLiveSyncEnabled ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <button
                        onClick={() => setIsLiveSyncEnabled(!isLiveSyncEnabled)}
                        className={cn(
                          "w-14 h-8 rounded-full transition-colors flex items-center px-1 shrink-0 shadow-inner",
                          isLiveSyncEnabled ? "bg-brand" : "bg-bg-deep/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 bg-white rounded-full transition-transform shadow-md",
                            isLiveSyncEnabled
                              ? "translate-x-6"
                              : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-text-dim leading-relaxed relative z-10">
                      When enabled, any song selected by the band leader will
                      automatically change on all members' screens over the
                      network in real-time.
                    </p>

                    {bandId || gigId ? (
                      <div className="mt-6 pt-4 border-t border-text-bright/10 flex gap-2 items-center text-[10px] font-mono text-text-bright/60 relative z-10">
                        <Users size={12} />
                        <span className="truncate">
                          Connected to: {bandId || gigId}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-6 pt-4 border-t border-text-bright/10 flex gap-2 items-center text-[10px] font-mono text-amber-500/80 relative z-10">
                        <UserCircle size={12} />
                        <span>
                          You need to join a session for this to work.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sessionToolsTab === "notes" && (
                <div className="space-y-6">
                  {(activeSong?.notes || []).map((note, nidx) => (
                    <div
                      key={nidx}
                      className="bg-[#262600]/30 border border-[#4D4D00] p-3 rounded-lg mb-4 text-xs italic text-[#FFFF66]"
                    >
                      <p>"{note}"</p>
                      <p className="mt-2 text-[10px] text-yellow-500/70 opacity-60">
                        - Shared Note
                      </p>
                    </div>
                  ))}

                  <button className="w-full p-2 border border-dashed border-border-main text-[10px] uppercase text-text-dim hover:text-brand hover:border-brand/40 transition-all mb-8">
                    + Add Performance Note
                  </button>

                  {(bandId || gigId) && (
                    <div className="mb-8">
                      <CollaborativeNotes
                        context={bandId ? "bands" : "gigs"}
                        sessionId={(bandId || gigId)!}
                      />
                    </div>
                  )}
                </div>
              )}

              {sessionToolsTab === "tools" && (
                <div className="flex flex-col gap-fluid-gap">
                  <MetronomePlugin />

                  <div className="pt-8 border-t border-border-main">
                    <ChordDatabase />
                  </div>
                </div>
              )}

              {sessionToolsTab === "youtube" && (
                <div className="flex flex-col gap-fluid-gap">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FF0000]">
                      YouTube Search
                    </h3>
                    <button
                      onClick={() =>
                        setMediaSource({
                          type:
                            mediaSource.type === "youtube" ? "none" : "youtube",
                          isActive: mediaSource.type !== "youtube",
                        })
                      }
                      className={cn(
                        "text-[9px] px-2 py-0.5 rounded font-mono uppercase transition-all",
                        mediaSource.type === "youtube"
                          ? "bg-[#FF0000] text-black"
                          : "bg-text-bright/5 text-text-dim hover:bg-text-bright/10",
                      )}
                    >
                      {mediaSource.type === "youtube" ? "Active" : "Enable"}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed">
                    Search for reference tracks or covers to visualize on stage.
                  </p>

                  <div className="border border-[#FF0000]/20 rounded-2xl bg-[#FF0000]/5 p-fluid-md shadow-inner space-y-4">
                    <YoutubeSearch
                      currentVideoId={activeSong?.youtubeId}
                      onPlay={() => {
                        setMediaSource({ type: "youtube", isActive: true });
                        setIsPlaying(true);
                      }}
                      onClear={async () => {
                        if (activeSong) {
                          const updatedSong = { ...activeSong };
                          delete updatedSong.youtubeId;
                          setSongs((prev) =>
                            prev.map((s) =>
                              s.id === updatedSong.id ? updatedSong : s,
                            ),
                          );
                          if (bandId || gigId) {
                            await bandService.saveSong(
                              (bandId || gigId) as string,
                              updatedSong,
                            );
                          }
                        }
                      }}
                      onSelect={async (video) => {
                        if (activeSong) {
                          const updatedSong = {
                            ...activeSong,
                            youtubeId: video.id,
                          };
                          setSongs((prev) =>
                            prev.map((s) =>
                              s.id === updatedSong.id ? updatedSong : s,
                            ),
                          );
                          setMediaSource({ type: "youtube", isActive: true });
                          setIsPlaying(true);
                          if (bandId || gigId) {
                            await bandService.saveSong(
                              (bandId || gigId) as string,
                              updatedSong,
                            );
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 lg:p-6 border-t border-border-main bg-bg-deep">
              {/* Media Integration Module - Frozen for Spotify */}
              <div className="bg-bg-card border border-text-bright/5 rounded-xl p-3 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand">
                  Stage Stream Bridge
                </h3>

                {currentTrack ? (
                  <div className="pt-2 border-t border-text-bright/5">
                    <div className="text-[9px] text-text-dim uppercase tracking-tighter font-mono">
                      Synced Track:
                    </div>
                    <div className="text-xs text-text-bright font-bold truncate tracking-tight">
                      {currentTrack.title}
                    </div>
                    <div className="text-[10px] text-brand opacity-80">
                      {currentTrack.artist}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-text-dim italic">
                    No external stream synced.
                  </p>
                )}
              </div>
            </div>

            {/* Song Information Summary & Track stats could go here */}
          </aside>
        </main>

        {/* Persistent Media Engine */}
        {spotifyToken && mediaSource.type === "spotify" && (
          <SpotifyPlayer
            ref={spotifyPlayerRef}
            token={spotifyToken}
            isPlaying={isPlaying}
            onTrackChange={setCurrentTrack}
            onPlayChange={setIsPlaying}
          />
        )}
        {mediaSource.type === "youtube" && !isYouTubeDocked && (
          <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[320px] lg:w-100 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[#FF0000]/30 bg-bg-deep animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-300">
            <div className="bg-[#111] px-4 py-3 text-[10px] font-mono flex justify-between items-center z-10 relative border-b border-border-main">
              <span className="text-[#FF0000] flex items-center gap-1.5">
                <Play size={10} fill="currentColor" /> Youtube Reference
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsYouTubeDocked(true)}
                  className="text-text-dim hover:text-text-bright flex items-center gap-1 uppercase tracking-widest"
                >
                  <LayoutTemplate size={12} /> Dock
                </button>
                <button
                  onClick={() =>
                    setMediaSource({ type: "none", isActive: false })
                  }
                  className="text-text-dim hover:text-text-bright"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="p-1">
              <YouTubePlayer
                ref={youtubePlayerRef}
                videoId={activeSong?.youtubeId || null}
                isPlaying={isPlaying}
                onPlayChange={setIsPlaying}
                visible={true}
              />
            </div>
          </div>
        )}

        {/* Song Specifications Modal */}
        {viewingSong && (
          <div
            className="fixed inset-0 bg-bg-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setViewingSongId(null)}
          >
            <div
              className="bg-bg-side border-2 border-brand/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border-main flex justify-between items-start bg-bg-card">
                <div>
                  <span className="text-[10px] font-mono text-brand uppercase tracking-widest block mb-1">
                    Pre-flight Technical Check
                  </span>
                  <h2 className="text-3xl font-bold text-text-bright tracking-tight">
                    {viewingSong.title}
                  </h2>
                </div>
                <button
                  onClick={() => setViewingSongId(null)}
                  className="p-2 hover:bg-text-bright/10 rounded-full text-text-dim transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 max-h-[80vh]">
                {/* Mesh/Grid Stats */}
                <div className="grid grid-cols-3 gap-6 text-center mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-text-dim uppercase font-bold tracking-[0.2em]">
                      Key
                    </span>
                    <div className="text-2xl font-mono text-brand">
                      {viewingSong.key}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-x border-text-bright/5 px-2">
                    <span className="text-[10px] text-text-dim uppercase font-bold tracking-[0.2em]">
                      Tempo
                    </span>
                    <div className="text-2xl font-mono text-text-bright">
                      {viewingSong.bpm || "UNSET"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-text-dim uppercase font-bold tracking-[0.2em]">
                      Capo
                    </span>
                    <div className="text-2xl font-mono text-text-bright">
                      {viewingSong.capo || 0}th
                    </div>
                  </div>
                </div>

                {/* Performance Notes Summary */}
                <div className="bg-bg-card border border-text-bright/5 p-4 rounded-xl">
                  <span className="text-[10px] text-text-dim uppercase font-bold tracking-widest block mb-2">
                    Performance Cues
                  </span>
                  <ul className="text-xs text-text-bright space-y-2 list-disc pl-4 opacity-70">
                    {(viewingSong?.notes || []).length > 0 ? (
                      (viewingSong?.notes || []).map((n, i) => (
                        <li key={i}>{n}</li>
                      ))
                    ) : (
                      <li className="italic">
                        No specific cues for this song.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2 mt-4">
                  <button
                    onClick={() => setViewingSongId(null)}
                    className="grow py-4 bg-text-bright/5 text-text-bright font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-text-bright/10 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handlePushToStage(viewingSong.id)}
                    className="flex-2 py-4 bg-brand text-brand-contrast font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(255,69,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={14} fill="currentColor" /> Initialize Live Stage
                  </button>
                </div>
              </div>

              <div className="bg-brand h-1 w-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div
            className="fixed inset-0 z-100 bg-bg-deep/90 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-300"
            onClick={cancelCountdown}
          >
            <div className="text-center space-y-8">
              <span className="text-brand font-mono uppercase tracking-[1em] block animate-pulse">
                Launching Sequence
              </span>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-text-bright/5 overflow-hidden z-50">
                <motion.div
                  className="h-full bg-brand"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: countdown > 0 ? 1 : 0,
                    ease: "linear",
                  }}
                />
              </div>
              <div className="text-[12rem] font-bold leading-none text-text-bright tabular-nums animate-in zoom-in-50 duration-300">
                {countdown}
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold uppercase opacity-60">
                  Preparing:
                </h4>
                <h3 className="text-4xl text-brand font-bold tracking-tight">
                  {songs.find((s) => s.id === pendingSongId)?.title}
                </h3>
              </div>
              <p className="text-text-dim uppercase tracking-widest text-xs mt-12 animate-bounce">
                Click anywhere to ABORT
              </p>
            </div>

            {countdown > 0 && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-text-bright/5 z-50">
                <div
                  className="h-full bg-brand transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>
      <PrintView printMode={printMode} songs={songs} />
    </>
  );
}
