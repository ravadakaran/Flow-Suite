import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { Zap, User, Mail, Lock, Building2, Globe, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Minimum 8 characters'),
  workspaceName: z.string().min(1, 'Workspace name is required'),
  workspaceSlug: z.string().min(2, 'Minimum 2 characters').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Account', 'Workspace'] as const;

export default function Register() {
  const navigate = useNavigate();
  const { setTokens, setTenantSlug } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const goNext = async () => {
    const valid = await trigger(['fullName', 'email', 'password']);
    if (valid) setStep(1);
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post('/auth/register', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
      });
      setSuccess(true);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setTenantSlug(data.workspaceSlug);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="orb-1 absolute top-[-10%] right-[15%] w-[450px] h-[450px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)' }} />
        <div className="orb-2 absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-sm)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FlowSuite
            </span>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: i <= step ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                    color: i <= step ? 'white' : 'var(--color-text-muted)',
                    border: `1px solid ${i <= step ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-xs font-semibold" style={{ color: i <= step ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 transition-all duration-300"
                  style={{ background: i < step ? 'var(--color-primary)' : 'var(--color-border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Success banner */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}
            role="status"
          >
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>Workspace created!</p>
              <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--color-success)' }}>Redirecting to dashboard...</p>
            </div>
          </motion.div>
        )}

        {/* Form card */}
        <div className="glass-lg p-8 mb-5">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {step === 0 ? 'Create account' : 'Set up workspace'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            {step === 0 ? 'Your personal details to get started' : 'Name your team workspace'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Step 0 — Account */}
              {step === 0 && (
                <>
                  <div>
                    <label htmlFor="fullName" className="field-label">
                      <User size={14} style={{ color: 'var(--color-secondary)' }} />
                      Full name
                    </label>
                    <input id="fullName" {...register('fullName')} placeholder="Jane Smith"
                      className="input-glass" autoComplete="name" />
                    {errors.fullName && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="field-label">
                      <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                      Email address
                    </label>
                    <input id="reg-email" {...register('email')} type="email" placeholder="jane@company.com"
                      className="input-glass" autoComplete="email" />
                    {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="field-label">
                      <Lock size={14} style={{ color: 'var(--color-secondary)' }} />
                      Password
                    </label>
                    <div className="relative">
                      <input id="reg-password" {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        className="input-glass pr-11" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{errors.password.message}</p>}
                  </div>

                  <button type="button" onClick={goNext} className="btn-gradient w-full">
                    Continue →
                  </button>
                </>
              )}

              {/* Step 1 — Workspace */}
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="workspaceName" className="field-label">
                      <Building2 size={14} style={{ color: 'var(--color-secondary)' }} />
                      Workspace name
                    </label>
                    <input id="workspaceName" {...register('workspaceName')} placeholder="Acme Corp"
                      className="input-glass" autoFocus />
                    {errors.workspaceName && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{errors.workspaceName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="workspaceSlug" className="field-label">
                      <Globe size={14} style={{ color: 'var(--color-secondary)' }} />
                      Workspace URL slug
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        fs/
                      </span>
                      <input id="workspaceSlug" {...register('workspaceSlug')} placeholder="acme-corp"
                        className="input-glass pl-9" autoComplete="off" />
                    </div>
                    {errors.workspaceSlug
                      ? <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>{errors.workspaceSlug.message}</p>
                      : <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>Lowercase letters, numbers, and hyphens only</p>
                    }
                  </div>

                  {serverError && (
                    <div className="p-4 rounded-xl flex items-start gap-3" role="alert"
                      style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
                      <AlertCircle size={17} style={{ color: 'var(--color-danger)' }} className="flex-shrink-0 mt-0.5" />
                      <p className="text-sm" style={{ color: '#fca5a5' }}>{serverError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                      ← Back
                    </button>
                    <button type="submit" id="register-submit" disabled={isSubmitting || success}
                      className="btn-gradient flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? <><span className="spinner spinner-sm" />Creating...</> : 'Create workspace'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Already have a workspace?{' '}
          <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-secondary)' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
