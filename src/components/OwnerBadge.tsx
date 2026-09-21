import React, { useState } from 'react';

interface OwnerBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * 👑 شارة المالك الرسمية (Owner Badge)
 * تظهر بجانب اسم المالك في المنشورات، التعليقات، الملف الشخصي، والبحث.
 * تحمل عنوان "Owner" عند التمرير أو الضغط.
 */
export const OwnerBadge: React.FC<OwnerBadgeProps> = ({
  size = 'sm',
  showLabel = false,
  className = '',
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Size styling configuration
  const sizeClasses = {
    xs: 'text-[11px] px-1 py-0.2',
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  };

  const crownSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip((prev) => !prev);
    setTimeout(() => setShowTooltip(false), 2500);
    if (onClick) onClick(e);
  };

  return (
    <span
      id="badge-owner"
      title="Owner"
      aria-label="Owner"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`relative inline-flex items-center gap-0.5 rounded-full font-bold select-none cursor-pointer transition-all active:scale-95 bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40 dark:border-amber-500/40 hover:border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)] ${sizeClasses[size]} ${className}`}
    >
      <span className={`${crownSizes[size]} filter drop-shadow-[0_1px_2px_rgba(217,119,6,0.3)]`} aria-hidden="true">
        👑
      </span>
      {showLabel && (
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 font-sans">
          Owner
        </span>
      )}

      {/* Floating Tooltip upon hover/tap */}
      {showTooltip && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-slate-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg border border-amber-500/40 pointer-events-none animate-fade-in font-['Cairo'] flex items-center gap-1">
          <span>👑</span>
          <span>Owner • مالك المنصة</span>
        </span>
      )}
    </span>
  );
};
