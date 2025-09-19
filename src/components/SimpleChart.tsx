import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface SimpleChartProps {
  data: Array<{ time: number; value: number }>;
  isDarkMode: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, isDarkMode }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

      console.log('Creating chart with data:', data);
      console.log('Data sample:', data[0]);

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: isDarkMode ? '#1e293b' : '#ffffff' },
          textColor: isDarkMode ? '#e2e8f0' : '#1f2937',
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      console.log('Chart created successfully:', chart);
      console.log('Chart methods available:', Object.getOwnPropertyNames(chart));
      console.log('Chart prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chart)));

      // Check if addLineSeries exists
      if (typeof chart.addLineSeries === 'function') {
        const lineSeries = chart.addLineSeries({
          color: isDarkMode ? '#3b82f6' : '#2563eb',
          lineWidth: 2,
        });
        console.log('Line series created:', lineSeries);
        lineSeries.setData(data);
      } else {
        console.error('addLineSeries method not found on chart object');
        console.log('Available methods:', Object.getOwnPropertyNames(chart));
      }

      return () => {
        chart.remove();
      };
    } catch (error) {
      console.error('Error in SimpleChart:', error);
    }
  }, [data, isDarkMode]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full h-96 rounded-lg overflow-hidden" />
    </div>
  );
};

export default SimpleChart;
