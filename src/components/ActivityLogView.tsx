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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                User Activity History Tracker & Audit Trail
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {logs.length} Recorded Actions
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete audit log of every specific operational action, SKU edit, promotional change, CSV import, AI strategy run, and compliance reslot performed during this session.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAuditCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm cursor-pointer transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Audit CSV</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit actions, descriptions, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Action Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredLogs.length}</span> of {logs.length} entries
        </div>
      </div>

      {/* Activity Log Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map((log) => {
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateFormatted = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

              const getCategoryBadge = (cat: string) => {
                switch (cat.toLowerCase()) {
                  case 'catalog':
                    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  case 'promotion':
                    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  case 'ai strategy':
                    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  case 'compliance':
                    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                  case 'system':
                    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  default:
                    return 'bg-slate-800 text-slate-300 border-slate-700';
                }
              };

              return (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getCategoryBadge(log.category)}`}>
                          {log.category}
                        </span>
                        <span className="text-xs font-black text-white">{log.action}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0 self-end sm:self-center text-xs">
                    <div className="text-slate-400 font-mono text-[11px]">
                      <div>{timeFormatted}</div>
                      <div className="text-[9px] text-slate-500">{dateFormatted}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300">No activity logs found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Actions taken across the app (such as editing catalog SKUs, updating promotional weeks, running AI strategy, or exporting CSVs) will instantly appear here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
