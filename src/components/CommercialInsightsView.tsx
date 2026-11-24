import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AppTab, Product, StrategyKPIs, ThemeMode, WeekPromotion } from '../types';
import { formatAud } from '../utils/formatters';

interface CommercialInsightsViewProps {
  products: Product[];
  promotions: WeekPromotion[];
  kpis: StrategyKPIs;
  currentTheme: ThemeMode;
  onSelectTab: (tab: AppTab) => void;
  onOpenWeekStudio: (weekNum: number) => void;
  onAutoFixClashes: () => void;
  onOpenAiOptimizer: () => void;
  onOpenAddProductModal: () => void;
  onOpenPromotionBuilderWithConfig: (config: { sku: string; weekNumber?: number; discountPercent?: number }) => void;
}

type InsightFilter = 'all' | 'recovery' | 'risk' | 'conflict';

export const CommercialInsightsView: React.FC<CommercialInsightsViewProps> = ({
  products,
  promotions,
  kpis,
  currentTheme,
  onSelectTab,
  onOpenWeekStudio,
  onAutoFixClashes,
  onOpenAiOptimizer,
  onOpenAddProductModal,
  onOpenPromotionBuilderWithConfig,
}) => {
  const isLight = currentTheme.includes('light');
  const [filter, setFilter] = useState<InsightFilter>('all');

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.sku, p));
    return map;
  }, [products]);

  const insights = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'recovery' | 'risk' | 'conflict';
      badge: string;
      title: string;
      explanation: string;
      impactAud: number;
      impactText: string;
      actionText: string;
      onAction: () => void;
    }> = [];

    promotions.forEach((promo) => {
      const hero = productMap.get(promo.heroSku);
      if (!hero) return;

      if ((promo.projectedMarginPercent || 0) < 28) {
        const recovery = Math.round(((promo.projectedRevenueAud || 12000) * (28 - (promo.projectedMarginPercent || 20))) / 100);
        const suggestedDiscount = Math.max(10, (promo.mechanic?.discountValue || 25) - 5);
        items.push({
          id: `margin-risk-w${promo.weekNumber}`,
          category: 'risk',
          badge: 'Margin Risk Alert',
          title: `${hero.name} projected below 28% target margin in Week ${promo.weekNumber}`,
          explanation: `Current ${promo.mechanic?.label || 'promo'} yields ${promo.projectedMarginPercent}% gross margin. Narrowing discount to ${suggestedDiscount}% or securing scan co-op recovers lost profit.`,
          impactAud: recovery,
          impactText: `Potential recovery: +${formatAud(recovery)}`,
          actionText: `Adjust to ${suggestedDiscount}% in Promo Builder`,
          onAction: () => onOpenPromotionBuilderWithConfig({
            sku: hero.sku,
            weekNumber: promo.weekNumber,
            discountPercent: suggestedDiscount
          }),
        });
      }

      if ((promo.clashWarnings || []).length > 0) {
        const currentDisc = promo.mechanic?.discountValue || 25;
        items.push({
          id: `clash-w${promo.weekNumber}`,
          category: 'conflict',
          badge: 'Rule Spacing Conflict',
          title: `Week ${promo.weekNumber} triggers a Custom Scheduling Rule alert`,
          explanation: promo.clashWarnings[0]?.message || 'Adjacent promotional spacing requires reslotting.',
          impactAud: Math.round(promo.projectedMarginAud || 2500),
          impactText: `${promo.clashWarnings.length} clash flag${promo.clashWarnings.length > 1 ? 's' : ''}`,
          actionText: 'Reslot in Promo Builder',
          onAction: () => onOpenPromotionBuilderWithConfig({
            sku: hero.sku,
            weekNumber: promo.weekNumber,
            discountPercent: currentDisc
          }),
        });
      }
    });

    products.forEach((prod) => {
      const scheduled = promotions.some(
        (p) => p.heroSku === prod.sku || (p.secondarySkus || []).includes(prod.sku)
      );
      if (!scheduled && prod.marginPercent >= 40) {
        const upside = Math.round((prod.weeklyUnitsBaseline || 100) * prod.rrp * (prod.marginPercent / 100) * 1.35);
        items.push({
          id: `upside-${prod.sku}`,
          category: 'recovery',
          badge: 'Profit Recovery Opportunity',
          title: `Unscheduled high-margin SKU: ${prod.name}`,
          explanation: `${prod.marginPercent.toFixed(1)}% base margin with zero promotional slots currently assigned. Pre-loaded at 20% discount.`,
          impactAud: upside,
          impactText: `Est. profit upside: +${formatAud(upside)}`,
          actionText: 'Build Promotion (20% Off)',
          onAction: () => onOpenPromotionBuilderWithConfig({
            sku: prod.sku,
            weekNumber: 4,
            discountPercent: 20
          }),
        });
      }
    });

    return items.sort((a, b) => b.impactAud - a.impactAud);
  }, [products, promotions, productMap, onOpenPromotionBuilderWithConfig]);

  const visibleInsights = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter((i) => i.category === filter);
  }, [insights, filter]);

  const totalRecoverable = insights
    .filter((i) => i.category === 'recovery' || i.category === 'risk')
    .reduce((sum, i) => sum + i.impactAud, 0);

  const cardClass = isLight
    ? 'bg-white border border-[#E2E8F0] shadow-2xs'
    : 'bg-[#111726] border border-slate-800';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            Commercial Insights
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Prioritised profit recovery opportunities, margin risk alerts, and rule conflict fixes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {kpis.totalClashesCount > 0 && (
            <button
              type="button"
              onClick={onAutoFixClashes}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-Resolve Conflicts</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAiOptimizer}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Auto-Formulate Optimal Schedule
          </button>
        </div>
      </div>

      {/* Quantified Impact Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <span className="text-xs text-slate-500 block">Identified Profit Opportunity</span>
          <div className="text-2xl font-bold text-[#10B981] mt-1 tabular-nums">
            {formatAud(totalRecoverable)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Across margin fixes &amp; unscheduled SKUs</span>
        </div>
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <span className="text-xs text-slate-500 block">Margin Risk Alerts</span>
          <div className="text-2xl font-bold text-[#F59E0B] mt-1 tabular-nums">
            {insights.filter((i) => i.category === 'risk').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Promotions below 28% net margin</span>
        </div>
        <div className={`rounded-xl p-5 ${cardClass}`}>
          <span className="text-xs text-slate-500 block">Rule Spacing Conflicts</span>
          <div className="text-2xl font-bold text-[#EF4444] mt-1 tabular-nums">
            {kpis.totalClashesCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Custom hiatus &amp; category alerts</span>
        </div>
      </div>

      {/* Segmented Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 w-fit border border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: `All (${insights.length})` },
          { id: 'recovery', label: 'Profit Recovery' },
          { id: 'risk', label: 'Margin Risks' },
          { id: 'conflict', label: 'Conflicts' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as InsightFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-800 text-[#0F172A] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights List */}
      {products.length === 0 ? (
        <div className={`rounded-xl p-10 text-center space-y-3 ${cardClass}`}>
          <Lightbulb className="w-8 h-8 text-[#2563EB] mx-auto" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            Add your product range to unlock commercial insights
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once your SKUs are loaded, RangeCraft continuously highlights margin leakage, unscheduled high-margin items, and spacing conflicts.
          </p>
          <button
            type="button"
            onClick={onOpenAddProductModal}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First SKU</span>
          </button>
        </div>
      ) : visibleInsights.length === 0 ? (
        <div className={`rounded-xl p-8 text-center space-y-2 ${cardClass}`}>
          <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
          <div className={`text-sm font-semibold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
            No alerts in this category
          </div>
          <p className="text-xs text-slate-500">
            Your active promotions satisfy your margin thresholds and custom scheduling rules.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleInsights.map((ins) => (
            <div
              key={ins.id}
              className={`rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${cardClass}`}
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {ins.category === 'risk' ? (
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  ) : ins.category === 'conflict' ? (
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  )}
                  <span
                    className={
                      ins.category === 'risk'
                        ? 'text-[#EF4444]'
                        : ins.category === 'conflict'
                        ? 'text-[#F59E0B]'
                        : 'text-[#10B981]'
                    }
                  >
                    {ins.badge}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums font-bold text-[#0F172A] dark:text-white">
                    {ins.impactText}
                  </span>
                </div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  {ins.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{ins.explanation}</p>
              </div>

              <button
                type="button"
                onClick={ins.onAction}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <span>{ins.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
