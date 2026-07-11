import React from 'react';
import { LayoutGrid, BarChart3, Settings, User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-zinc-950 w-5 h-5" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter">LOCK.AI</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#features" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">FAQ</a>
          <button className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-lg text-sm font-black hover:bg-emerald-400 transition-colors">
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
};
