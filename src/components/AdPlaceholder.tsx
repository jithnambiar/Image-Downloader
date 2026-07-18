/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Info, HelpCircle } from 'lucide-react';

interface AdPlaceholderProps {
  slot?: string;
  format?: 'banner' | 'sidebar' | 'horizontal';
}

export default function AdPlaceholder({ slot = '34958209', format = 'banner' }: AdPlaceholderProps) {
  const isSidebar = format === 'sidebar';
  const isHorizontal = format === 'horizontal';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden text-center transition-all p-4 ${
        isSidebar 
          ? 'h-80 w-full max-w-xs' 
          : isHorizontal 
            ? 'h-24 w-full' 
            : 'h-36 w-full'
      }`}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-600 bg-white/80 dark:bg-slate-950/80 px-1.5 py-0.5 rounded shadow-xs">
        <span>Sponsor</span>
        <HelpCircle className="h-2.5 w-2.5" />
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          <span>Google Ad Placement</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs px-2">
          Publisher ID: <span className="font-mono text-slate-500 dark:text-slate-300">pub-8686383954199850</span>
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Slot: <span className="font-mono text-slate-500 dark:text-slate-300">{slot}</span>
        </p>
      </div>

      {/* Decorative ad outline simulation */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60"></div>
    </div>
  );
}
