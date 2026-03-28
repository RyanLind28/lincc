import { useState, useEffect } from 'react';
import { Skeleton } from '../ui';
import { getGrowthData } from '../../services/adminService';

interface ActivityChartProps {
  days?: number;
}

export function ActivityChart({ days = 14 }: ActivityChartProps) {
  const [data, setData] = useState<{ usersByDate: Record<string, number>; eventsByDate: Record<string, number> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGrowthData(days).then((d) => {
      setData(d);
      setIsLoading(false);
    });
  }, [days]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Build date labels for the last N days
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const userCounts = dates.map((d) => data?.usersByDate[d] || 0);
  const eventCounts = dates.map((d) => data?.eventsByDate[d] || 0);
  const maxVal = Math.max(...userCounts, ...eventCounts, 1);

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text text-sm">Activity (last {days} days)</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-coral" /> Users
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple" /> Events
          </span>
        </div>
      </div>

      <div className="flex items-end gap-px h-28">
        {dates.map((date, i) => {
          const userH = (userCounts[i] / maxVal) * 100;
          const eventH = (eventCounts[i] / maxVal) * 100;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-px group relative">
              <div className="w-full flex flex-col items-center gap-px">
                <div
                  className="w-full rounded-t-sm bg-coral/80 transition-all min-h-[2px]"
                  style={{ height: `${Math.max(userH, 2)}%` }}
                />
                <div
                  className="w-full rounded-b-sm bg-purple/80 transition-all min-h-[2px]"
                  style={{ height: `${Math.max(eventH, 2)}%` }}
                />
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                <div className="bg-text text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {date.slice(5)}: {userCounts[i]}u / {eventCounts[i]}e
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date labels */}
      <div className="flex justify-between mt-1.5 text-[10px] text-text-light">
        <span>{dates[0]?.slice(5)}</span>
        <span>{dates[Math.floor(dates.length / 2)]?.slice(5)}</span>
        <span>{dates[dates.length - 1]?.slice(5)}</span>
      </div>
    </div>
  );
}
