import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { WeekPromotion, Product } from '../types';
import { formatAud } from '../utils/formatters';
import { PieChart, Info } from 'lucide-react';

interface CategorySunburstChartProps {
  promotions: WeekPromotion[];
  products: Product[];
}

export const CategorySunburstChart: React.FC<CategorySunburstChartProps> = ({
  promotions,
  products,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    name: string;
    value: number;
    category?: string;
    quarter?: string;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);

  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.sku, p));

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll('*').remove();

    const width = 460;
    const height = 460;
    const radius = Math.min(width, height) / 2 - 20;

    // Build hierarchical data structure
    // Root -> Category -> Quarter -> Value (Revenue AUD)
    const categoryMap = new Map<string, Map<string, number>>();

    promotions.forEach(promo => {
      const prod = productMap.get(promo.heroSku);
      const cat = prod?.category || 'General Merchandise';
      const q = promo.quarter || 'Q1';
      const rev = promo.projectedRevenueAud || 0;

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, new Map<string, number>());
      }
      const qMap = categoryMap.get(cat)!;
      qMap.set(q, (qMap.get(q) || 0) + rev);
    });

    const rootData: { name: string; children: any[] } = {
      name: 'Total Portfolio',
      children: []
    };

    let totalPortfolioRevenue = 0;

    categoryMap.forEach((qMap, cat) => {
      const catChildren: any[] = [];
      let catTotal = 0;
      qMap.forEach((rev, quarter) => {
        catTotal += rev;
        totalPortfolioRevenue += rev;
        catChildren.push({
          name: quarter,
          value: rev,
          category: cat,
          quarter: quarter
        });
      });

      rootData.children.push({
        name: cat,
        children: catChildren,
        value: catTotal
      });
    });

    if (totalPortfolioRevenue === 0) {
      d3.select(containerRef.current)
        .append('div')
        .attr('class', 'flex items-center justify-center h-full text-slate-500 text-xs')
        .text('No promotional revenue data available for sunburst chart.');
      return;
    }

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('viewBox', `0 -${width / 2} ${width} ${width}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('max-height', '420px')
      .style('overflow', 'visible');

    const hierarchy = d3.hierarchy(rootData)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const root = d3.partition<any>()
      .size([2 * Math.PI, radius])(hierarchy);

    // Color scales for categories
    const categoryNames = rootData.children.map(c => c.name);
    const colorScale = d3.scaleOrdinal<string>()
      .domain(categoryNames)
      .range(['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4']);

    const arc = d3.arc<any>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => Math.max(0, d.y0))
      .outerRadius(d => Math.max(0, d.y1 - 1));

    // Draw arcs
    const path = svg.append('g')
      .selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .join('path')
      .attr('fill', d => {
        let currentNode = d;
        while (currentNode.depth > 1 && currentNode.parent) {
          currentNode = currentNode.parent;
        }
        const baseColor = colorScale(currentNode.data.name);
        if (d.depth === 1) return baseColor;
        // Lighter shade for quarter rings
        return d3.color(baseColor)?.brighter(0.3).toString() || baseColor;
      })
      .attr('fill-opacity', 0.85)
      .attr('d', arc)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 1)
          .attr('transform', 'scale(1.02)');

        const percentage = totalPortfolioRevenue > 0 
          ? Number((((d.value || 0) / totalPortfolioRevenue) * 100).toFixed(1))
          : 0;

        const catName = d.depth === 1 ? d.data.name : d.data.category;
        const qName = d.depth === 2 ? d.data.quarter : undefined;

        const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        setTooltip({
          visible: true,
          name: d.data.name,
          value: d.value || 0,
          category: catName,
          quarter: qName,
          percentage,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      })
      .on('mousemove', function(event) {
        const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        setTooltip(prev => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('fill-opacity', 0.85)
          .attr('transform', 'scale(1)');
        setTooltip(null);
      });

    // Add labels for level 1 (categories)
    const label = svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().filter(d => d.depth === 1 && (d.x1 - d.x0) > 0.2))
      .join('text')
      .attr('transform', d => {
        const x = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.data.name.length > 12 ? d.data.name.slice(0, 10) + '...' : d.data.name);

    // Center total revenue label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.4em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('TOTAL PORTFOLIO');

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('fill', '#f8fafc')
      .attr('font-size', '13px')
      .attr('font-weight', '900')
      .text(formatAud(totalPortfolioRevenue));

  }, [promotions, products]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <span>52-Week Category & Quarterly Sunburst Distribution</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive D3 radial hierarchy mapping promotional revenue across department categories and Q1–Q4 cycles.
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Hover arcs for breakdown</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[400px] flex items-center justify-center relative">
        {/* Tooltip Overlay */}
        {tooltip && tooltip.visible && (
          <div 
            className="absolute z-30 pointer-events-none bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white backdrop-blur-md"
            style={{ 
              left: Math.min(320, Math.max(10, tooltip.x - 70)), 
              top: Math.max(10, tooltip.y - 85) 
            }}
          >
            <div className="font-bold text-amber-400">
              {tooltip.quarter ? `${tooltip.category} (${tooltip.quarter})` : tooltip.name}
            </div>
            <div className="text-slate-300">
              Revenue: <span className="font-mono font-bold text-emerald-400">{formatAud(tooltip.value)} AUD</span>
            </div>
            <div className="text-slate-300">
              Share of Portfolio: <span className="font-mono font-bold text-blue-300">{tooltip.percentage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 w-full">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span>Inner Ring: Department Categories</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span>Outer Ring: Quarterly Cycles (Q1–Q4)</span>
        </div>
      </div>
    </div>
  );
};
