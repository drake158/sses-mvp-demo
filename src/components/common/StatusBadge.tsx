import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  title?: string;
  mono?: boolean;
  className?: string;
}

const DOT_COLOR: Record<BadgeTone, string> = {
  success: 'bg-status-emerald',
  warning: 'bg-status-amber',
  danger: 'bg-status-danger',
  info: 'bg-brand-accent',
  neutral: 'bg-ink-secondary',
};

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'sses-badge-success',
  warning: 'sses-badge-warning',
  danger: 'sses-badge-danger',
  info: 'sses-badge-info',
  neutral: 'sses-badge-neutral',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  children,
  title,
  mono = false,
  className = '',
}) => {
  return (
    <span
      title={title}
      className={`sses-badge ${TONE_CLASS[tone]} ${
        mono ? 'sses-mono' : ''
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[tone]}`}
      />
      <span>{children}</span>
    </span>
  );
};
