import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const downloadLogs = (data: string, filename: string = 'logs.csv') => {
  if (!data || data.length === 0) {
    alert('Data is empty. Nothing to download.');
    return;
  }

  const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatLogs = (logs: Record<string, number>[]): string => {
  if (logs.length === 0) {
    return '';
  }

  const header = Object.keys(logs[0]).join(',');
  const rows = logs.map((log) => Object.values(log).join(',')).join('\n');

  return `${header}\n${rows}`;
};

export const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
};
