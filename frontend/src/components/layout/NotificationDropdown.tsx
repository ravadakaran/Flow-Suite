import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Bell, Check, CheckSquare, Users, FolderKanban, Shield, Zap,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationItem {
  id: string;
  type: 'task' | 'team' | 'project' | 'security' | 'system';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  task: { icon: CheckSquare, bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
  team: { icon: Users, bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' },
  project: { icon: FolderKanban, bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
  security: { icon: Shield, bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
  system: { icon: Zap, bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Query notifications with 30s polling
  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark all read mutation
  const markAllMutation = useMutation({
    mutationFn: () => {
      const ids = notifications.map((n) => n.id);
      return api.post('/notifications/read-all', { ids });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-all border border-transparent hover:border-[var(--color-border)] hover:bg-white/5 cursor-pointer text-slate-300 hover:text-white"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  <Check size={13} />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification Items List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400 mb-3">
                    <Bell size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-300">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No new notifications in this workspace</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const iconConfig = TYPE_ICONS[item.type] || TYPE_ICONS.system;
                  const Icon = iconConfig.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-white/[0.04] ${
                        !item.read ? 'bg-indigo-500/[0.06]' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: iconConfig.bg, color: iconConfig.color }}
                      >
                        <Icon size={17} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${item.read ? 'text-slate-300' : 'text-white'}`}>
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator / Action */}
                      <div className="flex-shrink-0 flex items-center self-center">
                        {!item.read ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                        ) : (
                          item.link && <ExternalLink size={12} className="text-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
