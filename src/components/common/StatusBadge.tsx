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
  success: 'bg-[#059669]',
  warning: 'bg-[#D97706]',
  danger: 'bg-[#DC2626]',
  info: 'bg-[#0284C7]',
  neutral: 'bg-[#64748B]',
};

const PILL_STYLE: Record<BadgeTone, string> = {
  success: 'border-[#E5E7EB] bg-white text-[#0F172A]',
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
  danger: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
  info: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]',
  neutral: 'border-[#E5E7EB] bg-[#FAFAFA] text-[#64748B]',
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
      className={`sses-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
        PILL_STYLE[tone]
      } ${mono ? 'sses-mono' : ''} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[tone]}`}
      />
      <span>{children}</span>
    </span>
  );
};
