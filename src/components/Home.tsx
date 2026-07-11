import React from 'react';
import { motion } from 'motion/react';
import { Zap, Target, Activity, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export const Home = () => {
  return (
    <>
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
          >
            Let the power of AI<br />
            <span className="text-emerald-500">improve your betting success</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            Data-driven insights, real-time analysis, and predictive modeling at your fingertips.
          </motion.p>
          <div className="flex items-center justify-center gap-4">
            <button className="bg-emerald-500 text-zinc-950 px-8 py-4 rounded-xl font-black hover:bg-emerald-400 transition-colors">
              Get Started
            </button>
            <button className="bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-xl font-black hover:bg-zinc-800 transition-colors">
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof & Stats */}
      <section className="py-12 border-y border-zinc-800 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: 'Years of Data', value: '10+' },
            { label: 'Sports Covered', value: '5' },
            { label: 'Analysis', value: '24/7' }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-16">AI & Betting</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Machine Learning', desc: 'Advanced algorithms analyzing historical data.' },
              { icon: Target, title: 'Statistical Edge', desc: 'Identify value bets with precision.' },
              { icon: Activity, title: 'Real-Time Analysis', desc: 'Live updates for informed decisions.' }
            ].map((feat, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
                <feat.icon className="w-10 h-10 text-emerald-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-zinc-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Focus */}
      <section className="py-24 bg-zinc-900/20 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black mb-6">Transparency You Can Trust</h2>
            <p className="text-zinc-400 text-lg mb-8">
              We believe in data, not hype. Our integration with Bet-Analytix allows you to track our performance in real-time, providing complete transparency into our predictive accuracy.
            </p>
            <button className="text-emerald-500 font-black flex items-center gap-2 hover:text-emerald-400">
              View Performance Stats <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl">
            <div className="aspect-video bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-700">
              [Performance Chart Screenshot]
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tables */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-16">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$29', features: ['Basic Analysis', 'Daily Picks'] },
              { name: 'Pro', price: '$79', features: ['Advanced Analysis', 'Real-time Alerts', 'Priority Support'], highlighted: true },
              { name: 'Ultimate', price: '$149', features: ['Full AI Suite', 'Custom Models', 'Dedicated Support'] }
            ].map((plan, i) => (
              <div key={i} className={cn("border p-8 rounded-3xl", plan.highlighted ? "bg-zinc-900 border-emerald-500" : "bg-zinc-900 border-zinc-800")}>
                <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                <div className="text-5xl font-black mb-8">{plan.price}<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-zinc-300"><ShieldCheck className="w-5 h-5 text-emerald-500" /> {f}</li>)}
                </ul>
                <button className={cn("w-full py-4 rounded-xl font-black transition-colors", plan.highlighted ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400" : "bg-zinc-800 hover:bg-zinc-700")}>
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-t border-zinc-800" id="faq">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How accurate are the predictions?', a: 'Our models are trained on over a decade of data, consistently outperforming market averages.' },
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time through your account settings.' }
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-zinc-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>&copy; 2026 Lock.Ai. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
};
