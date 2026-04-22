import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const toLocalDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;

  if (DATE_ONLY_RE.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export const getLocalDateKey = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const taskDateKey = (dueDate?: string): string | undefined => {
  if (!dueDate) return undefined;
  return dueDate.slice(0, 10);
};

export const formatDate = (date: string | Date) => {
  return toLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatRelativeDate = (dateStr: string): string => {
  const date = toLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const isOverdue = (dateStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = toLocalDate(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
