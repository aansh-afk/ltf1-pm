import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../../../convex/_generated/api';
import { getCapturedErrors } from '../utils/consoleCapture';
import { captureScreenshot } from '../utils/screenshotCapture';
import { useStepRecorder, type RecordedStep } from './useStepRecorder';
import type { Id } from '../../../../convex/_generated/dataModel';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface BugFormData {
  title: string;
  description: string;
  severity: Severity;
}

export function useBugReporter() {
  const { user } = useUser();
  const generateUploadUrl = useMutation(api.bugReports.generateUploadUrl);
  const submitBugReport = useMutation(api.bugReports.submitBugReport);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<BugFormData>({
    title: '',
    description: '',
    severity: 'medium',
  });
  const [screenshots, setScreenshots] = useState<Blob[]>([]);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const stepRecorder = useStepRecorder();

  const open = useCallback(() => {
    setIsOpen(true);
    setStep(0);
    setFormData({ title: '', description: '', severity: 'medium' });
    setScreenshots([]);
    setScreenshotUrls((prev) => { prev.forEach(URL.revokeObjectURL); return []; });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    stepRecorder.stop();
    screenshotUrls.forEach(URL.revokeObjectURL);
    setScreenshotUrls([]);
    setScreenshots([]);
  }, [stepRecorder, screenshotUrls]);

  const takeScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      const blob = await captureScreenshot();
      setScreenshots((prev) => [...prev, blob]);
      setScreenshotUrls((prev) => [...prev, URL.createObjectURL(blob)]);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const removeScreenshot = useCallback((index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const startRecording = useCallback(() => {
    setIsOpen(false);
    stepRecorder.start();
  }, [stepRecorder]);

  const stopRecording = useCallback(() => {
    stepRecorder.stop();
    setIsOpen(true);
  }, [stepRecorder]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Upload screenshots
      const screenshotIds: Id<"_storage">[] = [];
      for (const blob of screenshots) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type },
          body: blob,
        });
        const { storageId } = await res.json();
        screenshotIds.push(storageId);
      }

      await submitBugReport({
        userId: user?.id,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        userName: user?.fullName ?? undefined,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        url: window.location.href,
        browserInfo: navigator.userAgent,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        consoleErrors: getCapturedErrors(),
        screenshotIds,
        recordedSteps: stepRecorder.steps,
      });

      close();
      return true;
    } catch (err) {
      console.error('Failed to submit bug report:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [screenshots, formData, user, stepRecorder.steps, generateUploadUrl, submitBugReport, close]);

  return {
    isOpen,
    step,
    setStep,
    formData,
    setFormData,
    screenshots,
    screenshotUrls,
    isSubmitting,
    isCapturing,
    isRecording: stepRecorder.isRecording,
    recordedSteps: stepRecorder.steps,
    open,
    close,
    takeScreenshot,
    removeScreenshot,
    startRecording,
    stopRecording,
    submit,
  };
}
