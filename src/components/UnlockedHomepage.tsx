import React from 'react';
import { motion } from 'motion/react';
import { Unlock, Zap, TrendingUp, BarChart3 } from 'lucide-react';

export default function UnlockedHomepage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-emerald-500">Unlocked Access</h1>
          <p className="text-zinc-400 mt-2">You have full access to all premium features and data.</p>
        </div>
        <Unlock className="w-16 h-16 text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard icon={Zap} title="Real-Time Data" description="Access live game data with zero latency." />
        <FeatureCard icon={TrendingUp} title="Advanced Analytics" description="Deep dive into player performance trends." />
        <FeatureCard icon={BarChart3} title="AI Projections" description="Get AI-powered insights for every game." />
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-emerald-500" />
      </div>
      <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  );
}
