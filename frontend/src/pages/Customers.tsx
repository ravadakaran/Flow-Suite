import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, Trash2, Edit2, Mail, Phone, Search, X, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  active:   { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',   label: 'Active' },
  inactive: { badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',     label: 'Inactive' },
  archived: { badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',        label: 'Archived' },
};

const AVATAR_GRADIENTS = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#059669'],
  ['#ec4899', '#f43f5e'],
  ['#f97316', '#eab308'],
];

function getGradient(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}

const cardVariant = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};
const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
} as const;

export default function Customers() {
  const qc = useQueryClient();
  const { toast, showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => api.get(`/customers?page=${page}&limit=12`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/customers', payload),
    onSuccess: () => {
      showToast(`Customer "${name}" created!`, 'success');
      qc.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create customer';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.patch(`/customers/${editingId}`, payload),
    onSuccess: () => {
      showToast('Customer updated!', 'success');
      qc.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update customer';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      showToast('Customer deleted', 'info');
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setStatus('active');
    setError('');
  };

  const handleCreate = () => {
    if (!name.trim()) { setError('Customer name is required'); return; }
    setError('');
    const payload = { name, email: email || undefined, company: company || undefined, phone: phone || undefined, status };
    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email || '');
    setCompany(customer.company || '');
    setPhone(customer.phone || '');
    setStatus(customer.status || 'active');
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = (data?.data || []).filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const customers = data?.data || [];

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      <PageHeader
        eyebrow="Workspace"
        title="Customers"
        subtitle={`${customers.length} customer${customers.length !== 1 ? 's' : ''} in your workspace`}
        action={
          <button onClick={() => setShowForm(true)} className="btn-gradient flex items-center gap-2" id="new-customer-btn">
            <Plus size={17} />
            New customer
          </button>
        }
      />

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="search"
          placeholder="Search customers by name, email, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-glass pl-11 w-full"
          aria-label="Search customers"
        />
      </div>

      {/* Create/Edit form */}
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
              <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingId ? 'Edit Customer' : 'New Customer'}
              </h3>
              <button onClick={resetForm} className="btn-ghost p-1.5" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="input-glass w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="input-glass w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="input-glass w-full"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg flex gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={16} style={{ color: '#fca5a5', flexShrink: 0, marginTop: '2px' }} />
                  <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-gradient flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
                </button>
                <button onClick={resetForm} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-glass p-4 space-y-3">
              <Skeleton variant="avatar" width="40px" />
              <Skeleton variant="title" width="60%" />
              <Skeleton variant="text" width="80%" />
              <div className="flex gap-2 pt-2">
                <Skeleton variant="badge" width="70px" />
                <Skeleton variant="badge" width="70px" />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Users size={26} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No customers yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>Start building your customer base by creating your first customer record.</p>
          <button onClick={() => setShowForm(true)} className="btn-gradient inline-flex items-center gap-2">
            <Plus size={16} />
            New customer
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card-glass text-center py-12 px-6">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No customers match your search.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredCustomers.map((customer: any, idx: number) => {
            const grad = getGradient(idx);
            const config = STATUS_CONFIG[customer.status] || STATUS_CONFIG.active;
            return (
              <motion.div
                key={customer.id}
                variants={cardVariant}
                className="card-glass p-5 flex flex-col transition-all duration-200 hover:border-indigo-500/50"
                style={{ cursor: 'pointer' }}
              >
                {/* Header with avatar and name */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
                    >
                      {(customer.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {customer.name}
                      </h3>
                      {customer.company && (
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {customer.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="btn-ghost p-1.5 hover:bg-indigo-500/10"
                      aria-label="Edit customer"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(customer.id)}
                      disabled={deleteMutation.isPending}
                      className="btn-ghost p-1.5 hover:bg-red-500/10 disabled:opacity-50"
                      aria-label="Delete customer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-2 flex-1">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Mail size={13} />
                      <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Phone size={13} />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Footer with status */}
                <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <span className={`badge border text-xs font-medium px-2.5 py-1 ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{data.page}</span> of{' '}
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{data.totalPages}</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="btn-ghost px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
