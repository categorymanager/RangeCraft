import React, { useState } from 'react';
import { X, Mail, Smartphone, Bell, Globe, Share2, FileText, CheckCircle2, Layers } from 'lucide-react';
import { ThemeMode } from '../types';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeekNum: number;
  currentTheme: ThemeMode;
  onAddActivity: (activityData: { title: string; type: string; channel: string; weekNumber: number }) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  selectedWeekNum,
  currentTheme,
  onAddActivity,
}) => {
  const isLight = currentTheme.includes('light');
  const [activeTab, setActiveTab] = useState<'digital' | 'offline'>('digital');
  const [selectedChannel, setSelectedChannel] = useState('Email Campaign');
  const [activityTitle, setActivityTitle] = useState('');

  if (!isOpen) return null;

  const digitalChannels = [
    { name: 'Email Campaign', icon: Mail, color: 'bg-blue-600 text-white' },
    { name: 'SMS', icon: Smartphone, color: 'bg-emerald-600 text-white' },
    { name: 'Pop Up', icon: Bell, color: 'bg-rose-600 text-white' },
    { name: 'Polls', icon: Globe, color: 'bg-blue-500 text-white' },
    { name: 'Social Media Update', icon: Share2, color: 'bg-purple-600 text-white' },
    { name: 'Push Notification', icon: Bell, color: 'bg-amber-500 text-slate-950 font-bold' },
    { name: 'Forms', icon: FileText, color: 'bg-indigo-600 text-white' },
    { name: 'Landing Page', icon: Layers, color: 'bg-emerald-500 text-slate-950 font-bold' },
    { name: 'Others', icon: Layers, color: 'bg-slate-700 text-white' },
  ];

  const offlineChannels = [
    { name: 'TV Ads', icon: Share2, color: 'bg-rose-500 text-white' },
    { name: 'Catalog Front Cover', icon: FileText, color: 'bg-amber-600 text-white' },
    { name: 'In-Store POS Display', icon: Layers, color: 'bg-blue-600 text-white' },
    { name: 'Radio Spot', icon: Share2, color: 'bg-purple-600 text-white' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddActivity({
      title: activityTitle || `${selectedChannel} - Week ${selectedWeekNum}`,
      type: activeTab,
      channel: selectedChannel,
      weekNumber: selectedWeekNum,
    });
    setActivityTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121316] border-[#27272a] text-slate-100'
      }`}>
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-400">Marketing Planner • Week {selectedWeekNum}</div>
            <h2 className="text-xl font-black">Add Campaign Activity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Subtabs: Digital vs Offline Activities */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('digital')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'digital' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              DIGITAL ACTIVITIES
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offline')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'offline' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              OFFLINE ACTIVITIES
            </button>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-3 gap-3">
            {(activeTab === 'digital' ? digitalChannels : offlineChannels).map((ch) => {
              const Icon = ch.icon;
              const isSelected = selectedChannel === ch.name;
              return (
                <button
                  key={ch.name}
                  type="button"
                  onClick={() => setSelectedChannel(ch.name)}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/10 ring-2 ring-blue-500/30'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ch.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">{ch.name}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Campaign Title</label>
            <input
              type="text"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              placeholder={`e.g. Easter Confectionery ${selectedChannel}`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Save & Schedule Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
