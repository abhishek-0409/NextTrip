import { useState } from 'react';
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'accent';
}) {
  const cls = {
    default: 'badge-neutral',
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    primary: 'badge-primary',
    accent:  'badge-accent',
  }[tone];
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function Card({
  children,
  className = '',
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} style={style}>
      {children}
    </div>
  );
}

export function Spinner({ size = 36 }: { size?: number }) {
  return (
    <div
      className="spinner"
      aria-label="Loading"
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="loading-state">
      <Spinner />
      {message && <p className="muted" style={{ fontSize: '.875rem', marginTop: 8 }}>{message}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <p className="error-title">Something went wrong</p>
      <p className="error-desc">{message}</p>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry} style={{ marginTop: 4 }}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  action,
  icon = '📭',
  title,
}: {
  message: string;
  action?: ReactNode;
  icon?: string;
  title?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      {title && <p className="empty-title">{title}</p>}
      <p className="empty-desc">{message}</p>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'primary'> = {
    confirmed:        'success',
    completed:        'success',
    approved:         'success',
    published:        'success',
    active:           'success',
    pending:          'warning',
    pending_approval: 'warning',
    draft:            'default',
    cancelled:        'danger',
    rejected:         'danger',
    failed:           'danger',
    open:             'primary',
  };
  return <Badge tone={tone[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const tone: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    paid:     'success',
    partial:  'warning',
    pending:  'default',
    refunded: 'danger',
    failed:   'danger',
  };
  const label: Record<string, string> = {
    paid:     'Paid',
    partial:  'Partial Paid',
    pending:  'Payment Pending',
    refunded: 'Refunded',
    failed:   'Payment Failed',
  };
  return <Badge tone={tone[status] ?? 'default'}>{label[status] ?? status.replace(/_/g, ' ')}</Badge>;
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: 'contents' }}>
            <div className={`step-item ${done ? 'done' : active ? 'active' : ''}`}>
              <div className={`step-dot ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-connector ${done ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StarRating({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || value) ? 'filled' : ''}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'teal',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
}) {
  return (
    <div className={`stat-card ${color}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export function SectionHeader({
  label,
  title,
  desc,
  action,
}: {
  label?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40 }}>
      <div>
        {label && (
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 24, height: 2, background: 'var(--primary)', borderRadius: 2 }} />
            {label}
          </div>
        )}
        <h2 className="section-heading">{title}</h2>
        {desc && <p className="section-sub2" style={{ marginTop: 6 }}>{desc}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  size = 36,
  bg = 'var(--primary)',
}: {
  name?: string | null;
  size?: number;
  bg?: string;
}) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.35,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
