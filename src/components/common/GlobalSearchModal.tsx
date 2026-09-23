import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Folder, CheckSquare, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    projects: any[];
    tasks: any[];
    messages: any[];
    files: any[];
  }>({
    projects: [],
    tasks: [],
    messages: [],
    files: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ projects: [], tasks: [], messages: [], files: [] });
      return;
    }

    let isMounted = true;

    const timer = setTimeout(async () => {
      if (!isMounted) return;
      setIsSearching(true);
      try {
        const term = `%${searchTerm.trim()}%`;
        const [projRes, taskRes, msgRes, fileRes] = await Promise.all([
          supabase.from('projects').select('id, title, code, stage').ilike('title', term).limit(4),
          supabase.from('tasks').select('id, title, stage_key, priority, project_id').ilike('title', term).limit(6),
          supabase.from('messages').select('id, content, conversation_id, created_at').ilike('content', term).limit(4),
          supabase.from('files').select('id, name, category, project_id').ilike('name', term).limit(4),
        ]);

        if (isMounted) {
          setResults({
            projects: projRes.data || [],
            tasks: taskRes.data || [],
            messages: msgRes.data || [],
            files: fileRes.data || [],
          });
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[var(--bg-surface-elevated)] rounded-xl shadow-2xl border border-[var(--border-default)] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-default)] gap-3 bg-[var(--bg-surface)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isId ? 'Cari proyek, tugas, pesan, berkas artefak...' : 'Search projects, tasks, telemetry, chats, artifacts...'}
            className="flex-1 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none bg-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {isSearching && (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              {isId ? 'Mencari di indeks sistem...' : 'Searching workspace index...'}
            </div>
          )}

          {!isSearching && searchTerm && !results.projects.length && !results.tasks.length && !results.messages.length && !results.files.length && (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
              {isId ? 'Tidak ada artefak atau data yang sesuai dengan ' : 'No artifacts or telemetry records matching '}
              <span className="font-semibold text-[var(--text-primary)]">"{searchTerm}"</span>
            </div>
          )}

          {!searchTerm && (
            <div className="py-6 px-2 text-xs text-[var(--text-secondary)] space-y-2">
              <div className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[10px]">
                {isId ? 'Akses Cepat' : 'Quick Access'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { navigate('/kanban'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-left text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                  {isId ? 'Orchestration Board' : 'Orchestration Kanban Board'}
                </button>
                <button
                  onClick={() => { navigate('/chat'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-left text-xs font-medium text-[var(--text-primary)] transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  {isId ? 'Chat Tim Real-Time' : 'Real-Time Chat & Task Bridge'}
                </button>
              </div>
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" /> {isId ? 'Proyek' : 'Projects'}
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      navigate(`/projects/${proj.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] group text-left border border-transparent hover:border-[var(--border-default)] transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{proj.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{proj.code} • {isId ? 'Fase:' : 'Stage:'} {proj.stage}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> {isId ? 'Tugas' : 'Tasks'}
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      navigate('/kanban');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] group text-left border border-transparent hover:border-[var(--border-default)] transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-[var(--text-primary)]">{task.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {isId ? 'Tahap:' : 'Stage:'} <span className="font-semibold text-[var(--accent-primary)]">{task.stage_key}</span> • {isId ? 'Prioritas:' : 'Priority:'} {task.priority}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div>
            {isId ? (
              <>Tekan <span className="font-semibold text-[var(--text-primary)]">ESC</span> untuk menutup atau <span className="font-semibold text-[var(--text-primary)]">Enter</span> untuk memilih</>
            ) : (
              <>Press <span className="font-semibold text-[var(--text-primary)]">ESC</span> to close or <span className="font-semibold text-[var(--text-primary)]">Enter</span> to select</>
            )}
          </div>
          <div>SDK Central Index v2.4</div>
        </div>
      </div>
    </div>
  );
};
