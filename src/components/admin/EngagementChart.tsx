import { useState, useEffect } from 'react';
import { Skeleton } from '../ui';
import { getEngagementData } from '../../services/adminService';
import { BarSeriesChart } from './BarSeriesChart';

interface EngagementChartProps {
  days: number;
}

export function EngagementChart({ days }: EngagementChartProps) {
  const [data, setData] = useState<{
    joinsByDate: Record<string, number>;
    messagesByDate: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getEngagementData(days).then((d) => {
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
      title="Engagement"
      dates={dates}
      series={[
        {
          key: 'joins',
          label: 'Join requests',
          colorClass: 'bg-blue',
          values: dates.map((d) => data?.joinsByDate[d] ?? 0),
        },
        {
          key: 'messages',
          label: 'Messages',
          colorClass: 'bg-success',
          values: dates.map((d) => data?.messagesByDate[d] ?? 0),
        },
      ]}
      emptyText="No join requests or messages in this range"
    />
  );
}
