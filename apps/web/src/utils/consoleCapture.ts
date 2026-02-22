interface CapturedError {
  message: string;
  source?: string;
  timestamp: number;
}

const MAX_ERRORS = 20;
const capturedErrors: CapturedError[] = [];
let initialized = false;

export function initConsoleCapture() {
  if (initialized) return;
  initialized = true;

  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    const message = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    pushError({ message, source: 'console.error', timestamp: Date.now() });
    originalError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    pushError({
      message: event.message || String(event.error),
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
      timestamp: Date.now(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    pushError({ message, source: 'unhandledrejection', timestamp: Date.now() });
  });
}

function pushError(error: CapturedError) {
  capturedErrors.push(error);
  if (capturedErrors.length > MAX_ERRORS) {
    capturedErrors.shift();
  }
}

export function getCapturedErrors(): CapturedError[] {
  return [...capturedErrors];
}
