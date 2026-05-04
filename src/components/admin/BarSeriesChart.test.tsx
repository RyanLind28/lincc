import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarSeriesChart } from './BarSeriesChart';

const mkDates = (n: number) => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

describe('BarSeriesChart', () => {
  it('renders the title and the day-range subtitle', () => {
    const dates = mkDates(7);
    render(
      <BarSeriesChart
        title="Activity"
        dates={dates}
        series={[{ key: 'a', label: 'Users', colorClass: 'bg-coral', values: [0, 1, 0, 2, 1, 3, 0] }]}
      />,
    );
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
  });

  it('shows per-series totals in the header', () => {
    render(
      <BarSeriesChart
        title="Engagement"
        dates={mkDates(3)}
        series={[
          { key: 'j', label: 'Joins', colorClass: 'bg-blue', values: [1, 2, 4] }, // total 7
          { key: 'm', label: 'Messages', colorClass: 'bg-green-500', values: [10, 5, 5] }, // total 20
        ]}
      />,
    );
    expect(screen.getByText('Joins')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('rounds the y-axis max to a nice tick value (7 → 10)', () => {
    render(
      <BarSeriesChart
        title="Test"
        dates={mkDates(5)}
        series={[{ key: 'a', label: 'A', colorClass: 'bg-coral', values: [0, 0, 0, 7, 0] }]}
      />,
    );
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders the empty-state message when every value is zero', () => {
    render(
      <BarSeriesChart
        title="Activity"
        dates={mkDates(7)}
        series={[{ key: 'a', label: 'A', colorClass: 'bg-coral', values: [0, 0, 0, 0, 0, 0, 0] }]}
        emptyText="Nothing yet"
      />,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });
});
