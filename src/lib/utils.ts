import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const downloadFile = (
  content: string,
  filename: string,
  type = 'text/csv;charset=utf-8'
) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const toCsvHeader = (row: object): string => Object.keys(row).join(',');

export const toCsvRows = (rows: object[]): string =>
  rows.map((row) => Object.values(row).join(',')).join('\n');

export const toCsv = (rows: object[]): string =>
  rows.length === 0 ? '' : `${toCsvHeader(rows[0])}\n${toCsvRows(rows)}`;

export const formatTime = (totalSeconds: number): string => {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;

  return [hh, mm, ss].map((n) => n.toString().padStart(2, '0')).join(':');
};
