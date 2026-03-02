import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// A helper component that throws on demand.
function ProblemChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <p>All good</p>;
}

// Suppress console.error noise from React when it logs the caught error.
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello child</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Hello child')).toBeInTheDocument();
  });

  test('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText('Oops! Something went wrong'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  test('uses custom fallbackTitle when provided', () => {
    render(
      <ErrorBoundary fallbackTitle="Custom error title">
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error title')).toBeInTheDocument();
  });

  test('uses custom retryLabel when provided', () => {
    render(
      <ErrorBoundary retryLabel="Retry now">
        <ProblemChild shouldThrow />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('button', { name: 'Retry now' }),
    ).toBeInTheDocument();
  });

  test('recovers and re-renders children after clicking the retry button', () => {
    // We use a stateful wrapper so we can stop throwing after retry.
    function Wrapper() {
      const [fail, setFail] = React.useState(true);

      return (
        <ErrorBoundary>
          {fail ? (
            <ProblemChild shouldThrow />
          ) : (
            <p>Recovered</p>
          )}
        </ErrorBoundary>
      );
    }

    // The problem with testing recovery is that ErrorBoundary resets
    // its own state, and then React re-renders the same children tree.
    // Since ProblemChild will throw again if shouldThrow is still true,
    // we need a different approach: render with a key-based reset mechanism.
    // Instead, let's directly test that clicking the button resets the
    // boundary's hasError state by having the child NOT throw on re-render.

    let throwError = true;

    function ConditionalChild() {
      if (throwError) {
        throw new Error('Boom');
      }
      return <p>Recovered successfully</p>;
    }

    render(
      <ErrorBoundary>
        <ConditionalChild />
      </ErrorBoundary>,
    );

    // Should show error UI
    expect(
      screen.getByText('Oops! Something went wrong'),
    ).toBeInTheDocument();

    // Stop throwing before clicking retry
    throwError = false;

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // After retry, children should render normally
    expect(screen.getByText('Recovered successfully')).toBeInTheDocument();
  });
});
