import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { Zap, Mail, Lock, Building2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Workspace slug is required'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { setTokens, setTenantSlug } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, clearErrors } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearErrors();
    setShowSuccess(false);
    try {
      const res = await api.post('/auth/login', data);
      setSuccessMessage(`Welcome back, ${data.email}!`);
      setShowSuccess(true);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setTenantSlug(data.tenantSlug);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error?.message || 'Login failed';
      let msg = 'Login failed. Please try again.';
      if (err.response?.status === 404) msg = 'Workspace not found. Check your workspace slug.';
      else if (err.response?.status === 401) msg = 'Invalid credentials. Please check your email and password.';
      else if (errorMessage.includes('Invalid credentials')) msg = 'Invalid email or password. Please try again.';
      else if (errorMessage.includes('Not a member')) msg = 'You are not a member of this workspace.';
      else if (errorMessage.includes('Workspace')) msg = 'Workspace not found. Please verify the slug.';
      setError('root', { message: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs — respects prefers-reduced-motion via CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="orb-1 absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />
        <div className="orb-2 absolute bottom-[-15%] right-[10%] w-[450px] h-[450px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)' }} />
        <div className="orb-3 absolute top-[40%] right-[-5%] w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-sm)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text"
              style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FlowSuite
            </span>
          </div>
        </div>

        {/* Success banner */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}
            role="status"
          >
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>{successMessage}</p>
              <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--color-success)' }}>Redirecting to dashboard...</p>
            </div>
          </motion.div>
        )}

        {/* Main card */}
        <div className="glass-lg p-8 mb-5">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to your workspace and continue your flow
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Workspace Slug */}
            <div>
              <label htmlFor="tenantSlug" className="field-label">
                <Building2 size={14} style={{ color: 'var(--color-secondary)' }} />
                Workspace slug
              </label>
              <input
                id="tenantSlug"
                {...register('tenantSlug')}
                placeholder="your-workspace"
                className="input-glass"
                autoComplete="organization"
                aria-describedby={errors.tenantSlug ? 'tenantSlug-error' : undefined}
              />
              {errors.tenantSlug && (
                <p id="tenantSlug-error" className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>
                  {errors.tenantSlug.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="field-label">
                <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                Email address
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="input-glass"
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="field-label">
                <Lock size={14} style={{ color: 'var(--color-secondary)' }} />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-glass pr-11"
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Root error */}
            {errors.root && (
              <div
                className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}
                role="alert"
              >
                <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>Login failed</p>
                  <p className="text-xs mt-0.5 opacity-80" style={{ color: '#fca5a5' }}>{errors.root.message}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting || showSuccess}
              className="btn-gradient w-full mt-2"
            >
              {isSubmitting ? (
                <><span className="spinner spinner-sm" />Signing in...</>
              ) : showSuccess ? (
                <><CheckCircle size={17} />Signed in!</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="divider-gradient flex-1" />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
            <div className="divider-gradient flex-1" />
          </div>

          <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Don't have a workspace?{' '}
            <Link to="/register" className="font-semibold transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-secondary)' }}>
              Create one now
            </Link>
          </p>
        </div>

        {/* Test credentials hint */}
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>📝 Test Credentials</p>
          <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <p><span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Workspace:</span> test-workspace</p>
            <p><span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Email:</span> test@example.com</p>
            <p><span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Password:</span> password123</p>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--color-text-disabled)' }}>
          Secure enterprise workspace platform
        </p>
      </motion.div>
    </div>
  );
}
