import { ThemeConfig, ThemeMode } from '../types';

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  'light': {
    id: 'light',
    name: 'Executive Light Mode',
    badge: 'Clean Enterprise Slate (Default)',
    tagline: 'Crisp slate canvas with pure white elevated surfaces, deep charcoal typography, and sharp indigo/blue accents.',
    description: 'Engineered for executive clarity, daytime laptop planning, and clean printable trade decks. Features high-contrast slate typography (#0F172A), pure white cards (#FFFFFF) with crisp 1px borders (#E2E8F0), royal indigo/blue accents, and emerald margin indicators.',
    contrastRatio: '16.8:1 (WCAG AAA Certified)',
    bestFor: 'Executive FMCG planning, B2B joint business planning, category review presentations, printable exports',
    palette: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      accent: '#2563EB',
      border: '#E2E8F0',
      liftGreen: '#059669',
    },
  },
  'dark': {
    id: 'dark',
    name: 'Obsidian Dark Mode',
    badge: 'Deep Tech & Monospace Focus',
    tagline: 'Deep obsidian canvas with charcoal cards, radiant white typography, and luminous precision accents.',
    description: 'Designed for focus sessions, late-night financial modeling, and trading room reviews. Combines deep graphite surfaces (#090D16 / #111726) with crisp cool-slate borders (#1E293B), luminous white headers (#F8FAFC), and vibrant emerald margin metrics.',
    contrastRatio: '15.9:1 (WCAG AAA Certified)',
    bestFor: 'Trading room modeling, high-density data reviews, eye-comfort night planning',
    palette: {
      bg: '#090D16',
      card: '#111726',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      accent: '#3B82F6',
      border: '#1E293B',
      liftGreen: '#10B981',
    },
  }
};
