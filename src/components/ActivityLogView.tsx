import React, { useState } from 'react';
import { ActivityLogEntry } from '../types';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Tag, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Zap, 
  User, 
  Calendar 
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
  currentTheme: string;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  onClearLogs,
  currentTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = Array.from(new Set(logs.map(l => l.category)));

  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      if (!matchDesc && !matchAction && !matchCat) return false;
    }
    return true;
  });

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'Category', 'Action', 'Description', 'User'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toISOString(),
      l.category,
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
      l.userEmail || 'Guest'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RangeCraft_Audit_Trail_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
            <History className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                Activity History &amp; Audit Trail
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap tabular-nums">
                {logs.length} Recorded Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete audit log of every operational action, SKU edit, promotional change, CSV import, AI strategy run, and compliance reslot.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportAuditCsv}
            disabled={logs.length === 0}
            className="min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Export Audit CSV</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/30 cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit actions, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-h-[42px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> of {logs.length} entries
        </div>
      </div>

      {/* Activity Log Table / Cards */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLogs.map((log) => {
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateFormatted = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

              const getCategoryBadge = (cat: string) => {
                switch (cat.toLowerCase()) {
                  case 'catalog':
                    return 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
                  case 'promotion':
                    return 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
                  case 'ai strategy':
                    return 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
                  case 'compliance':
                    return 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30';
                  case 'system':
                    return 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
                  default:
                    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                }
              };

              return (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase whitespace-nowrap ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{log.action}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 break-words">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0 self-end sm:self-center text-xs">
                    <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
                      <div>{timeFormatted}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{dateFormatted}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 sm:py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No activity logs found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Actions taken across the app (such as editing catalog SKUs, updating promotional weeks, running AI strategy, or exporting CSVs) will instantly appear here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
