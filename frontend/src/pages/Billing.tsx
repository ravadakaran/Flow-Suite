import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Check, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';
import { useState } from 'react';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    description: 'Perfect for getting started and small projects',
    features: ['3 team members', '2 active projects', '1 GB storage', 'Community & email support'],
    cta: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Starter',
    price: '₹499',
    description: 'For growing teams with higher capacity needs',
    features: ['10 team members', '20 active projects', '50 GB storage', 'Priority email support', 'Advanced task analytics'],
    cta: 'Upgrade to Starter',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Professional',
    price: '₹999',
    description: 'For organizations needing unlimited scale and power',
    features: ['50 team members', 'Unlimited projects', '500 GB storage', '24/7 dedicated support', 'Audit logs & integrations'],
    cta: 'Upgrade to Professional',
  },
];

const STATUS_COLOR: Record<string, { bg: string; text: string; badge: string }> = {
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', badge: 'bg-emerald-500/30 text-emerald-200' },
  past_due: { bg: 'bg-orange-500/15', text: 'text-orange-300', badge: 'bg-orange-500/30 text-orange-200' },
  trialing: { bg: 'bg-blue-500/15', text: 'text-blue-300', badge: 'bg-blue-500/30 text-blue-200' },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const cardVariant = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } },
};

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  let barColor = '#10b981'; // green
  if (percentage > 80) barColor = '#ef4444'; // red
  else if (percentage > 50) barColor = '#f59e0b'; // orange

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {used} / {limit}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: barColor,
            boxShadow: `0 0 12px ${barColor}80`,
          }}
        />
      </div>
    </div>
  );
}

export default function Billing() {
  const { toast, showToast } = useToast();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => api.get('/entitlements/usage').then(r => r.data),
  });

  // Check URL query parameters for checkout return
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success' || params.get('session_id')) {
      showToast('Subscription updated successfully!', 'success');
      refetchUsage();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => {
      const successUrl = `${window.location.origin}/dashboard/billing?status=success`;
      const cancelUrl = `${window.location.origin}/dashboard/billing?status=cancelled`;
      return api.post('/billing/checkout', {
        priceId: planId,
        planId,
        successUrl,
        cancelUrl,
      });
    },
    onSuccess: (res: any) => {
      const redirectUrl = res.data?.url || res.data?.checkoutUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        showToast('Plan upgraded successfully!', 'success');
        refetchUsage();
        setCheckingOut(null);
      }
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to initiate checkout', 'error');
      setCheckingOut(null);
    },
  });

  const handleUpgrade = (planId: string) => {
    setCheckingOut(planId);
    checkoutMutation.mutate(planId);
  };

  if (usageLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
        {toast}
        <PageHeader
          eyebrow="Account"
          title="Billing & Subscription"
          subtitle="Manage your plan and view usage"
        />
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const currentPlan = usage?.currentPlan || 'free';
  const subscriptionStatus = usage?.subscriptionStatus || 'active';
  const statusConfig = STATUS_COLOR[subscriptionStatus] || STATUS_COLOR.active;

  return (
    <div className="p-6 lg:p-8 space-y-7 min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {toast}

      <PageHeader
        eyebrow="Account"
        title="Billing & Subscription"
        subtitle="Manage your plan and view usage"
      />

      {/* Usage Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="card-glass p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Resource Usage
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Current plan: <span className="font-semibold capitalize">{currentPlan}</span>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.badge}`}>
            {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <QuotaBar
            label="Team Members"
            used={usage?.seatsUsed || 0}
            limit={usage?.seatsLimit || 5}
          />
          <QuotaBar
            label="Active Projects"
            used={usage?.projectsUsed || 0}
            limit={usage?.projectsLimit || 5}
          />
          <QuotaBar
            label="Storage"
            used={usage?.storageUsedGB || 0}
            limit={usage?.storageLimitGB || 1}
          />
        </div>
      </motion.div>

      {/* Tier Cards */}
      <div>
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Choose Your Plan
        </h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {TIERS.map((tier) => {
            const isCurrent = currentPlan === tier.id;

            return (
              <motion.div
                key={tier.id}
                variants={cardVariant}
                className="card-glass p-6 space-y-5 relative overflow-hidden"
                style={{
                  borderWidth: tier.highlighted ? '2px' : '1px',
                  borderColor: tier.highlighted ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                  boxShadow: tier.highlighted ? '0 0 24px rgba(139,92,246,0.2)' : undefined,
                }}
              >
                {tier.highlighted && (
                  <div
                    className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
                      color: '#000',
                    }}
                  >
                    <Zap size={12} />
                    Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {tier.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {tier.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {tier.price}
                    </span>
                    {tier.id !== 'free' && (
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        /month
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm">
                      <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && handleUpgrade(tier.id)}
                  disabled={isCurrent || checkingOut !== null}
                  className={`w-full p-2.5 rounded-lg font-medium transition-all ${
                    isCurrent
                      ? 'btn-ghost opacity-60 cursor-default'
                      : checkingOut === tier.id
                        ? 'btn-gradient opacity-70'
                        : 'btn-gradient'
                  }`}
                >
                  {checkingOut === tier.id && (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Processing...
                    </span>
                  )}
                  {checkingOut !== tier.id && (isCurrent ? 'Current Plan' : tier.cta)}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.3 }}
        className="card-glass p-6 space-y-4"
      >
        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Have questions?
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>• Your plan can be changed anytime. Changes take effect at the next billing cycle.</li>
          <li>• All plans include a 14-day free trial for new workspaces.</li>
          <li>• Need a custom plan? <a href="mailto:support@flowsuite.dev" style={{ color: 'var(--color-primary)' }}>Contact us</a></li>
        </ul>
      </motion.div>
    </div>
  );
}
