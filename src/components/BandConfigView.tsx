import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Trash2, LogOut, Globe, Users, UserCircle, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { bandService } from '../services/bandService';
import { Band, UserProfile } from '../types';
import { User } from 'firebase/auth';

export const BandConfigView: React.FC<{ 
  user: User, 
  band: Band, 
  isOnline: boolean,
  onBack: () => void,
  onLeave: () => void,
  onUpdate: (updates: Partial<Band>) => void
}> = ({ user, band, isOnline, onBack, onLeave, onUpdate }) => {
  const isAdmin = band.ownerId === user.uid;
  const [name, setName] = useState(band.name);
  const [accentColor, setAccentColor] = useState(band.accentColor || '#ff4500');
  const [fontFamily, setFontFamily] = useState(band.fontFamily || 'Inter');
  const [members, setMembers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Fetch profiles for members
    const fetchProfiles = async () => {
      const results = await Promise.all((band.members || []).map(uid => bandService.getProfile(uid)));
      setMembers(results.filter(p => p !== null) as UserProfile[]);
    };
    fetchProfiles();
  }, [band.members]);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-bg-deep text-text-bright flex flex-col p-4 sm:p-6 lg:p-12 animate-in slide-in-from-left-8 duration-500 overflow-y-auto  z-50">
      <header className="max-w-3xl mx-auto w-full flex justify-between items-center mb-8 sm:mb-12 shrink-0 mt-[env(safe-area-inset-top)] pt-4">
        <button onClick={onBack} className="p-2 bg-text-bright/5 rounded-full hover:bg-text-bright/10 transition-all"><X size={24} /></button>
        <div className="text-center">
          <span className="text-[9px] sm:text-[10px] font-mono text-brand uppercase tracking-widest block mb-1">Administrative Center</span>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tighter flex items-center justify-center gap-3">
             {isAdmin ? "Squad Dashboard" : "Squad View"}
             <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-text-bright/10 ml-2">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", isOnline ? "bg-green-500 text-green-500" : "bg-red-500 text-red-500")}></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-dim">{isOnline ? 'Network Online' : 'Network Offline'}</span>
             </div>
          </h1>
        </div>
        {isAdmin ? (
          <button 
            onClick={() => {
               bandService.updateBand(band.id, { name, accentColor, fontFamily });
               onUpdate({ name, accentColor, fontFamily });
               onBack();
            }}
            className="px-4 sm:px-6 py-2 bg-brand text-brand-contrast font-bold rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,69,0,0.2)] text-sm"
          >
            Save
          </button>
        ) : (
          <button 
            onClick={onLeave}
            className="px-4 sm:px-6 py-2 bg-red-600/20 border border-red-600/40 text-red-500 font-bold rounded-lg hover:bg-red-600/30 transition-all flex items-center gap-2 text-sm"
          >
            <LogOut size={16} /> Leave
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto w-full space-y-16">
        {/* Group Identity */}
        <section className="bg-text-bright/5 border border-border-main p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
             <Shield className="text-brand" size={20} />
             <h2 className="text-xl font-bold">Group Identity</h2>
          </div>
          <div className="space-y-4">
             <div className="grid gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Band Name</label>
                <input 
                  type="text" 
                  value={name} 
                  readOnly={!isAdmin}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-border-main rounded-xl px-4 py-3 focus:border-brand focus:outline-none transition-all disabled:opacity-50"
                  disabled={!isAdmin}
                />
             </div>
             <div className="grid gap-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Permanent Band ID</label>
                <div className="w-full bg-black/40 border border-border-main rounded-xl px-4 py-3 flex items-center justify-between">
                   <span className="font-mono text-brand">{band.id}</span>
                   <button 
                    onClick={() => navigator.clipboard.writeText(band.id)}
                    className="p-1.5 hover:bg-text-bright/5 rounded text-text-dim"
                   >
                     <Copy size={16} />
                   </button>
                </div>
             </div>
          </div>
          {isAdmin && (
            <div className="pt-6 border-t border-text-bright/5 flex flex-wrap gap-4">
               <button 
                onClick={async () => {
                  if (confirm("Reset current setlist for the whole band?")) {
                    const context = band.id.startsWith('band-') ? 'bands' : 'gigs';
                    await bandService.updateSetlist(context as any, band.id, []);
                    alert("Setlist cleared.");
                  }
                }}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded hover:bg-red-500/20 transition-all flex items-center gap-2"
               >
                 <Trash2 size={14} /> Clear Hive Setlist
               </button>
               <button 
                onClick={onLeave}
                className="px-4 py-2 bg-text-dim/10 border border-text-dim/20 text-text-bright text-[10px] font-bold uppercase rounded hover:bg-text-dim/20 transition-all flex items-center gap-2"
               >
                 <LogOut size={14} /> Exit to Local Session
               </button>
            </div>
          )}
        </section>

        {/* Global Branding settings */}
        <section className="bg-text-bright/5 border border-border-main p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
             <Globe className="text-brand" size={20} />
             <h2 className="text-xl font-bold">Band Branding</h2>
          </div>
          <p className="text-sm text-text-dim">These settings overwrite individual member's environments to create a unified experience when the band is active.</p>
          <div className="space-y-6">
             <div className="grid gap-4">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Accent Color</label>
                <div className="flex flex-wrap gap-3">
                  {['#ff4500', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#00ff41'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setAccentColor(color)}
                      style={{ backgroundColor: color }}
                      className={cn(
                        "w-8 h-8 rounded-full shadow-lg transition-transform", 
                        !isAdmin ? "opacity-50 pointer-events-none" : "hover:scale-110",
                        accentColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-bg-deep scale-110" : ""
                      )}
                    />
                  ))}
                  {isAdmin && (
                    <input 
                      type="color" 
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 bg-transparent"
                      title="Custom color"
                    />
                  )}
                </div>
             </div>
             <div className="grid gap-4 pt-4 border-t border-border-main/50">
                <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Band Typography</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'Inter', label: 'Inter (Modern)' },
                    { id: 'Outfit', label: 'Outfit (Clean)' },
                    { id: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
                    { id: 'Playfair Display', label: 'Playfair (Editorial)' },
                    { id: 'JetBrains Mono', label: 'JetBrains (Code)' },
                  ].map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id)}
                      className={cn(
                        "px-4 py-3 border rounded-xl text-left transition-colors flex justify-between items-center group",
                        !isAdmin ? "opacity-50 pointer-events-none" : "hover:bg-text-bright/5",
                        fontFamily === font.id ? "border-brand text-brand bg-brand/5" : "border-border-main"
                      )}
                    >
                      <span style={{ fontFamily: `"${font.id}", sans-serif` }}>{font.label}</span>
                      {fontFamily === font.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* Member Management */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Users className="text-blue-400" size={20} />
               <h2 className="text-xl font-bold">Member Hive ({band.members.length})</h2>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {members.map(member => (
              <div key={member.uid} className="bg-text-bright/5 border border-border-main p-4 rounded-2xl flex items-center justify-between group hover:border-brand/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-text-bright/5 overflow-hidden border border-border-main">
                    {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle size={40} className="text-text-bright/10" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {member.displayName}
                      {member.uid === band.ownerId && <Shield size={12} className="text-brand" />}
                    </div>
                    <p className="text-[10px] text-text-dim italic line-clamp-1 truncate max-w-[120px]">{member.bio || "No bio yet."}</p>
                  </div>
                </div>
                {isAdmin && member.uid !== user.uid && (
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${member.displayName}?`)) {
                        bandService.removeMember(band.id, member.uid);
                        setMembers(prev => prev.filter(m => m.uid !== member.uid));
                      }
                    }}
                    className="p-2 text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remove Member"
                    aria-label={`Remove ${member.displayName}`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}