import toast from 'react-hot-toast';

/**
 * Drop-in replacement for `alert()` that shows a styled toast.
 * Auto-classifies based on keywords.
 */
export function notify(message: string): void {
  const m = message.toLowerCase();
  if (/(fail|error|unable|invalid|cannot|can't|could not|wrong)/.test(m)) {
    toast.error(message);
  } else if (/(success|uploaded|saved|deleted|updated|created|marked as paid)/.test(m)) {
    toast.success(message);
  } else {
    toast(message);
  }
}

/**
 * Render form validation errors (from react-hook-form or a plain object) as
 * a single consolidated toast. Each field gets one bullet. If only one
 * field has an error, the field name is included inline.
 */
export function notifyFormErrors(
  errors: Record<string, { message?: string } | string | undefined>
): void {
  const entries = Object.entries(errors).filter(([, v]) => !!v);
  if (entries.length === 0) return;

  const messages = entries.map(([field, err]) => {
    const msg = typeof err === 'string' ? err : err?.message || 'Required';
    const label = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
    return `${label}: ${msg}`;
  });

  if (messages.length === 1) {
    toast.error(messages[0]);
  } else {
    toast.error(
      `Please fix the following:\n• ${messages.join('\n• ')}`,
      { duration: 5000, style: { whiteSpace: 'pre-line', maxWidth: 480 } }
    );
  }
}

export { toast };
