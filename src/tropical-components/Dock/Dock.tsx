import React from 'react';

export type DockPosition = 'top' | 'bottom' | 'left' | 'right';
export type DockVariant = 'floating' | 'anchored';

interface DockProps {
  children: React.ReactNode;
  position?: DockPosition;
  variant?: DockVariant;
  className?: string;
  style?: React.CSSProperties;
}

export const Dock: React.FC<DockProps> = ({ 
  children, 
  position = 'right', 
  variant = 'floating',
  className = '',
  style
}) => {
  return (
    <div 
      className={`dock dock-${position} dock-${variant} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface DockButtonProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  badge?: boolean;
  label?: string;
  tooltip?: string;
}

export const DockButton: React.FC<DockButtonProps> = ({
  icon,
  active,
  onClick,
  badge,
  label,
  tooltip
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div 
      className={`dock-btn ${active ? 'active' : ''}`}
      onClick={handleClick}
      title={tooltip || label}
    >
      {icon}
      {label && <span className="dock-btn-label">{label}</span>}
      {badge && <div className="dock-badge" />}
    </div>
  );
};

export const DockDivider: React.FC = () => <div className="dock-sep" />;

interface DockPanelProps {
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  width?: string | number;
  height?: string | number;
  variant?: 'floating' | 'anchored-right' | 'anchored-left';
}

export const DockPanel: React.FC<DockPanelProps> = ({
  title,
  children,
  onClose,
  width,
  height,
  variant = 'floating'
}) => {
  return (
    <div className={`dock-panel dock-panel-${variant}`} style={{ width, height }}>
      {(title || onClose) && (
        <div className="dock-panel-header">
          {title && <span className="dock-panel-title">{title}</span>}
          {onClose && (
            <button className="dock-panel-close focus-visible:ring-2 focus-visible:outline-none rounded" onClick={onClose} aria-label="Close panel">
              <i className="ti ti-x"></i>
            </button>
          )}
        </div>
      )}
      <div className="dock-panel-content">
        {children}
      </div>
    </div>
  );
};
