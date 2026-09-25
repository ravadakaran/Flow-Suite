import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, FolderKanban, Archive, Trash2, ChevronRight, Search, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { ProjectCardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const GRADIENT_PAIRS = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#059669'],
  ['#ec4899', '#f43f5e'],
  ['#f97316', '#eab308'],
  ['#8b5cf6', '#a855f7'],
];

const cardVariant = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};
const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
} as const;

export default function Projects() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.post('/projects', data),
    onSuccess: () => {
      showToast(`Project "${name}" created!`, 'success');
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setName('');
      setDescription('');
      setError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create project';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      showToast('Project deleted', 'info');
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) { setError('Project name is required'); return; }
    setError('');
    createMutation.mutate({ name, description: description || undefined });
  };

  const filteredProjects = projects.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace`}
        action={
          <button onClick={() => setShowForm(true)} className="btn-gradient flex items-center gap-2" id="new-project-btn">
            <Plus size={17} />
            New project
          </button>
        }
      />

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-glass pl-11"
          aria-label="Search projects"
        />
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            className="card-glass p-6"
            style={{ borderColor: 'rgba(99,102,241,0.45)', borderWidth: '1.5px', transformOrigin: 'top' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Plus size={20} style={{ color: 'var(--color-secondary)' }} />
                New Project
              </h2>
              <button onClick={() => { setShowForm(false); setError(''); setName(''); setDescription(''); }}
                className="btn-ghost p-2" aria-label="Close form">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="project-name" className="field-label">Project Name *</label>
                <input id="project-name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Q4 Marketing Campaign"
                  className="input-glass" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div>
                <label htmlFor="project-desc" className="field-label">Description</label>
                <textarea id="project-desc" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What is this project about? (optional)"
                  className="input-glass h-24 resize-none" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: '#fca5a5' }}>
                  <AlertCircle size={16} className="flex-shrink-0" />{error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handleCreate} disabled={createMutation.isPending || !name.trim()}
                  className="btn-gradient flex-1 disabled:opacity-50 disabled:cursor-not-allowed" id="create-project-btn">
                  {createMutation.isPending
                    ? <><span className="spinner spinner-sm" />Creating...</>
                    : <><Plus size={17} />Create Project</>}
                </button>
                <button onClick={() => { setShowForm(false); setError(''); setName(''); setDescription(''); }}
                  className="btn-secondary">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-glass text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <FolderKanban size={28} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {search ? 'No projects match your search' : 'No projects yet'}
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {search ? 'Try a different search term' : 'Create your first project to start organizing work'}
          </p>
          {!search && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-gradient">
              <Plus size={17} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container} initial="hidden" animate="show"
        >
          {filteredProjects.map((project: any, i: number) => {
            const [from, to] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
            return (
              <motion.div
                key={project.id}
                variants={cardVariant}
                className="card-glass group cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/dashboard/projects/${project.id}/tasks`)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-bright)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/dashboard/projects/${project.id}/tasks`)}
                aria-label={`Open ${project.name} project`}
              >
                {/* Gradient top stripe */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                  style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />

                <div className="flex items-start justify-between mb-4 pt-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${from}25, ${to}20)`, border: `1px solid ${from}40` }}>
                    <FolderKanban size={18} style={{ color: from }} />
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Delete project "${project.name}"?`)) deleteMutation.mutate(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>{project.name}</h3>
                    {project.status === 'archived' && (
                      <Archive size={14} style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: `${from}20`, color: from, border: `1px solid ${from}35` }}>
                        {project._count?.tasks ?? 0} task{project._count?.tasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1"
                      style={{ color: 'var(--color-secondary)' }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
