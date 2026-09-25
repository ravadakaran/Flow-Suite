import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const features = [
    {
      icon: '📁',
      title: 'Project Management',
      description: 'Organize work into projects, set milestones, and track progress in real-time.'
    },
    {
      icon: '✅',
      title: 'Task Workflows',
      description: 'Create, assign, and manage tasks with flexible status tracking seamlessly.'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Invite members, manage roles, and keep everyone aligned with transparency.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Get insights into team productivity with beautiful visualizations.'
    },
    {
      icon: '👤',
      title: 'Customer Management',
      description: 'Keep track of customer records and manage client relationships efficiently.'
    },
    {
      icon: '📋',
      title: 'Audit Logs',
      description: 'Complete activity history with filtering and search for compliance.'
    },
  ];

  const stats = [
    { value: '10K+', label: 'Teams' },
    { value: '500K+', label: 'Tasks' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-sans)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 text-2xl font-bold" style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <Zap size={24} className="text-indigo-500" />
            FlowSuite
          </div>
          <nav className="flex gap-8 items-center">
            <a href="#features" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Features</a>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20" style={{
        background: `radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%),
                     radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)`
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl text-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <span style={{ color: 'var(--color-secondary)' }} className="text-sm font-semibold">✨ Introducing FlowSuite Pro</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{
              background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Beautiful Workspace for Your Team
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl mb-8 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Streamline projects, manage tasks, and collaborate seamlessly. Built with modern design and powerful features to keep your team moving forward.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 justify-center mb-12 flex-wrap"
          >
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
              }}
            >
              Get Started Free
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-lg font-semibold"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--color-text-primary)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 pt-12 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{stat.value}</div>
                <div className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" id="features" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.05) 100%)'
      }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Everything you need to manage projects and collaborate with your team.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-xl"
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto p-12 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Join thousands of teams using FlowSuite to ship faster and collaborate better.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 rounded-lg font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            Start Free Trial
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center" style={{
        borderColor: 'rgba(148, 163, 184, 0.1)',
        color: 'var(--color-text-muted)'
      }}>
        <p>&copy; 2026 FlowSuite. Crafted with ❤️ for amazing teams. All rights reserved.</p>
      </footer>
    </div>
  );
}
