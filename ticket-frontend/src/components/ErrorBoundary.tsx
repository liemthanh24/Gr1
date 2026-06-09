'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass p-10 rounded-2xl max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
            <p className="text-sm text-gray-400 mb-6">
              {this.state.error?.message || 'Vui lòng thử lại sau'}
            </p>
            <button className="btn-primary" onClick={() => this.setState({ hasError: false, error: undefined })}>
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
