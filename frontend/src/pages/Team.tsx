import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { UserPlus, Trash2, ShieldCheck, Mail, Calendar, X, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { MemberRowSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const ROLE_CONFIG: Record<string, { gradient: string; badge: string; label: string }> = {
  owner:  { gradient: 'from-purple-500 to-pink-500',  badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',  label: 'Owner' },
  admin:  { gradient: 'from-blue-500 to-cyan-500',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       label: 'Admin' },
  member: { gradient: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Member' },
  guest:  { gradient: 'from-yellow-500 to-amber-500', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', label: 'Guest' },
};

const AVATAR_GRADIENTS = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#059669'],
  ['#ec4899', '#f43f5e'],
  ['#f97316', '#eab308'],
];

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } } as const;

export default function Team() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast, showToast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(r => r.data),
  });

  const { data: usage } = useQuery({
    queryKey: ['team-usage'],
    queryFn: () => api.get('/entitlements/usage').then(r => r.data),
  });

  const isSeatLimitReached = usage ? usage.seatsLimit > 0 && (usage.seatsUsed ?? members.length) >= usage.seatsLimit : false;

  const inviteMutation = useMutation({
    mutationFn: (data: any) => api.post('/members/invite', data),
    onSuccess: (res) => {
      showToast('Invite sent successfully!', 'success');
      // Keep the link accessible via alert for now
      if (res.data.inviteUrl) {
        alert(`Invite link: ${res.data.inviteUrl}`);
      }
      setShowInvite(false);
      setEmail('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to send invite');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/members/${userId}`),
    onSuccess: () => {
      showToast('Member removed', 'info');
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => {
      const validRoles = ['owner', 'admin', 'member', 'guest'];
      if (!validRoles.includes(role)) {
        return Promise.reject(new Error('Invalid role'));
      }
      return api.patch(`/members/${userId}/role`, { role });
    },
    onSuccess: () => {
      showToast('Role updated', 'success');
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      <PageHeader
        eyebrow="Workspace"
        title="Team"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} in your workspace`}
        action={
          <div className="relative group">
            <button
              onClick={() => !isSeatLimitReached && setShowInvite(true)}
              disabled={isSeatLimitReached}
              className={`btn-gradient flex items-center gap-2 ${
                isSeatLimitReached ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
              }`}
              id="invite-btn"
              title={isSeatLimitReached ? 'Seat limit reached for this plan' : undefined}
            >
              <UserPlus size={17} />
              Invite member
            </button>
            {isSeatLimitReached && (
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-30 p-2.5 rounded-xl text-xs bg-slate-900/95 backdrop-blur-md border border-amber-500/30 text-amber-200 whitespace-nowrap shadow-xl">
                Seat limit reached ({usage?.seatsUsed}/{usage?.seatsLimit}). Upgrade to Starter for more seats.
              </div>
            )}
          </div>
        }
      />

      {/* Seat limit warning banner */}
      {isSeatLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            borderColor: 'rgba(234, 179, 8, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Seat Limit Reached ({usage?.seatsUsed} / {usage?.seatsLimit} members)
              </p>
              <p className="text-xs text-amber-400/80">
                Your workspace is at maximum team capacity for the {usage?.currentPlan?.toUpperCase() || 'FREE'} plan.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="btn-gradient text-xs px-3.5 py-2 flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
          >
            Upgrade Plan <ArrowRight size={13} />
          </button>
        </motion.div>
      )}

      {/* Invite form */}
      {showInvite && (
        <motion.div
          initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          className="card-glass p-6"
          style={{ borderColor: 'rgba(139,92,246,0.45)', borderWidth: '1.5px', transformOrigin: 'top' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <UserPlus size={20} style={{ color: '#8b5cf6' }} />
              Invite Team Member
            </h2>
            <button onClick={() => { setShowInvite(false); setError(''); }} className="btn-ghost p-2" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="field-label">
                <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                Email address
              </label>
              <input
                id="invite-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="colleague@company.com"
                className="input-glass"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="field-label">Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="input-glass"
                style={{ background: 'var(--color-surface-elevated)' }}
              >
                {['member', 'admin', 'guest'].map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: '#fca5a5' }}>
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => inviteMutation.mutate({ email, role })}
                disabled={inviteMutation.isPending || !email.trim()}
                className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                id="send-invite-btn"
              >
                {inviteMutation.isPending ? <><span className="spinner spinner-sm" />Sending...</> : 'Send invite'}
              </button>
              <button onClick={() => { setShowInvite(false); setError(''); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <MemberRowSkeleton key={i} />)}
        </div>
      ) : members.length === 0 ? (
        <div className="card-glass text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <UserPlus size={28} style={{ color: '#8b5cf6' }} />
          </div>
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>No team members yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>Invite your first teammate to collaborate</p>
          <button onClick={() => setShowInvite(true)} className="btn-gradient">
            <UserPlus size={17} /> Invite Someone
          </button>
        </div>
      ) : (
        <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
          {members.map((m: any, i: number) => {
            const roleConf = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member;
            const initials = ((m.user.fullName || m.user.email || 'U') as string)[0].toUpperCase();
            const [avatarFrom, avatarTo] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];

            return (
              <motion.div
                key={m.id}
                variants={rowVariant}
                className="card-glass group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
                      style={{
                        background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})`,
                        boxShadow: `0 4px 12px ${avatarFrom}40`,
                      }}
                    >
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {m.user.fullName || m.user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <Mail size={12} />
                        <span className="truncate">{m.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role + date + action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right space-y-2">
                      {m.role === 'owner' ? (
                        <div className={`badge border flex items-center gap-1.5 ${roleConf.badge}`}>
                          <ShieldCheck size={12} />
                          Owner
                        </div>
                      ) : (
                        <select
                          value={m.role}
                          onChange={e => updateRoleMutation.mutate({ userId: m.userId, role: e.target.value })}
                          className={`badge border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${roleConf.badge}`}
                          style={{ background: 'transparent' }}
                          aria-label={`Change role for ${m.user.email}`}
                        >
                          {['admin', 'member', 'guest'].map(r => (
                            <option key={r} value={r} style={{ background: 'hsl(235,25%,11%)' }}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-disabled)' }}>
                        <Calendar size={11} />
                        <span>{m.acceptedAt ? new Date(m.acceptedAt).toLocaleDateString() : 'Pending'}</span>
                      </div>
                    </div>

                    {m.role !== 'owner' && (
                      <button
                        onClick={() => confirm('Remove this member from the workspace?') && removeMutation.mutate(m.userId)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all border border-transparent"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.borderColor = 'var(--color-danger-border)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        aria-label={`Remove ${m.user.email}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
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
