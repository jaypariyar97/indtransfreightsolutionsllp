function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCsv(
  data: Record<string, unknown>[],
  fileName: string,
  columns?: string[]
): void {
  const headers = columns && columns.length > 0
    ? columns
    : Array.from(
        data.reduce((keys, row) => {
          Object.keys(row).forEach((key) => keys.add(key));
          return keys;
        }, new Set<string>())
      );

  if (headers.length === 0) {
    return;
  }

  const rows = [
    headers.map(escapeCsvValue).join(','),
    ...data.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ];

  const csv = `\uFEFF${rows.join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Temporary compatibility alias while older imports are being cleaned up.
export const exportToExcel = exportToCsv;
