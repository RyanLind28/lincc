import { Skeleton } from '../ui';

interface TopListItem {
  id: string;
  label: string;
  count: number;
  avatar?: string | null;
  icon?: string | null;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  isLoading?: boolean;
  countSuffix?: string;
  emptyText?: string;
}

export function TopList({ title, items, isLoading, countSuffix, emptyText = 'No data yet' }: TopListProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <h3 className="font-semibold text-text text-sm mb-3">{title}</h3>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">{emptyText}</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 py-1">
              <span className="w-5 text-xs text-text-muted font-mono">{i + 1}.</span>
              {item.avatar !== undefined && (
                item.avatar ? (
                  <img src={item.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center text-[10px] font-semibold text-coral">
                    {item.label.charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <span className="flex-1 text-sm text-text truncate">{item.label}</span>
              <span className="text-sm font-semibold text-text tabular-nums">
                {item.count}
                {countSuffix ? <span className="text-xs text-text-muted font-normal ml-0.5">{countSuffix}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
