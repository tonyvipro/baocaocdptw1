import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Không thể hiển thị ứng dụng:', error, info);
    this.setState({ error, errorInfo: info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-xl w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Không thể hiển thị trang</h1>
            <p className="mt-3 text-sm text-slate-600">Đã xảy ra lỗi khi tải giao diện: <span className="font-mono text-red-600 font-bold">{this.state.error?.message}</span></p>
            {this.state.error?.stack && (
              <pre className="mt-4 p-3 bg-slate-900 text-red-400 rounded-lg text-left text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            )}
            <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">
              Tải lại trang
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
