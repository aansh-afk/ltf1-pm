import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', padding: '2rem' }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>
              SOMETHING WENT WRONG
            </h1>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', border: '2px solid currentColor', background: 'transparent', color: 'inherit', fontFamily: 'monospace', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold' }}>
              RELOAD PAGE
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
