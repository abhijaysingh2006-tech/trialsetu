'use client';

import React, { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, GaugeChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([BarChart, LineChart, PieChart, GaugeChart, ScatterChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, VisualMapComponent, TitleComponent, CanvasRenderer]);

export const PALETTE = ['#1d7a69', '#e69a14', '#4bb39c', '#c2410c', '#80cfbb', '#64748b', '#0ea5e9', '#8b5cf6'];

/** High-performance ECharts wrapper with resize handling, lazy updates, and deep option diffing. */
function EChartComponent({ option, height = 260, onClick }: { option: EChartsOption; height?: number; onClick?: (p: { name: string; seriesName?: string; data?: unknown }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const prevOptionJson = useRef<string>('');

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    inst.current = chart;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        chart.resize();
      }, 50);
    });
    ro.observe(ref.current);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
      chart.dispose();
      inst.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = inst.current;
    if (!chart) return;
    try {
      const optionJson = JSON.stringify(option);
      if (optionJson === prevOptionJson.current) return;
      prevOptionJson.current = optionJson;
      chart.setOption(
        { color: PALETTE, textStyle: { fontFamily: 'Inter, Segoe UI, sans-serif' }, ...option },
        { notMerge: false, lazyUpdate: true }
      );
    } catch {
      // In case of circular reference or unexpected object
      chart.setOption({ color: PALETTE, textStyle: { fontFamily: 'Inter, Segoe UI, sans-serif' }, ...option }, { notMerge: false, lazyUpdate: true });
    }
  }, [option]);

  useEffect(() => {
    const c = inst.current;
    if (!c || !onClick) return;
    const h = (p: unknown) => onClick(p as { name: string });
    c.on('click', h);
    return () => { c.off('click', h); };
  }, [onClick]);

  return <div ref={ref} style={{ height, width: '100%' }} />;
}

export const EChart = memo(EChartComponent);

