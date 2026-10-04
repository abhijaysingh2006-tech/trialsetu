'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, GaugeChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([BarChart, LineChart, PieChart, GaugeChart, ScatterChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, VisualMapComponent, TitleComponent, CanvasRenderer]);

export const PALETTE = ['#1d7a69', '#e69a14', '#4bb39c', '#c2410c', '#80cfbb', '#64748b', '#0ea5e9', '#8b5cf6'];

/** Thin ECharts wrapper (tree-shaken) with resize handling. */
export function EChart({ option, height = 260, onClick }: { option: EChartsOption; height?: number; onClick?: (p: { name: string; seriesName?: string; data?: unknown }) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    const ro = new ResizeObserver(() => inst.current?.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); inst.current?.dispose(); inst.current = null; };
  }, []);

  useEffect(() => {
    inst.current?.setOption({ color: PALETTE, textStyle: { fontFamily: 'Inter, Segoe UI, sans-serif' }, ...option }, true);
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
