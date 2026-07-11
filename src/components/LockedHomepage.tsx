import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

export default function LockedHomepage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 text-center"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center">
        <Lock className="w-16 h-16 text-zinc-600 mb-6" />
        <h1 className="text-4xl font-black text-zinc-100">Locked Access</h1>
        <p className="text-zinc-400 mt-4 max-w-md">This content is currently locked. Please unlock to access premium features.</p>
      </div>
    </motion.div>
  );
}
