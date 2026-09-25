import { useState } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Copy, Eye, EyeOff, AlertTriangle, LogOut, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';

export default function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast, showToast } = useToast();

  // Form states
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  interface TenantData {
    id: string;
    name: string;
    slug: string;
    owner?: {
      id: string;
      email: string;
      fullName: string;
    };
    currentUserId?: string;
    role?: string;
  }

  const { data: tenant, isLoading: tenantLoading } = useQuery<TenantData>({
    queryKey: ['tenant'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
  });

  // After mount, populate form with tenant data
  React.useEffect(() => {
    if (tenant) {
      setFullName(tenant.owner?.fullName || '');
      setWorkspaceName(tenant.name || '');
      setWorkspaceSlug(tenant.slug || '');
    }
  }, [tenant]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName: string }) => api.patch('/users/me', data),
    onSuccess: () => {
      showToast('Profile updated successfully', 'success');
      qc.invalidateQueries({ queryKey: ['tenant'] });
    },
    onError: (err: any) => {
      setErrors({ profile: err.response?.data?.message || 'Failed to update profile' });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/users/password', data),
    onSuccess: () => {
      showToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    },
    onError: (err: any) => {
      setErrors({ password: err.response?.data?.message || 'Failed to update password' });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.patch(`/tenants/${tenant?.id}`, data),
    onSuccess: () => {
      showToast('Workspace updated successfully', 'success');
      qc.invalidateQueries({ queryKey: ['tenant'] });
    },
    onError: (err: any) => {
      setErrors({ workspace: err.response?.data?.message || 'Failed to update workspace' });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => api.delete(`/tenants/${tenant?.id}`),
    onSuccess: () => {
      showToast('Workspace deleted', 'info');
      navigate('/login');
    },
    onError: (err: any) => {
      setErrors({ delete: err.response?.data?.message || 'Failed to delete workspace' });
    },
  });

  const leaveWorkspaceMutation = useMutation({
    mutationFn: () => api.post(`/tenants/${tenant?.id}/leave`, {}),
    onSuccess: () => {
      showToast('You have left the workspace', 'info');
      navigate('/login');
    },
    onError: (err: any) => {
      setErrors({ leave: err.response?.data?.message || 'Failed to leave workspace' });
    },
  });

  const handleSaveProfile = () => {
    setErrors({});
    if (!fullName.trim()) {
      setErrors({ profile: 'Full name is required' });
      return;
    }
    updateProfileMutation.mutate({ fullName });
  };

  const handleUpdatePassword = () => {
    setErrors({});
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrors({ password: 'All password fields are required' });
      return;
    }
    if (newPassword.length < 8) {
      setErrors({ password: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ password: 'New passwords do not match' });
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleSaveWorkspace = () => {
    setErrors({});
    if (!workspaceName.trim() || !workspaceSlug.trim()) {
      setErrors({ workspace: 'Workspace name and slug are required' });
      return;
    }
    updateWorkspaceMutation.mutate({ name: workspaceName, slug: workspaceSlug });
  };

  const handleCopyOrgId = () => {
    if (tenant?.id) {
      navigator.clipboard.writeText(tenant.id);
      showToast('Organization ID copied!', 'success');
    }
  };

  if (tenantLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
        {toast}
        <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile and workspace" />
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const isOwner = tenant?.owner?.id === tenant?.currentUserId || tenant?.role === 'owner';

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile and workspace"
      />

      {/* User Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="card-glass p-6 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Account Settings
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Update your profile information
          </p>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="field-label">Full Name</label>
            <input
              id="fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-glass w-full"
              placeholder="Your full name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input
              id="email"
              type="email"
              value={tenant?.owner?.email || ''}
              disabled
              className="input-glass w-full opacity-60 cursor-not-allowed"
              placeholder="Your email"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Email cannot be changed
            </p>
          </div>

          {errors.profile && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderLeft: '2px solid #ef4444' }}>
              {errors.profile}
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="btn-gradient w-full"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
        className="card-glass p-6 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Change Password
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Update your password to keep your account secure
          </p>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="current-pwd" className="field-label">Current Password</label>
            <div className="relative">
              <input
                id="current-pwd"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-glass w-full pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new-pwd" className="field-label">New Password</label>
            <input
              id="new-pwd"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-glass w-full"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-pwd" className="field-label">Confirm Password</label>
            <input
              id="confirm-pwd"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-glass w-full"
              placeholder="Confirm new password"
            />
          </div>

          {errors.password && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderLeft: '2px solid #ef4444' }}>
              {errors.password}
            </div>
          )}

          <button
            onClick={handleUpdatePassword}
            disabled={updatePasswordMutation.isPending}
            className="btn-gradient w-full"
          >
            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </motion.div>

      {/* Workspace Settings (Owner/Admin only) */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
          className="card-glass p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Workspace Settings
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Owner and admin only
            </p>
          </div>

          <div className="space-y-4">
            {/* Workspace Name */}
            <div>
              <label htmlFor="ws-name" className="field-label">Workspace Name</label>
              <input
                id="ws-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="input-glass w-full"
                placeholder="Your workspace name"
              />
            </div>

            {/* Workspace Slug */}
            <div>
              <label htmlFor="ws-slug" className="field-label">Workspace Slug</label>
              <input
                id="ws-slug"
                type="text"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value)}
                className="input-glass w-full"
                placeholder="Workspace URL slug"
              />
            </div>

            {/* Organization ID */}
            <div>
              <label htmlFor="org-id" className="field-label">Organization ID</label>
              <div className="flex items-center gap-2">
                <input
                  id="org-id"
                  type="text"
                  value={tenant?.id || ''}
                  disabled
                  className="input-glass w-full opacity-60 cursor-not-allowed"
                />
                <button
                  onClick={handleCopyOrgId}
                  className="btn-ghost p-2 flex-shrink-0"
                  aria-label="Copy organization ID"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Use this ID for API integrations
              </p>
            </div>

            {errors.workspace && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderLeft: '2px solid #ef4444' }}>
                {errors.workspace}
              </div>
            )}

            <button
              onClick={handleSaveWorkspace}
              disabled={updateWorkspaceMutation.isPending}
              className="btn-gradient w-full"
            >
              {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.15 }}
        className="card-glass p-6 space-y-6"
        style={{ borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: '1px' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          <h2 className="text-lg font-bold" style={{ color: '#ef4444' }}>
            Danger Zone
          </h2>
        </div>

        <div className="space-y-3">
          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full p-3 rounded-lg font-medium flex items-center justify-between"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <span>Delete Workspace</span>
              <Trash2 size={16} />
            </button>
          )}

          {!isOwner && (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="w-full p-3 rounded-lg font-medium flex items-center justify-between"
              style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fed7aa', border: '1px solid rgba(245, 158, 11, 0.3)' }}
            >
              <span>Leave Workspace</span>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass p-6 max-w-sm w-full rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#ef4444' }}>
                Delete Workspace
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              This action cannot be undone. All projects, tasks, and team members will be permanently deleted.
            </p>

            {errors.delete && (
              <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderLeft: '2px solid #ef4444' }}>
                {errors.delete}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteWorkspaceMutation.mutate();
                  setShowDeleteModal(false);
                }}
                disabled={deleteWorkspaceMutation.isPending}
                className="flex-1 p-2 rounded-lg font-medium text-white"
                style={{ background: '#ef4444' }}
              >
                {deleteWorkspaceMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-glass p-6 max-w-sm w-full rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Leave Workspace
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              You will lose access to this workspace and all its projects and tasks.
            </p>

            {errors.leave && (
              <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderLeft: '2px solid #ef4444' }}>
                {errors.leave}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowLeaveModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={() => {
                  leaveWorkspaceMutation.mutate();
                  setShowLeaveModal(false);
                }}
                disabled={leaveWorkspaceMutation.isPending}
                className="flex-1 p-2 rounded-lg font-medium text-white"
                style={{ background: '#f97316' }}
              >
                {leaveWorkspaceMutation.isPending ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
