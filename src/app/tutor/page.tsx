'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, User } from 'lucide-react';
import { INITIAL_AI_MESSAGES, CURRENT_USER, ACTIVE_GOAL, LEARNER_PROFILE, SKILL_MASTERIES, SKILLS } from '@/lib/data/seed';
import type { AIMessage } from '@/lib/types';

const SUGGESTED_PROMPTS = [
  'What should I focus on this week?',
  'Explain backpropagation in terms of React concepts',
  'How far am I from ML Engineer job-ready?',
  'Create a 2-week sprint plan for me',
  'Why is linear algebra important for ML?',
  'Compare PyTorch vs TensorFlow for my goals',
];

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)'
            : 'var(--bg-elevated)',
          border: isUser ? 'none' : '1px solid var(--border-subtle)',
        }}
      >
        {isUser ? (
          <User size={12} className="text-white" />
        ) : (
          <Zap size={12} style={{ color: 'var(--accent-violet-bright)' }} />
        )}
      </div>

      <div className={`max-w-[78%] ${isUser ? 'text-right' : ''}`}>
        <div
          className="rounded-xl px-4 py-2.5 text-[13px] leading-relaxed"
          style={{
            background: isUser ? 'var(--accent-violet)' : 'var(--bg-elevated)',
            border: isUser ? 'none' : '1px solid var(--border-subtle)',
            color: isUser ? 'white' : 'var(--text-primary)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {message.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
            }
            if (line === '') return <br key={i} />;
            return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
          })}
        </div>

        {message.skillRefs && message.skillRefs.length > 0 && (
          <div className={`mt-1.5 flex flex-wrap gap-1.5 ${isUser ? 'justify-end' : ''}`}>
            {message.skillRefs.map(id => {
              const skill = SKILLS.find(s => s.id === id);
              return skill ? (
                <span
                  key={id}
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--accent-violet-bright)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  {skill.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <div className="mt-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <Zap size={12} style={{ color: 'var(--accent-violet-bright)' }} />
      </div>
      <div
        className="px-4 py-3 rounded-xl"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex gap-1.5 items-center">
          {[0, 0.15, 0.3].map((delay) => (
            <motion.div
              key={delay}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent-violet-bright)' }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, delay, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TutorPage() {
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userContext: {
            name: CURRENT_USER.name,
            currentRole: LEARNER_PROFILE.currentRole,
            targetRole: ACTIVE_GOAL.title,
            goalProgress: ACTIVE_GOAL.progressPercent,
            strengths: LEARNER_PROFILE.strengths,
            weaknesses: LEARNER_PROFILE.weaknesses,
            streakDays: CURRENT_USER.streakDays,
          },
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const assistantMsg: AIMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        skillRefs: data.skillRefs,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg: AIMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: getFallbackResponse(content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function getFallbackResponse(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('focus') || q.includes('week')) {
      return `This week, your highest-leverage activity is **Pandas** — it's the direct blocker for your EDA Project, which is on your critical path.

Here's a suggested schedule for your 12h/week:
• Mon/Wed/Fri: 2h Kaggle Pandas interactive course
• Tue/Thu: 1.5h Linear Algebra videos (you're at ch. 4/15)
• Weekend: 3h Python assessment prep + practice

If you hit Pandas Beginner by Sunday, you'll be back on schedule for your August target.`;
    }
    if (q.includes('backprop') || q.includes('neural')) {
      return `Great question — thinking in React terms is actually a perfect bridge.

**Backpropagation ≈ a React re-render cycle, but for errors:**

Forward pass = rendering: data flows forward through layers, each doing a transformation (like props flowing down through components).

Loss function = the "bug report": it measures how wrong the output is.

Backward pass = React's reconciliation: starting from the error, we compute how much each weight contributed to it. This is the chain rule — how much does layer N affect the error via layer N+1?

**The chain rule analogy:** imagine each component's shouldComponentUpdate checking "did my specific input cause this error?" That cascading check, done with calculus, is backpropagation.

The key insight: once you see it as reverse-mode automatic differentiation, it's mechanically clear. The mystery disappears.`;
    }
    if (q.includes('job') || q.includes('ready') || q.includes('far')) {
      return `Based on your current profile, here's an honest assessment:

**Current readiness: ~31% toward ML Engineer minimum bar**

Your strongest transferable assets:
• React/JS expertise → translates to building ML demos, data visualizations, LLM apps
• API design → MLOps and model serving
• TypeScript discipline → Python typing and code quality

**Critical gaps to close:**
1. Python: Intermediate → Advanced (est. 40h)
2. ML Fundamentals: Novice → Advanced (est. 120h)
3. Linear Algebra + Statistics: Beginner → Intermediate (est. 100h combined)

**Realistic timeline:** 7–9 months at your current pace (12h/week, 1.3× velocity). Your biggest risk is the math track — most people underestimate it. I've scheduled it early for that reason.

You're on a good trajectory. Keep the streak.`;
    }
    return `I'm your NEXUS AI Tutor with full context of your learning journey. Based on your profile — frontend developer transitioning to ML Engineer, 31% complete, 23-day streak — I can help you with skill explanations, path strategy, learning plans, or anything else related to your goal.

What specifically would you like to explore?`;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-5xl h-[calc(100vh-7rem)] flex gap-5">

      {/* ── Context panel ────────────────────────────────────────────────── */}
      <div className="w-48 flex-shrink-0 flex flex-col gap-5 pt-1">
        <div>
          <div
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Context
          </div>
          <div className="space-y-2">
            {[
              { label: 'Learner', value: CURRENT_USER.name },
              { label: 'Goal', value: 'ML Engineer' },
              { label: 'Progress', value: `${ACTIVE_GOAL.progressPercent}%` },
              { label: 'Streak', value: `${CURRENT_USER.streakDays} days 🔥` },
              { label: 'Style', value: 'Hands-on' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[11px]">
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent-green)' }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[10px]" style={{ color: 'var(--accent-green)' }}>
              Claude Opus 5
            </span>
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Full learner context active
          </div>
        </div>
      </div>

      {/* ── Chat ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))' }}
          >
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              NEXUS Tutor
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Personalized to your learning context
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        <div
          className="px-4 py-2 flex gap-2 overflow-x-auto"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {SUGGESTED_PROMPTS.map(prompt => (
            <motion.button
              key={prompt}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px]"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
              whileHover={{ borderColor: 'rgba(124,58,237,0.5)', color: 'var(--accent-violet-bright)' }}
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div
            className="flex items-end gap-2.5 rounded-xl p-2.5"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your path, skills, concepts, or strategy..."
              rows={1}
              className="flex-1 bg-transparent text-xs resize-none"
              style={{
                color: 'var(--text-primary)',
                minHeight: '20px',
                maxHeight: '120px',
                outline: 'none',
              }}
            />
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                background: input.trim() && !isLoading ? 'var(--accent-violet)' : 'var(--bg-overlay)',
                color: input.trim() && !isLoading ? 'white' : 'var(--text-muted)',
              }}
              whileHover={input.trim() && !isLoading ? { scale: 1.08 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.92 } : {}}
            >
              <Send size={12} />
            </motion.button>
          </div>
          <div className="mt-1.5 text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
