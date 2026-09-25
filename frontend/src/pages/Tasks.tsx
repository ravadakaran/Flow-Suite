import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, ArrowLeft, CheckSquare, AlertCircle, FolderKanban, Trash2, X, Filter, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageHeader } from '../components/ui/PageHeader';
import { KanbanColumnSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const STATUS_COLS = ['todo', 'in_progress', 'done', 'cancelled'] as const;
type TaskStatusType = typeof STATUS_COLS[number];

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_ACCENT: Record<string, { from: string; to: string; badge: string }> = {
  todo:        { from: '#64748b', to: '#475569', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  in_progress: { from: '#3b82f6', to: '#06b6d4', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  done:        { from: '#10b981', to: '#059669', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  cancelled:   { from: '#ef4444', to: '#b91c1c', badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

const PRIORITY_STRIPE: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const PRIORITY_BADGE: Record<string, string> = {
  low:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  high:   'bg-orange-500/15 text-orange-300 border-orange-500/30',
  urgent: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  exit:   { opacity: 0, scale: 0.9,  y: -8, transition: { duration: 0.18 } },
};

// Draggable Task Card Component
function DraggableTaskCard({ task, status, onDelete, onUpdate, onShowPicker }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status, task } });

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && status !== 'done' && status !== 'cancelled';
  const dueDateDisplay = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <motion.div
      ref={setNodeRef}
      variants={cardVariant}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
      className={`card-glass group relative overflow-hidden cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500 shadow-2xl z-20' : ''
      }`}
      style={{ paddingLeft: '18px', transform: CSS.Transform.toString(transform), transition } as any}
      {...attributes}
      {...listeners}
    >
      {/* Priority left stripe */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: PRIORITY_STRIPE[task.priority] ?? PRIORITY_STRIPE.medium }}
      />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-snug transition-colors"
            style={{ color: 'var(--color-text-primary)' }}>
            {task.title}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${task.title}"?`)) onDelete(task.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {task.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
            {task.description}
          </p>
        )}

        {/* Due Date & Assignee Section */}
        <div className="space-y-2 py-2 border-t border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {/* Due Date */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onShowPicker('date', task.id);
            }}
            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-white/5"
            style={{
              background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface)',
              border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'}`,
              color: isOverdue ? '#ef4444' : 'var(--color-text-muted)',
            }}
          >
            <Calendar size={12} />
            <span>
              {task.dueDate ? (
                <>
                  {dueDateDisplay}
                  {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                </>
              ) : (
                'No due date'
              )}
            </span>
          </div>

          {/* Assignee */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onShowPicker('assignee', task.id);
            }}
            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-white/5"
            style={{
              background: task.assignee ? 'var(--color-surface)' : 'rgba(107, 114, 128, 0.1)',
              border: `1px solid ${task.assignee ? 'var(--color-border)' : 'rgba(107, 114, 128, 0.3)'}`,
              color: task.assignee ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)',
            }}
          >
            <User size={12} />
            <span>{task.assignee?.fullName || task.assignee?.email || 'Unassigned'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`badge border ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium}`}>
            {task.priority}
          </span>
          {task.project?.name && (
            <span className="badge flex items-center gap-1"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <FolderKanban size={11} />{task.project.name}
            </span>
          )}
        </div>

        {/* Status quick move buttons */}
        <div className="flex flex-wrap gap-1 pt-2"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          {STATUS_COLS.filter(s => s !== status).map(s => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ id: task.id, status: s });
              }}
              className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={e => {
                const a = STATUS_ACCENT[s];
                e.currentTarget.style.background = `${a.from}18`;
                e.currentTarget.style.borderColor = `${a.from}40`;
                e.currentTarget.style.color = a.from;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-surface)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
              aria-label={`Move to ${STATUS_LABELS[s]}`}
            >
              → {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Droppable Kanban Column Component
function KanbanColumn({
  status,
  tasks,
  onDelete,
  onUpdate,
  onShowPicker,
}: {
  status: string;
  tasks: any[];
  onDelete: (id: string) => void;
  onUpdate: (data: any) => void;
  onShowPicker: (type: 'date' | 'assignee', taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const accent = STATUS_ACCENT[status] || STATUS_ACCENT.todo;

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-2xl p-2.5 transition-all ${
        isOver
          ? 'bg-indigo-500/10 ring-2 ring-indigo-500/50'
          : 'bg-transparent'
      }`}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}12)`,
          border: `1px solid ${accent.from}30`,
        }}
      >
        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {STATUS_LABELS[status]}
        </h3>
        <span className={`badge border ${accent.badge}`}>{tasks.length}</span>
      </div>

      {/* Sortable Context and Drop Area */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[140px] flex flex-col">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-center py-10 rounded-xl flex flex-col items-center justify-center"
                style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                  Drag tasks here
                </p>
              </motion.div>
            ) : (
              tasks.map((task: any) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  status={status}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onShowPicker={onShowPicker}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}

export default function Tasks() {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast, showToast } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [targetProjectId, setTargetProjectId] = useState(routeProjectId || '');
  const [error, setError] = useState('');
  const [pickerState, setPickerState] = useState<{ type?: 'date' | 'assignee'; taskId?: string }>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => Array.isArray(r.data) ? r.data : []),
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(r => Array.isArray(r.data) ? r.data : []),
  });

  const activeFilter = routeProjectId || (selectedProjectId !== 'all' ? selectedProjectId : undefined);

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ['tasks', activeFilter],
    queryFn: () => {
      const url = activeFilter ? `/tasks?projectId=${activeFilter}` : '/tasks';
      return api.get(url).then(r => Array.isArray(r.data) ? r.data : []);
    },
  });

  const currentProject = useMemo(() =>
    routeProjectId ? projects.find((p: any) => p.id === routeProjectId) : null,
    [projects, routeProjectId]
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setError('');
      showToast('Task created successfully!', 'success');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create task';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update task';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      showToast('Task deleted', 'info');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    },
  });

  const handleOpenCreateForm = () => {
    const defaultProj = routeProjectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '');
    setTargetProjectId(defaultProj);
    setShowForm(true);
    setError('');
  };

  const handleCreateSubmit = () => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    const projId = targetProjectId || routeProjectId || projects[0]?.id;
    if (!projId) {
      setError('Please select or create a project first');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      projectId: projId,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sourceStatus = active.data.current?.status;
    let destStatus = over.data.current?.status;

    // If dropped directly onto a column container
    if (!destStatus && STATUS_COLS.includes(over.id as any)) {
      destStatus = over.id as TaskStatusType;
    }

    // If dropped on another task card in a column
    if (!destStatus) {
      const overTask = tasks.find((t: any) => t.id === over.id);
      if (overTask) {
        destStatus = overTask.status;
      }
    }

    if (destStatus && sourceStatus !== destStatus) {
      updateMutation.mutate({ id: active.id, status: destStatus });
    }
  };

  const handleShowPicker = (type: 'date' | 'assignee', taskId: string) => {
    setPickerState({ type, taskId });
    const task = tasks.find((t: any) => t.id === taskId);
    if (type === 'date') {
      setSelectedDate(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
    if (type === 'assignee') {
      setSelectedAssignee(task?.assigneeId || task?.assignee?.id || '');
    }
  };

  const handleSavePicker = () => {
    if (!pickerState.taskId) return;
    if (pickerState.type === 'date') {
      updateMutation.mutate({
        id: pickerState.taskId,
        dueDate: selectedDate ? new Date(selectedDate).toISOString() : null,
      });
      setPickerState({});
    } else if (pickerState.type === 'assignee') {
      updateMutation.mutate({
        id: pickerState.taskId,
        assigneeId: selectedAssignee || null,
      });
      setPickerState({});
    }
  };

  const tasksByStatus = useMemo(() =>
    STATUS_COLS.reduce((acc, s) => {
      acc[s] = tasks.filter((t: any) => t.status === s);
      return acc;
    }, {} as Record<TaskStatusType, any[]>),
    [tasks]
  );

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      {/* Header */}
      <PageHeader
        eyebrow={routeProjectId ? 'Project Board' : 'Workspace'}
        title={currentProject?.name ?? (routeProjectId ? 'Project Tasks' : 'All Tasks')}
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} total`}
        action={
          <div className="flex items-center gap-3">
            {routeProjectId && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/projects')}
                className="btn-ghost flex items-center gap-2"
                aria-label="Back to projects"
              >
                <ArrowLeft size={17} /> Back
              </button>
            )}
            {!routeProjectId && projects.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
              >
                <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none cursor-pointer"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <option value="all">All Projects</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={handleOpenCreateForm} className="btn-gradient flex items-center gap-2" id="new-task-btn">
              <Plus size={17} /> New task
            </button>
          </div>
        }
      />

      {/* Date/Assignee Picker Modal */}
      <AnimatePresence>
        {pickerState.type && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setPickerState({})}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-glass p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                  {pickerState.type === 'date' ? 'Set Due Date' : 'Assign Team Member'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPickerState({})}
                  className="btn-ghost p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {pickerState.type === 'date' ? (
                <div className="space-y-4">
                  <div>
                    <label className="field-label mb-1.5 block">Due Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSavePicker} className="btn-gradient flex-1">
                      Save
                    </button>
                    {selectedDate && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate('')}
                        className="btn-secondary"
                      >
                        Clear Date
                      </button>
                    )}
                    <button type="button" onClick={() => setPickerState({})} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="field-label mb-1.5 block">Select Assignee</label>
                    <select
                      value={selectedAssignee}
                      onChange={e => setSelectedAssignee(e.target.value)}
                      className="input-glass w-full bg-slate-900"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m: any) => {
                        const u = m.user || m;
                        return (
                          <option key={u.id} value={u.id}>
                            {u.fullName ? `${u.fullName} (${u.email})` : u.email}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSavePicker} className="btn-gradient flex-1">
                      Save
                    </button>
                    <button type="button" onClick={() => setPickerState({})} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            className="card-glass p-6"
            style={{ borderColor: 'rgba(6,182,212,0.45)', borderWidth: '1.5px', transformOrigin: 'top' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <CheckSquare size={20} style={{ color: '#06b6d4' }} /> New Task
              </h2>
              <button onClick={() => { setShowForm(false); setError(''); }} className="btn-ghost p-2" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold mb-3" style={{ color: '#fde68a' }}>
                  No projects exist yet. Tasks must belong to a project.
                </p>
                <button onClick={() => navigate('/dashboard/projects')} className="btn-gradient">
                  Go to Projects
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="task-title" className="field-label">Task Title *</label>
                  <input
                    id="task-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Implement user profile avatar upload"
                    className="input-glass"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreateSubmit()}
                  />
                </div>
                <div>
                  <label htmlFor="task-desc" className="field-label">Description</label>
                  <textarea
                    id="task-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional acceptance criteria or details..."
                    className="input-glass h-20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="task-project" className="field-label">Project *</label>
                    <select
                      id="task-project"
                      value={targetProjectId || projects[0]?.id || ''}
                      onChange={e => setTargetProjectId(e.target.value)}
                      className="input-glass"
                      disabled={!!routeProjectId}
                      style={{ background: 'var(--color-surface-elevated)' }}
                    >
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="task-priority" className="field-label">Priority</label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="input-glass"
                      style={{ background: 'var(--color-surface-elevated)' }}
                    >
                      {['low', 'medium', 'high', 'urgent'].map(p => (
                        <option key={p} value={p} className="bg-slate-900 text-white">
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: '#fca5a5' }}
                  >
                    <AlertCircle size={15} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateSubmit}
                    disabled={createMutation.isPending || !title.trim()}
                    className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[130px]"
                    id="create-task-submit"
                  >
                    {createMutation.isPending ? <><span className="spinner spinner-sm" />Creating...</> : 'Create Task'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board with Drag and Drop */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {STATUS_COLS.map(s => <KanbanColumnSkeleton key={s} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card-glass text-center py-16">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}
          >
            <FolderKanban size={28} style={{ color: '#06b6d4' }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>No projects yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
            Create a project first to start tracking tasks.
          </p>
          <button onClick={() => navigate('/dashboard/projects')} className="btn-gradient">
            <Plus size={17} /> Create First Project
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {STATUS_COLS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status] ?? []}
                onDelete={(id: string) => deleteMutation.mutate(id)}
                onUpdate={(data: any) => updateMutation.mutate(data)}
                onShowPicker={handleShowPicker}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
