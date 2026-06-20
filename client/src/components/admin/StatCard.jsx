import { cn } from '@/utils/cn';

/**
 * StatCard — a labeled metric tile for the dashboard overview.
 */
export function StatCard({ icon: Icon, label, value, hint, className }) {
  return (
    <div className={cn('rounded-2xl glass-panel p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-content-muted">{label}</span>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}
