import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full p-8 rounded-2xl shadow-lg border border-coral-500/30 text-center">
            <div className="w-14 h-14 bg-red-50 text-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-coastal-900 mb-2">Component Failed to Render</h2>
            <p className="text-sm text-coastal-600 mb-4">
              A safe error boundary caught an exception instead of showing a blank screen.
            </p>
            <div className="bg-beach-200/80 p-3 rounded-lg text-left text-xs text-red-700 font-mono overflow-x-auto mb-6 max-h-36">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-seafoam-700 text-white font-semibold text-sm hover:bg-seafoam-800 transition-all shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Component
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
