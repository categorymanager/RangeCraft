import React, { useState } from 'react';
import { ShieldCheck, Scale, FileText, Lock, AlertCircle, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { trackButtonClick } from '../utils/analytics';

type LegalModalTab = 'terms' | 'accc' | 'privacy' | 'refunds';

export function AustralianLegalFooter() {
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalTab | null>(null);

  const openModal = (tab: LegalModalTab) => {
    trackButtonClick(`legal_modal_${tab}`, 'australian_legal_footer');
    setActiveLegalModal(tab);
  };

  return (
    <footer className="mt-16 bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          {/* Col 1: Entity & Copyright */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>RangeCraft™</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Enterprise promotional planning, SKU margin modeling & B2B retail trade CRM for Australian consumer goods brands, distributors, and merchandisers.
            </p>
            <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
              <p>ACN: 648 912 340</p>
              <p>ABN: 48 648 912 340</p>
              <p>Registered Office: Sydney NSW 2000, Australia</p>
            </div>
          </div>

          {/* Col 2: Australian Legal Framework */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              Australian Regulatory Compliance
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  onClick={() => openModal('accc')}
                  className="hover:text-blue-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>• ACCC Two-Price & "Was/Now" Rules</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('accc')}
                  className="hover:text-blue-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>• 4-Week Promotional Hiatus Standard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('refunds')}
                  className="hover:text-blue-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>• Australian Consumer Law (ACL) Guarantees</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('privacy')}
                  className="hover:text-blue-400 transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>• Privacy Act 1988 & APPs Security</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Product Suites & Exports */}
          <div className="space-y-2.5">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Commercial Deliverables
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="text-slate-400">• 52-Week Master Commercial Plan (.xlsx)</li>
              <li className="text-slate-400">• White-Label Executive JBP Dossier (.pdf)</li>
              <li className="text-slate-400">• SKU Deletion & Capital Recovery Audit</li>
              <li className="text-slate-400">• Scan Rebate & B2B Trading Terms Calculator</li>
            </ul>
          </div>

          {/* Col 4: Legal & Security Badges */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Trust & Payment Security
            </h4>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Lock className="w-3 h-3 text-emerald-400" />
                Stripe 256-Bit SSL Encrypted
              </div>
              <p className="text-slate-400 text-[10px] leading-tight">
                All micro-checkouts and subscriptions are billed in Australian Dollars (AUD) inclusive of 10% GST where applicable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openModal('terms')}
                className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => openModal('privacy')}
                className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => openModal('refunds')}
                className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Refund Policy
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Statutory Notice */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            <p>
              © 2026 RangeCraft Pty Ltd (ACN 648 912 340 / ABN 48 648 912 340). All rights reserved.
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">
              RangeCraft™ is a registered proprietary trading platform. Designed in accordance with Schedule 2 of the Competition and Consumer Act 2010 (Cth).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              ACCC 2026 Compliant
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-blue-400 border border-slate-700 text-[10px]">
              <ShieldCheck className="w-3 h-3" />
              Australian Hosted Data
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Australian Legal Modal */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Australian Legal & Regulatory Disclosure
                  </h3>
                  <p className="text-xs text-slate-500">
                    RangeCraft AU Pty Ltd • ACN 648 912 340 • ABN 48 648 912 340
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveLegalModal('accc')}
                className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLegalModal === 'accc'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                ACCC Compliance
              </button>
              <button
                onClick={() => setActiveLegalModal('terms')}
                className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLegalModal === 'terms'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setActiveLegalModal('refunds')}
                className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLegalModal === 'refunds'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                ACL Guarantee & Refunds
              </button>
              <button
                onClick={() => setActiveLegalModal('privacy')}
                className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeLegalModal === 'privacy'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Privacy Act 1988 (APPs)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              {activeLegalModal === 'accc' && (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-semibold flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span>Mandatory 4-Week Promotional Hiatus Algorithm: </span>
                      <span className="font-normal">
                        All promotional calculations strictly enforce Australian Consumer Law guidelines against misleading two-price comparisons (Sections 18 and 29 of the ACL).
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Two-Price & "Was/Now" Advertising Standard</h4>
                  <p>
                    Under the <em>Competition and Consumer Act 2010 (Cth)</em>, retailers and suppliers must not advertise a discounted price in comparison to a "Was" or regular price unless the item was genuinely offered for sale at the higher price for a reasonable, uninterrupted period immediately prior to the promotion.
                  </p>
                  <p>
                    RangeCraft automatically audits your 52-week schedule and flags any promotion scheduled within 4 weeks of a previous discount on the same SKU or category, ensuring 100% regulatory compliance before buyer presentation.
                  </p>
                </>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <h4 className="font-bold text-slate-900 text-sm">1. Commercial License & Platform Terms</h4>
                  <p>
                    By accessing RangeCraft or purchasing export credits / subscriptions, you are granted a non-exclusive, commercial license to use generated financial models, Joint Business Planning (JBP) memos, and Excel workbooks for internal trade negotiations and category management.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">2. Proprietary Algorithms & Copyright</h4>
                  <p>
                    The RangeCraft engine, SKU deletion scoring matrices, breakeven elasticity simulators, and master calendar cadence algorithms are the exclusive intellectual property of RangeCraft Pty Ltd.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">3. Financial & Legal Disclaimer</h4>
                  <p>
                    Financial forecasts, volume lift estimations, and scan rebate calculations are analytical projections based on input parameters. Commercial outcomes may vary depending on retail buyer approval, supply chain fill rates, and macroeconomic factors.
                  </p>
                </>
              )}

              {activeLegalModal === 'refunds' && (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span>Statutory Consumer Guarantees: </span>
                      <span className="font-normal">
                        Our digital deliverables come with guarantees that cannot be excluded under Schedule 2 of the Competition and Consumer Act 2010.
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Australian Consumer Law (ACL) Statutory Rights</h4>
                  <p>
                    If an exported digital file (PDF or Excel) fails to generate or contains technical defects that prevent normal business use, you are entitled to an immediate replacement or full refund under Australian statutory consumer guarantees.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">Instant Delivery Guarantee</h4>
                  <p>
                    Upon completion of a single export unlock ($19 AUD) or Pro Subscription ($39 AUD/mo), digital assets are generated dynamically and delivered directly to your browser for immediate offline use.
                  </p>
                </>
              )}

              {activeLegalModal === 'privacy' && (
                <>
                  <h4 className="font-bold text-slate-900 text-sm">Australian Privacy Principles (APPs) Compliance</h4>
                  <p>
                    RangeCraft adheres to the <em>Privacy Act 1988 (Cth)</em> and the Australian Privacy Principles. We do not sell, rent, or commercialize your proprietary SKU costs, wholesale pricing, or retailer negotiation terms to any third party.
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">Commercial Data Confidentiality</h4>
                  <p>
                    All SKU margins, trade spend budgets, and buyer dossiers remain strictly sandboxed to your company workspace. Session tracking with Microsoft Clarity and Google Analytics 4 is anonymized and strictly used for technical reliability and drop-off diagnosis.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Governing Law: New South Wales, Australia
              </span>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
