import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={17} className="flex-shrink-0" />,
  error:   <AlertCircle  size={17} className="flex-shrink-0" />,
  warning: <AlertCircle  size={17} className="flex-shrink-0" />,
  info:    <Info         size={17} className="flex-shrink-0" />,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
  error:   'bg-rose-500/15 border-rose-500/35 text-rose-300',
  warning: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
  info:    'bg-blue-500/15 border-blue-500/35 text-blue-300',
};

export function Toast({ message, variant = 'success', onClose }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-4 right-4 z-50 flex items-center gap-3
        px-4 py-3 rounded-xl border backdrop-blur-xl
        animate-slide-top shadow-xl max-w-sm
        ${STYLES[variant]}
      `}
    >
      {ICONS[variant]}
      <p className="text-sm font-semibold flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Hook-based toast — auto-dismisses after `duration` ms.
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('Saved!', 'success');
 *   // render: {toast}
 */
export function useToast(duration = 3000) {
  const [state, setState] = useState<{ message: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => setState(null), duration);
    return () => clearTimeout(t);
  }, [state, duration]);

  const showToast = (message: string, variant: ToastVariant = 'success') => {
    setState({ message, variant });
  };

  const toast = state ? (
    <Toast message={state.message} variant={state.variant} onClose={() => setState(null)} />
  ) : null;

  return { toast, showToast };
}
