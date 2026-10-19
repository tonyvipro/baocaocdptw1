import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Không thể hiển thị ứng dụng:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Không thể hiển thị trang</h1>
            <p className="mt-3 text-sm text-slate-600">Đã xảy ra lỗi khi tải giao diện. Vui lòng tải lại trang để thử lại.</p>
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
