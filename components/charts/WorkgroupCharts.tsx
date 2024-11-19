// components/charts/WorkgroupCharts.tsx
import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { ChartConfiguration, ChartType } from 'chart.js';
import { useMeetingSummaries } from '../../context/MeetingSummariesContext';
import styles from '../../styles/charts/WorkgroupCharts.module.css';

const useChart = (canvasRef: React.RefObject<HTMLCanvasElement>, config: ChartConfiguration) => {
  useEffect(() => {
    let chartInstance: Chart | undefined;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (chartInstance) {
          chartInstance.destroy();
        }

        // Create new chart
        chartInstance = new Chart(ctx, config);
      }
    }

    // Cleanup
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [canvasRef, config]);
};

const WorkgroupCharts: React.FC = () => {
  const { summaries, getDecisions, getActionItems } = useMeetingSummaries();
  const decisionsChartRef = useRef<HTMLCanvasElement>(null);
  const actionsChartRef = useRef<HTMLCanvasElement>(null);

  // Get current and last month dates
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Helper function to check if a date is in a specific month
  const isInMonth = (dateStr: string, month: number, year: number) => {
    const date = new Date(dateStr);
    return date.getMonth() === month && date.getFullYear() === year;
  };

  // Get all unique workgroups
  const workgroups = Array.from(new Set(summaries.map(s => s.summary.workgroup)));

  // Process decisions data
  const decisions = getDecisions();
  const currentMonthDecisions = workgroups.map(workgroup => 
    decisions.filter(d => 
      d.workgroup === workgroup && 
      isInMonth(d.date, currentMonth, currentYear)
    ).length
  );
  const lastMonthDecisions = workgroups.map(workgroup => 
    decisions.filter(d => 
      d.workgroup === workgroup && 
      isInMonth(d.date, lastMonth, lastMonthYear)
    ).length
  );

  // Process action items data
  const actionItems = getActionItems();
  const currentMonthActions = workgroups.map(workgroup => 
    actionItems.filter(a => 
      a.workgroup === workgroup && 
      isInMonth(a.dueDate || '', currentMonth, currentYear)
    ).length
  );
  const lastMonthActions = workgroups.map(workgroup => 
    actionItems.filter(a => 
      a.workgroup === workgroup && 
      isInMonth(a.dueDate || '', lastMonth, lastMonthYear)
    ).length
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const decisionsConfig: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: workgroups,
      datasets: [
        {
          label: 'Current Month',
          data: currentMonthDecisions,
          backgroundColor: 'rgba(53, 162, 235, 0.8)',
        },
        {
          label: 'Last Month',
          data: lastMonthDecisions,
          backgroundColor: 'rgba(53, 162, 235, 0.4)',
        },
      ],
    },
    options: chartOptions,
  };

  const actionsConfig: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: workgroups,
      datasets: [
        {
          label: 'Current Month',
          data: currentMonthActions,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
        },
        {
          label: 'Last Month',
          data: lastMonthActions,
          backgroundColor: 'rgba(75, 192, 192, 0.4)',
        },
      ],
    },
    options: chartOptions,
  };

  // Initialize charts
  useChart(decisionsChartRef, decisionsConfig);
  useChart(actionsChartRef, actionsConfig);

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Decisions by Workgroup</h2>
        <div className={styles.chart}>
          <canvas ref={decisionsChartRef} />
        </div>
      </div>
      <div className={styles.chartContainer}>
        <h2>Action Items by Workgroup</h2>
        <div className={styles.chart}>
          <canvas ref={actionsChartRef} />
        </div>
      </div>
    </div>
  );
};

export default WorkgroupCharts;