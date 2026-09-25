// components/charts/WorkgroupCharts.tsx
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { ChartConfiguration, TooltipItem } from 'chart.js';
import type { WorkgroupMonthlyStats } from '../../types/meetings';
import styles from '../../styles/charts/WorkgroupCharts.module.css';

type ChartKind = 'decisions' | 'actions';

const COLORS: Record<ChartKind, { current: string; last: string }> = {
  decisions: { current: 'rgba(53, 162, 235, 0.8)', last: 'rgba(53, 162, 235, 0.4)' },
  actions: { current: 'rgba(75, 192, 192, 0.8)', last: 'rgba(75, 192, 192, 0.4)' },
};

function buildConfig(stats: WorkgroupMonthlyStats, kind: ChartKind): ChartConfiguration<'bar'> {
  const { workgroups, monthNames } = stats;
  const series = stats[kind];
  const colors = COLORS[kind];

  return {
    type: 'bar',
    data: {
      labels: workgroups,
      datasets: [
        { label: monthNames.current, data: series.current, backgroundColor: colors.current },
        { label: monthNames.last, data: series.last, backgroundColor: colors.last },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            title: (context: TooltipItem<'bar'>[]) => workgroups[context[0].dataIndex],
            label: (context: TooltipItem<'bar'>) => {
              const value = context.parsed.y || 0;
              return `${context.dataset.label}: ${value} ${value === 1 ? 'item' : 'items'}`;
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  };
}

/** Creates a bar chart on the canvas and rebuilds it whenever the stats change. */
const useStatsChart = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stats: WorkgroupMonthlyStats,
  kind: ChartKind
) => {
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, buildConfig(stats, kind));
    return () => chart.destroy();
  }, [canvasRef, stats, kind]);
};

const sum = (values: number[]) => values.reduce((total, count) => total + count, 0);

interface WorkgroupChartsProps {
  /** Pre-computed on the server by buildWorkgroupMonthlyStats. */
  stats: WorkgroupMonthlyStats;
}

const WorkgroupCharts: React.FC<WorkgroupChartsProps> = ({ stats }) => {
  const decisionsChartRef = useRef<HTMLCanvasElement>(null);
  const actionsChartRef = useRef<HTMLCanvasElement>(null);
  const { decisions, actions, monthNames } = stats;

  useStatsChart(decisionsChartRef, stats, 'decisions');
  useStatsChart(actionsChartRef, stats, 'actions');

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Decisions by Workgroup</h2>
        <div className={styles.chartMeta}>
          <span>Comparing {monthNames.current} ({sum(decisions.current)}) vs {monthNames.last} ({sum(decisions.last)})</span>
        </div>
        <div className={styles.chart}>
          <canvas ref={decisionsChartRef} />
        </div>
      </div>
      <div className={styles.chartContainer}>
        <h2>Action Items by Workgroup</h2>
        <div className={styles.chartMeta}>
          <span>Comparing {monthNames.current} ({sum(actions.current)}) vs {monthNames.last} ({sum(actions.last)})</span>
        </div>
        <div className={styles.chart}>
          <canvas ref={actionsChartRef} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(WorkgroupCharts);
