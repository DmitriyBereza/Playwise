'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}>😿</span>
          <h2 style={{ fontFamily: 'Comfortaa, cursive', margin: '0 0 12px' }}>
            {this.props.fallbackTitle || 'Oops! Something went wrong'}
          </h2>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#d8f1da',
              border: '2px solid #b7dfbb',
              borderRadius: 999,
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {this.props.retryLabel || 'Try again'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
