import html2canvas from 'html2canvas';

export async function captureScreenshot(): Promise<Blob> {
  // Hide the bug reporter modal during capture
  const modals = document.querySelectorAll('[data-bug-reporter]');
  modals.forEach((el) => ((el as HTMLElement).style.display = 'none'));

  try {
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: false,
      ignoreElements: (el) => el.hasAttribute('data-bug-reporter'),
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        'image/png',
        0.8,
      );
    });
  } finally {
    modals.forEach((el) => ((el as HTMLElement).style.display = ''));
  }
}
