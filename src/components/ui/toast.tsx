import toast, { Toaster as HotToaster } from 'react-hot-toast';

export function showToast(message: string, type: 'success' | 'error' | 'loading' = 'success') {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'loading':
      return toast.loading(message);
    default:
      return toast(message);
  }
}

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          background: 'var(--card)',
          color: 'var(--card-foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
}
