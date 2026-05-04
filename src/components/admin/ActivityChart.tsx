import { useState, useEffect } from 'react';
import { Skeleton } from '../ui';
import { getGrowthData } from '../../services/adminService';
import { BarSeriesChart } from './BarSeriesChart';

interface ActivityChartProps {
  days?: number;
}

export function ActivityChart({ days = 14 }: ActivityChartProps) {
  const [data, setData] = useState<{
    usersByDate: Record<string, number>;
    eventsByDate: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getGrowthData(days).then((d) => {
      setData(d);
      setIsLoading(false);
    });
  }, [days]);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return (
    <BarSeriesChart
      title="Activity"
      dates={dates}
      series={[
        {
          key: 'users',
          label: 'New users',
          colorClass: 'bg-coral',
          values: dates.map((d) => data?.usersByDate[d] ?? 0),
        },
        {
          key: 'events',
          label: 'New events',
          colorClass: 'bg-purple',
          values: dates.map((d) => data?.eventsByDate[d] ?? 0),
        },
      ]}
      emptyText="No new users or events in this range"
    />
  );
}
