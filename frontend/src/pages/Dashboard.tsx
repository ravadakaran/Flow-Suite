import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  FolderKanban, CheckSquare, Users, TrendingUp, Plus,
  Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCardSkeleton, TaskRowSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const PRIORITY_STYLE: Record<string, { dot: string; label: string }> = {
  urgent: { dot: 'bg-red-400',    label: 'bg-red-500/15 text-red-300 border-red-500/30' },
  high:   { dot: 'bg-orange-400', label: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  medium: { dot: 'bg-yellow-400', label: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  low:    { dot: 'bg-blue-400',   label: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
};

const STATUS_STYLE: Record<string, string> = {
  done:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  in_progress: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  in_review:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cancelled:   'bg-red-500/15 text-red-300 border-red-500/30',
  todo:        'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

/* SVG circular progress ring */
function ProgressRing({ value, size = 64, stroke = 5, color = '#6366f1' }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

/* Stagger container variants */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const;
const cardVariant = {
  hidden: { opacity: 0, scale: 0.93, y: 14 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast, showToast } = useToast();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data: tenant,    isLoading: tenantLoading }  = useQuery({ queryKey: ['tenant'],       queryFn: () => api.get('/tenants/me').then(r => r.data) });
  const { data: projects = [], isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data) });
  const { data: tasks = [],    isLoading: tasksLoading, refetch: refetchTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then(r => r.data) });
  const { data: members = [],  isLoading: membersLoading } = useQuery({ queryKey: ['members'],  queryFn: () => api.get('/members').then(r => r.data) });
  const { data: entitlements } = useQuery({ queryKey: ['entitlements'], queryFn: () => api.get('/entitlements').then(r => r.data) });

  const planEntitlement = (key: string) => entitlements?.find((e: any) => e.featureKey === key);

  const openTasks      = tasks.filter((t: any) => t.status !== 'done' && t.status !== 'cancelled').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
  const inProgressTasks= tasks.filter((t: any) => t.status === 'in_progress').length;
  const overdueTasks   = tasks.filter((t: any) => {
    if (t.status === 'done' || t.status === 'cancelled') return false;
    return t.dueDate && new Date(t.dueDate) < new Date();
  }).length;
  const completionPct  = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const stats = [
    { label: 'Total Projects', value: projects.length, limit: planEntitlement('max_projects')?.limitValue,
      icon: FolderKanban, from: '#3b82f6', to: '#06b6d4', nav: '/dashboard/projects' },
    { label: 'Open Tasks',     value: openTasks,       icon: CheckSquare,   from: '#10b981', to: '#059669', nav: '/dashboard/tasks' },
    { label: 'In Progress',    value: inProgressTasks, icon: Clock,         from: '#f59e0b', to: '#f97316', nav: '/dashboard/tasks' },
    { label: 'Completed',      value: completedTasks,  icon: CheckCircle2,  from: '#8b5cf6', to: '#a855f7', nav: '/dashboard/tasks' },
    { label: 'Team Members',   value: members.length,  limit: planEntitlement('max_members')?.limitValue,
      icon: Users, from: '#ec4899', to: '#f43f5e', nav: '/dashboard/team' },
    { label: 'Overdue',        value: overdueTasks,    icon: AlertCircle,   from: '#ef4444', to: '#dc2626', nav: '/dashboard/tasks' },
  ];

  const handleOpenCreateTask = () => {
    if (projects.length === 0) {
      showToast('Please create a project first', 'info');
      navigate('/dashboard/projects');
      return;
    }
    setTaskProjectId(projects[0]?.id || '');
    setShowCreateTask(true);
    setCreateError('');
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) { setCreateError('Task title is required'); return; }
    const targetProject = taskProjectId || projects[0]?.id;
    if (!targetProject) { setCreateError('Please create a project first'); return; }
    try {
      setIsCreating(true);
      setCreateError('');
      await api.post('/tasks', { title: taskTitle.trim(), projectId: targetProject, priority: 'medium', status: 'todo' });
      setTaskTitle('');
      setShowCreateTask(false);
      showToast('Task created successfully!', 'success');
      refetchTasks();
      qc.invalidateQueries({ queryKey: ['projects'] });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to create task';
      setCreateError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = tenantLoading || projectsLoading || tasksLoading || membersLoading;

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      {/* Header */}
      {isLoading ? (
        <div className="h-16 skeleton rounded-xl" />
      ) : (
        <PageHeader
          title={tenant?.name ?? 'Dashboard'}
          subtitle="Welcome back! Here's your workspace overview."
          action={
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: 'var(--color-secondary)',
                }}>
                {tenant?.plan?.toUpperCase() ?? 'FREE'} Plan
              </div>
              <button onClick={handleOpenCreateTask} className="btn-gradient flex items-center gap-2" id="create-task-btn">
                <Plus size={17} />
                New Task
              </button>
            </div>
          }
        />
      )}

      {/* Quick Create Task */}
      {showCreateTask && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-5 space-y-3"
          style={{ borderColor: 'rgba(99,102,241,0.4)', borderWidth: '1.5px' }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
              placeholder="What needs to be done?" className="input-glass flex-1"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateTask(); if (e.key === 'Escape') setShowCreateTask(false); }}
              autoFocus aria-label="New task title"
            />
            <select value={taskProjectId || projects[0]?.id || ''}
              onChange={e => setTaskProjectId(e.target.value)}
              className="input-glass sm:w-52"
              style={{ background: 'var(--color-surface-elevated)' }}>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={handleCreateTask} disabled={isCreating || !taskTitle.trim()}
                className="btn-gradient disabled:opacity-50">
                {isCreating ? <><span className="spinner spinner-sm" />Creating...</> : 'Create'}
              </button>
              <button onClick={() => setShowCreateTask(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
          {createError && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: '#fca5a5' }}>
              <AlertCircle size={16} className="flex-shrink-0" />{createError}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container} initial="hidden" animate="show"
        >
          {stats.map(({ label, value, limit, icon: Icon, from, to, nav }) => (
            <motion.div
              key={label}
              variants={cardVariant}
              className="stat-card group"
              onClick={() => nav && navigate(nav)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && nav && navigate(nav)}
              aria-label={`${label}: ${value}${limit ? ` of ${limit}` : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                    {label}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${from}25, ${to}20)`, border: `1px solid ${from}40` }}>
                  <Icon size={18} style={{ color: from }} />
                </div>
              </div>

              <div className="text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {value}
                {limit !== undefined && limit !== null && (
                  <span className="text-base font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    / {limit}
                  </span>
                )}
              </div>

              {limit !== undefined && limit !== null && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{Math.round((value / limit) * 100)}% used</span>
                    <span>{limit - value} remaining</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((value / limit) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${from}, ${to})`,
                      }} />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tasks — 2/3 width */}
        <div className="lg:col-span-2 card-glass">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CheckSquare size={20} style={{ color: 'var(--color-secondary)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Tasks</h2>
            </div>
            <button onClick={() => navigate('/dashboard/tasks')}
              className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-secondary)' }}>
              View all <ArrowRight size={15} />
            </button>
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <TaskRowSkeleton key={i} />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckSquare size={24} style={{ color: '#10b981' }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>No tasks yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Create a task to get started</p>
              <button onClick={() => setShowCreateTask(true)} className="btn-gradient">
                <Plus size={16} /> Create Task
              </button>
            </div>
          ) : (
            <motion.div className="space-y-2" variants={container} initial="hidden" animate="show">
              {tasks.slice(0, 6).map((task: any) => {
                const pStyle = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium;
                return (
                  <motion.div
                    key={task.id}
                    variants={cardVariant}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 priority-stripe-${task.priority}`}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    onClick={() => navigate(`/dashboard/projects/${task.projectId}/tasks`)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-bright)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/dashboard/projects/${task.projectId}/tasks`)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pStyle.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {task.project?.name && (
                          <><FolderKanban size={12} /><span>{task.project.name}</span></>
                        )}
                        {task.dueDate && (
                          <><span>·</span><Calendar size={12} /><span>{new Date(task.dueDate).toLocaleDateString()}</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge border ${pStyle.label}`}>{task.priority}</span>
                      <span className={`badge border ${STATUS_STYLE[task.status] ?? STATUS_STYLE.todo}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Right sidebar — 1/3 width */}
        <div className="space-y-5">
          {/* Completion ring */}
          <div className="card-glass">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Productivity</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <ProgressRing value={completionPct} />
                <div className="absolute inset-0 flex items-center justify-center rotate-90">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{completionPct}%</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <p style={{ color: 'var(--color-text-secondary)' }}>Completion rate</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {completedTasks} of {tasks.length} tasks done
                </p>
                {overdueTasks > 0 && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#fca5a5' }}>
                    <AlertCircle size={12} />
                    {overdueTasks} overdue
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects stat */}
          <div className="card-glass">
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban size={18} style={{ color: '#3b82f6' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Projects</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>Active</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>Avg tasks/project</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {projects.length ? Math.round(tasks.length / projects.length) : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Team stat */}
          <div className="card-glass">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} style={{ color: '#ec4899' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Team</h3>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span style={{ color: 'var(--color-text-muted)' }}>Members</span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{members.length}</span>
            </div>
            <button onClick={() => navigate('/dashboard/team')} className="btn-ghost w-full text-sm justify-center">
              Manage Team <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
