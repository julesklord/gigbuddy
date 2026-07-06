import React, { useState } from 'react';
import { X, UserCircle, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { UserProfile } from '../types';

export const UserConfigView: React.FC<{ 
  user: any, 
  profile: UserProfile | null, 
  onSave: (p: Partial<UserProfile>) => void, 
  onBack: () => void,
  onSignIn: () => void
}> = ({ user, profile, onSave, onBack, onSignIn }) => {
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [photo, setPhoto] = useState(profile?.photoURL || user?.photoURL || '');
  const [bio, setBio] = useState(profile?.bio || '');

  const isGuest = user?.uid === 'local-guest' || user?.isAnonymous;

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-bg-deep text-text-bright flex flex-col p-4 sm:p-6 lg:p-12 animate-in slide-in-from-right-8 duration-500 overflow-y-auto  z-50">
      <header className="max-w-2xl mx-auto w-full flex justify-between items-center mb-8 sm:mb-12 shrink-0 mt-[env(safe-area-inset-top)] pt-4">
        <button
          aria-label="Close profile"
          onClick={onBack}
          className="p-2 bg-text-bright/5 rounded-full hover:bg-text-bright/10 focus-visible:ring-2 focus-visible:outline-none transition-all"
        >
          <X size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tighter">Your Profile</h1>
        <button 
          onClick={() => {
            onSave({ displayName: name, photoURL: photo, bio });
            onBack();
          }}
          className="px-4 sm:px-6 py-2 bg-brand text-brand-contrast font-bold rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,69,0,0.2)] text-sm"
        >
          Save
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full space-y-12">
        {isGuest && (
          <div className="bg-brand/10 border border-brand/40 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div>
              <h3 className="text-brand font-bold text-lg mb-1">Upgrade your account</h3>
              <p className="text-xs text-text-dim">You are currently using an offline guest account. Sign in with Google to sync your setlists across devices and collaborate in real-time with your band.</p>
            </div>
            <Button onClick={onSignIn} icon={<Users size={16} />} className="w-full sm:w-auto">
              Sign in with Google
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand/20 bg-text-bright/5 relative group">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={128} className="text-text-bright/10" />
            )}
            <button
              type="button"
              onClick={() => document.getElementById('profile-photo')?.focus()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none flex items-center justify-center transition-opacity text-xs font-mono font-bold uppercase tracking-widest text-brand"
            >
              Update
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="text-text-dim text-xs font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Display Name</label>
            <input 
              id="profile-name"
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-text-bright/5 border border-border-main rounded-xl px-4 py-3 focus:border-brand focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-photo" className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Photo URL</label>
            <input 
              id="profile-photo"
              type="text" 
              value={photo} 
              onChange={e => setPhoto(e.target.value)}
              className="w-full bg-text-bright/5 border border-border-main rounded-xl px-4 py-3 focus:border-brand focus:outline-none transition-all placeholder:text-text-bright/10"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profile-bio" className="text-[10px] uppercase font-bold tracking-[0.2em] text-text-dim px-1">Bio</label>
            <textarea 
              id="profile-bio"
              rows={4}
              value={bio} 
              onChange={e => setBio(e.target.value)}
              className="w-full bg-text-bright/5 border border-border-main rounded-xl px-4 py-3 focus:border-brand focus:outline-none transition-all"
              placeholder="Tell the band about yourself..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}