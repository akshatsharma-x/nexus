'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Copy } from 'lucide-react';
import { SKILL_PASSPORT, SKILLS } from '@/lib/data/seed';
import { skillLevelColor, skillLevelLabel, rarityColor } from '@/lib/utils';

export default function PassportPage() {
  const passport = SKILL_PASSPORT;

  return (
    <div className="max-w-4xl">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Skill Passport · v{passport.version}
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Akshat Sharma
        </h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520 }}>
          {passport.summary}
        </p>

        <div className="flex items-center gap-5 mb-5">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--accent-green)' }}>
            <CheckCircle size={12} />
            {passport.verifiedSkills.length} verified skills
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {passport.badges.length} badges earned
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: 'var(--accent-violet)', color: 'white' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ExternalLink size={12} /> Share Passport
          </motion.button>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            whileHover={{ scale: 1.02 }}
          >
            <Copy size={12} /> Copy Link
          </motion.button>
        </div>
      </div>

      {/* ── Verified skills ──────────────────────────────────────────────── */}
      <div className="mb-10 pb-10" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Verified skills
        </div>

        <div className="space-y-0">
          {passport.verifiedSkills.map((vs, i) => {
            const skill = SKILLS.find(s => s.id === vs.skillId);
            if (!skill) return null;
            const color = skillLevelColor(vs.level);

            return (
              <motion.div
                key={vs.skillId}
                className="flex items-center gap-4 py-3.5"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {/* Score */}
                <div className="w-12 text-right flex-shrink-0">
                  <div className="text-lg font-bold" style={{ color }}>{vs.score}%</div>
                </div>

                {/* Bar */}
                <div className="w-28 flex-shrink-0">
                  <div className="h-[3px] rounded-full" style={{ background: 'var(--border-subtle)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${vs.score}%` }}
                      transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                    />
                  </div>
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {skill.name}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color }}>{skillLevelLabel(vs.level)}</span>
                  </div>
                </div>

                {/* Evidence + date */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[10px] justify-end" style={{ color: 'var(--accent-green)' }}>
                    <CheckCircle size={9} /> {vs.evidenceCount} sources
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(vs.verifiedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Badges ───────────────────────────────────────────────────────── */}
      <div>
        <div
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Achievement badges · {passport.badges.length} earned
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {passport.badges.map((badge, i) => {
            const rColor = rarityColor(badge.rarity);
            return (
              <motion.div
                key={badge.id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer"
                style={{ background: `${rColor}08`, border: `1px solid ${rColor}25` }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.06, y: -2 }}
              >
                <div className="text-3xl">{badge.icon}</div>
                <div className="text-[10px] font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                  {badge.name}
                </div>
                <div className="text-[9px] capitalize" style={{ color: rColor }}>
                  {badge.rarity}
                </div>
              </motion.div>
            );
          })}

          {/* Locked placeholders */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`locked-${i}`}
              className="flex flex-col items-center gap-2 p-3 rounded-xl opacity-20"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="text-3xl filter grayscale">🔒</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Locked</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
