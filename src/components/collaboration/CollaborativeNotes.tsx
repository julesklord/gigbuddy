import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, Clock } from 'lucide-react';
import { bandService } from '../../services/bandService';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface CollaborativeNotesProps {
  context: 'bands' | 'gigs';
  sessionId: string;
  initialNotes?: string;
}

export const CollaborativeNotes: React.FC<CollaborativeNotesProps> = ({ context, sessionId, initialNotes = '' }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId || sessionId.startsWith('local-')) return;

    // Real-time synchronization
    const sessionRef = doc(db, context, sessionId, 'sessions', 'active');
    const unsub = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!isEditing) {
          setNotes(data.sessionNotes || '');
        }
        if (data.updatedAt) {
          setLastUpdated(data.updatedAt.toDate());
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${context}/${sessionId}/sessions/active`);
    });

    return () => unsub();
  }, [context, sessionId, isEditing]);

  // Debounced save
  useEffect(() => {
    if (!isEditing) return;
    
    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [notes, isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    try {
      await bandService.updateSessionNotes(context, sessionId, notes);
    } catch (err) {
      console.error("Failed to save notes", err);
    }
  };

  return (
    <div className="bg-bg-side border border-white/10 rounded-2xl overflow-hidden flex flex-col">
      <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand">
          <MessageSquare size={12} /> Live Session Chat & Notes
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[8px] text-text-dim flex items-center gap-1">
              <Clock size={8} /> {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Users size={12} className="text-blue-400 opacity-50" />
        </div>
      </div>
      
      <div className="relative group p-1">
        <textarea
          ref={textareaRef}
          aria-label="Collaborative session notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsEditing(true);
          }}
          onBlur={handleSave}
          placeholder="Type collaborative notes here... (All members see this instantly)"
          className="w-full h-48 bg-transparent p-4 text-xs text-text-bright leading-relaxed focus:outline-none resize-none custom-scrollbar placeholder:text-white/5"
          spellCheck={false}
        />
        
        {isEditing && (
          <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 bg-brand px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-[10px] font-bold text-black uppercase tracking-widest">Syncing</span>
              <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white/5 px-4 py-2 text-[8px] uppercase tracking-widest text-text-dim border-t border-white/5 flex justify-between">
        <span>Cloud-Synced Logic Active</span>
        <span className="text-brand/50">v2.0 Collaboration</span>
      </div>
    </div>
  );
};
