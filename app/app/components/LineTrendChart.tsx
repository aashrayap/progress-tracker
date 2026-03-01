"use client";

import { useMemo } from "react";
import { fmtDate } from "../lib/utils";

export interface TrendPoint {
  date: string;
  value: number | null;
}

interface LineTrendChartProps {
  points: TrendPoint[];
  color?: string;
  minY?: number;
  maxY?: number;
  yTicks?: number;
  emptyLabel?: string;
  valueFormatter?: (value: number) => string;
}

function pathFromPoints(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x} ${y} L ${x + 0.01} ${y}`;
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export default function LineTrendChart({
  points,
  color = "#60a5fa",
  minY,
  maxY,
  yTicks = 4,
  emptyLabel = "No data to plot yet.",
  valueFormatter,
}: LineTrendChartProps) {
  const width = 720;
  const height = 260;
  const padding = { top: 14, right: 12, bottom: 32, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const validValues = points
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number");

  const range = useMemo(() => {
    if (validValues.length === 0) {
      return { min: 0, max: 1 };
    }

    const measuredMin = Math.min(...validValues);
    const measuredMax = Math.max(...validValues);

    const derivedMin = minY ?? measuredMin;
    const derivedMax = maxY ?? measuredMax;

    if (derivedMin === derivedMax) {
      return { min: derivedMin - 1, max: derivedMax + 1 };
    }

    return { min: derivedMin, max: derivedMax };
  }, [maxY, minY, validValues]);

  const chartPoints = useMemo(() => {
    return points.map((point, index) => {
      if (point.value === null) return null;

      const ratio = (point.value - range.min) / (range.max - range.min);
      const x =
        points.length <= 1
          ? padding.left + plotWidth / 2
          : padding.left + (index / (points.length - 1)) * plotWidth;
      const y = padding.top + (1 - ratio) * plotHeight;
      return { date: point.date, value: point.value, x, y };
    });
  }, [padding.left, padding.top, plotHeight, plotWidth, points, range.max, range.min]);

  const segments = useMemo(() => {
    const grouped: Array<Array<{ x: number; y: number; date: string; value: number }>> = [];
    let current: Array<{ x: number; y: number; date: string; value: number }> = [];

    for (const point of chartPoints) {
      if (!point) {
        if (current.length > 0) grouped.push(current);
        current = [];
        continue;
      }
      current.push(point);
    }

    if (current.length > 0) grouped.push(current);
    return grouped;
  }, [chartPoints]);

  if (validValues.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-white/20 bg-zinc-900/50 text-sm text-zinc-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        {Array.from({ length: yTicks + 1 }, (_, index) => {
          const ratio = index / yTicks;
          const y = padding.top + ratio * plotHeight;
          const value = range.max - ratio * (range.max - range.min);
          return (
            <g key={`grid-${index}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="3 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.55)"
                fontSize="10"
              >
                {valueFormatter ? valueFormatter(value) : Math.round(value)}
              </text>
            </g>
          );
        })}

        {segments.map((segment, segmentIndex) => {
          const linePath = pathFromPoints(segment);
          const areaPath = `${linePath} L ${segment[segment.length - 1].x} ${padding.top + plotHeight} L ${
            segment[0].x
          } ${padding.top + plotHeight} Z`;

          return (
            <g key={`seg-${segmentIndex}`}>
              <path d={areaPath} fill={color} opacity={0.12} />
              <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
            </g>
          );
        })}

        {chartPoints.map((point, index) =>
          point ? (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="3.2"
              fill={color}
              stroke="rgba(10, 10, 10, 0.9)"
              strokeWidth="1.2"
            >
              <title>
                {fmtDate(point.date)}: {valueFormatter ? valueFormatter(point.value) : point.value}
              </title>
            </circle>
          ) : null
        )}

        <text
          x={padding.left}
          y={height - 10}
          textAnchor="start"
          fill="rgba(255,255,255,0.55)"
          fontSize="10"
        >
          {points[0] ? fmtDate(points[0].date) : ""}
        </text>
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="10"
        >
          {points[Math.floor(points.length / 2)] ? fmtDate(points[Math.floor(points.length / 2)].date) : ""}
        </text>
        <text
          x={width - padding.right}
          y={height - 10}
          textAnchor="end"
          fill="rgba(255,255,255,0.55)"
          fontSize="10"
        >
          {points[points.length - 1] ? fmtDate(points[points.length - 1].date) : ""}
        </text>
      </svg>
    </div>
  );
}
