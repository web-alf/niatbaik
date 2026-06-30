// View-level error boundary. Ported from app.jsx ViewErrorBoundary so one bad view
// doesn't blank the whole admin shell.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || 'Terjadi kesalahan' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('View error:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <div className="font-bold text-rose-700">Halaman gagal dimuat</div>
          <div className="mt-1 text-sm text-rose-600">{this.state.message}</div>
          <button onClick={() => location.reload()} className="mt-4 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold">
            Muat ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
