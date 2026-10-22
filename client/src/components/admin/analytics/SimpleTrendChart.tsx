'use client';

import React from 'react';
import { useStaffTheme } from '../../../context/StaffThemeContext';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface SimpleTrendChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  type?: 'line' | 'bar';
  formatValue?: (val: number) => string;
  height?: number;
}

export const SimpleTrendChart: React.FC<SimpleTrendChartProps> = ({
  data,
  title,
  subtitle,
  type = 'line',
  formatValue = (v) => v.toLocaleString(),
  height = 200,
}) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div
        className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-xs font-mono text-[#737068] ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
        style={{ height }}
      >
        <span>No trend telemetry for selected period</span>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const chartWidth = 700;
  const paddingX = 30;
  const paddingY = 25;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Build points for line chart
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * innerWidth;
    const y = height - paddingY - (d.value / maxValue) * innerHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div
      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4
            className={`text-xs uppercase font-mono tracking-wider font-semibold ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] font-mono text-[#8E8A80] mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#B99A63] font-semibold">
            Max: {formatValue(maxValue)}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B99A63" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B99A63" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke={isDark ? '#2C2C28' : '#ECE8E1'}
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={chartWidth - paddingX}
            y2={height / 2}
            stroke={isDark ? '#2C2C28' : '#ECE8E1'}
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={chartWidth - paddingX}
            y2={height - paddingY}
            stroke={isDark ? '#3A3A35' : '#DCD6CB'}
          />

          {type === 'line' ? (
            <>
              {areaD && <path d={areaD} fill="url(#goldGradient)" />}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#B99A63"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={points.length > 20 ? 2 : 3.5}
                    fill="#1E1E1B"
                    stroke="#B99A63"
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-150"
                  />
                  <title>{`${p.label}: ${formatValue(p.value)}`}</title>
                </g>
              ))}
            </>
          ) : (
            // Bar chart
            data.map((d, i) => {
              const barWidth = Math.max(4, innerWidth / data.length - 6);
              const x = paddingX + (i / data.length) * innerWidth + 3;
              const barHeight = (d.value / maxValue) * innerHeight;
              const y = height - paddingY - barHeight;
              return (
                <g key={i} className="group cursor-pointer">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={d.value > 0 ? '#B99A63' : isDark ? '#2C2C28' : '#E5DFD3'}
                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <title>{`${d.label}: ${formatValue(d.value)}`}</title>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between items-center text-[10px] font-mono text-[#8E8A80] mt-2 pt-2 border-t border-dashed border-zinc-700/30">
        <span>{data[0]?.label}</span>
        {data.length > 2 && (
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
        )}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};
