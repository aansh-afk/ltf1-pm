import { useState, useCallback, useRef, useEffect } from 'react';

export interface RecordedStep {
  type: 'click' | 'input' | 'navigation';
  target: string;
  value?: string;
  url: string;
  timestamp: number;
}

function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el as HTMLElement).innerText?.slice(0, 50);
  const id = el.id ? `#${el.id}` : '';
  const cls = el.className && typeof el.className === 'string'
    ? `.${el.className.split(' ').slice(0, 2).join('.')}`
    : '';
  const label = text ? ` "${text}"` : '';
  return `${tag}${id}${cls}${label}`.trim();
}

export function useStepRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const listenersRef = useRef<(() => void) | null>(null);

  const start = useCallback(() => {
    setSteps([]);
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    setIsRecording(false);
    if (listenersRef.current) {
      listenersRef.current();
      listenersRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    const addStep = (step: RecordedStep) => {
      setSteps((prev) => [...prev, step]);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('[data-bug-reporter]') || target.closest('[data-recording-bar]')) return;
      addStep({
        type: 'click',
        target: describeElement(target),
        url: window.location.href,
        timestamp: Date.now(),
      });
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.closest('[data-bug-reporter]')) return;
      addStep({
        type: 'input',
        target: describeElement(target),
        value: target.type === 'password' ? '***' : target.value?.slice(0, 100),
        url: window.location.href,
        timestamp: Date.now(),
      });
    };

    const handlePopState = () => {
      addStep({
        type: 'navigation',
        target: 'page',
        url: window.location.href,
        timestamp: Date.now(),
      });
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleInput, true);
    window.addEventListener('popstate', handlePopState);

    listenersRef.current = () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('change', handleInput, true);
      window.removeEventListener('popstate', handlePopState);
    };

    return () => {
      if (listenersRef.current) {
        listenersRef.current();
        listenersRef.current = null;
      }
    };
  }, [isRecording]);

  return { isRecording, steps, start, stop };
}
