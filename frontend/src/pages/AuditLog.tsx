import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Shield as _Shield, ChevronLeft, ChevronRight, Calendar, User, Database, Lock, Search, X, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';

const ACTION_STYLE: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  update: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  delete: 'bg-red-500/15 text-red-300 border-red-500/30',
  invite: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  login:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
};

function getActionStyle(action: string): string {
  const key = Object.keys(ACTION_STYLE).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_STYLE[key] : 'bg-slate-500/15 text-slate-300 border-slate-500/30';
}

const rowVariant = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 26 } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } } as const;

export default function AuditLog() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useQuery<any, any>({
    queryKey: ['audit', page, actionFilter, resourceFilter],
    queryFn: () => {
      let url = `/audit?page=${page}&limit=25`;
      if (actionFilter) url += `&action=${actionFilter}`;
      if (resourceFilter) url += `&resource=${resourceFilter}`;
      return api.get(url).then(r => r.data);
    },
    retry: false,
  });

  const filteredLogs = data?.logs?.filter((log: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      log.actor?.fullName?.toLowerCase().includes(searchLower) ||
      log.actorEmail?.toLowerCase().includes(searchLower) ||
      log.resourceId?.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isError) {
    return (
      <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
        <PageHeader
          eyebrow="Security"
          title="Audit Log"
          subtitle="Immutable record of all workspace activity"
        />

        <div className="card-glass text-center py-16 px-6 max-w-lg mx-auto">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)' }}
          >
            <Lock size={28} style={{ color: '#eab308' }} />
          </div>
          <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Restricted Access
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            {error?.response?.status === 403
              ? 'Audit log viewing requires Owner or Admin permissions, or an upgraded subscription tier (Starter/Professional).'
              : 'Audit log is currently unavailable for this workspace account.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost text-sm px-4 py-2"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard/billing')}
              className="btn-gradient text-sm px-4 py-2 flex items-center gap-2"
            >
              View Plans & Billing <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const uniqueActions = [...new Set(data?.logs?.map((l: any) => l.action) || [])] as string[];
  const uniqueResources = [...new Set(data?.logs?.map((l: any) => l.resource) || [])] as string[];

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        eyebrow="Security"
        title="Audit Log"
        subtitle="Immutable record of all workspace activity"
      />

      {isLoading ? (
        <div className="card-glass space-y-3 p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="badge" width="90px" />
              <Skeleton variant="text" className="flex-1" />
              <Skeleton variant="text" width="120px" />
              <Skeleton variant="text" width="100px" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="search"
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-glass pl-11 w-full"
                aria-label="Search audit logs"
              />
            </div>

            {/* Action & Resource filters */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className="input-glass text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <select
                value={resourceFilter}
                onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
                className="input-glass text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <option value="">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>

            {/* Active filters display */}
            {(actionFilter || resourceFilter || search) && (
              <div className="flex gap-2 flex-wrap items-center">
                {actionFilter && (
                  <button
                    onClick={() => setActionFilter('')}
                    className="badge border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5 text-xs"
                  >
                    {actionFilter} <X size={12} />
                  </button>
                )}
                {resourceFilter && (
                  <button
                    onClick={() => setResourceFilter('')}
                    className="badge border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5 text-xs"
                  >
                    {resourceFilter} <X size={12} />
                  </button>
                )}
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="badge border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5 text-xs"
                  >
                    "{search}" <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Log table */}
          <div className="card-glass overflow-hidden p-0">
            {!filteredLogs?.length ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Database size={26} style={{ color: 'var(--color-secondary)' }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>No events found</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table header */}
                <div className="grid grid-cols-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.06em',
                  }}>
                  <span>Action</span>
                  <span>Resource</span>
                  <span>Actor</span>
                  <span>Time</span>
                </div>

                <motion.div variants={container} initial="hidden" animate="show">
                  {filteredLogs.map((log: any) => (
                    <motion.div
                      key={log.id}
                      variants={rowVariant}
                      className="grid grid-cols-4 px-6 py-4 transition-colors duration-150"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Action */}
                      <div className="flex items-center">
                        <span className={`badge border font-mono text-xs ${getActionStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </div>

                      {/* Resource */}
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {log.resource}
                        </p>
                        {log.resourceId && (
                          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-disabled)' }}>
                            {log.resourceId.slice(0, 12)}…
                          </p>
                        )}
                      </div>

                      {/* Actor */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                          <User size={13} style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {log.actor?.fullName || 'System'}
                          </p>
                          {log.actorEmail && (
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {log.actorEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <Calendar size={13} style={{ color: 'var(--color-text-disabled)' }} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Page <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{data.page}</span>
                {' '}of{' '}
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{data.totalPages}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-disabled)' }}>({data.total} events)</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost p-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="btn-ghost p-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
