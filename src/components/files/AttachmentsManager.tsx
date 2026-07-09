import React, { useState } from 'react';
import { Attachment } from '../../types';
import { Paperclip, Plus, X, ExternalLink, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AttachmentsManagerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  readOnly?: boolean;
}

export const AttachmentsManager: React.FC<AttachmentsManagerProps> = ({ attachments = [], onChange, readOnly = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'pdf' | 'image' | 'link'>('pdf');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newAttachment: Attachment = {
      id: Date.now().toString(),
      title: newTitle,
      url: newUrl,
      type: newType,
    };

    onChange([...attachments, newAttachment]);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(attachments.filter(a => a.id !== id));
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={16} />;
      case 'image': return <ImageIcon size={16} />;
      default: return <LinkIcon size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {attachments.map((file) => (
            <div 
              key={file.id} 
              className="bg-bg-deep border border-border-main p-3 rounded-lg flex items-center justify-between group hover:border-brand/40 transition-all cursor-pointer"
              onClick={() => window.open(file.url, '_blank')}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-bg-card flex items-center justify-center text-text-dim group-hover:text-brand transition-colors">
                  {getIcon(file.type)}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-text-bright truncate">{file.title}</p>
                  <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">{file.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <div className="p-1.5 text-text-dim group-hover:text-brand transition-colors">
                  <ExternalLink size={14} />
                </div>
                {!readOnly && (
                  <button 
                    onClick={(e) => handleRemove(file.id, e)}
                    className="p-1.5 text-text-dim hover:bg-red-500/10 hover:text-red-500 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          {isAdding ? (
            <form onSubmit={handleAdd} className="bg-bg-deep border border-border-main p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-bold text-brand tracking-widest">Add External File Link</h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-text-dim hover:text-white focus-visible:ring-2 focus-visible:outline-none rounded"
                  aria-label="Cancel adding attachment"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="attachment-title" className="text-[10px] uppercase font-bold text-text-dim tracking-widest">Title (e.g. Bass Tab PDF)</label>
                  <input 
                    id="attachment-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-2 text-sm text-white font-mono rounded outline-none focus:border-brand"
                    placeholder="Document Title"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="attachment-type" className="text-[10px] uppercase font-bold text-text-dim tracking-widest">Type</label>
                  <select
                    id="attachment-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 p-2 text-sm text-white font-mono rounded outline-none focus:border-brand"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="image">Image / Stage Plot</option>
                    <option value="link">Other Web Link</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="attachment-url" className="text-[10px] uppercase font-bold text-text-dim tracking-widest">URL (Google Drive, Dropbox, etc)</label>
                <input 
                  id="attachment-url"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-2 text-sm text-white font-mono rounded outline-none focus:border-brand"
                  placeholder="https://"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Attachment
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border border-dashed border-white/10 text-text-dim hover:text-brand hover:border-brand/40 transition-all rounded-lg uppercase font-bold tracking-widest text-[10px] flex items-center justify-center gap-2"
            >
              <Paperclip size={14} /> Link Stage Plot, PDF Tab, or File
            </button>
          )}
        </>
      )}
    </div>
  );
}
