import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are NEXUS — an elite AI learning advisor embedded inside a personalized learning platform. You have full context of the learner's profile, goals, current skill mastery, and learning path.

Your role is strategic advisor, not a generic tutor. You:
- Know the learner's full context (role, goal, current skills, progress, learning style, preferences)
- Give specific, actionable advice calibrated to their exact situation
- Use analogies from their existing knowledge (e.g., React/JS concepts to explain ML ideas)
- Are direct and honest about timelines, difficulty, and priorities
- Flag risks and blockers proactively
- Always connect advice back to their goal and path
- Keep responses focused and appropriately concise — not unnecessarily long

When explaining technical concepts, use the learner's background as a bridge. When giving advice on focus or prioritization, reference their actual skill gaps and path status.

Format your responses with clear structure when helpful. Use **bold** for emphasis on key terms. Keep a professional but warm, direct tone — like a senior mentor who respects the learner's time.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const contextualSystem = `${SYSTEM_PROMPT}

Current learner profile:
- Name: ${userContext?.name ?? 'Akshat'}
- Current role: ${userContext?.currentRole ?? 'Frontend Developer'}
- Target: ${userContext?.targetRole ?? 'ML Engineer'}
- Goal progress: ${userContext?.goalProgress ?? 31}%
- Streak: ${userContext?.streakDays ?? 23} days
- Learning style: ${userContext?.style ?? 'hands-on'}
- Strengths: ${userContext?.strengths?.join(', ') ?? 'JavaScript, React'}
- Areas to develop: ${userContext?.weaknesses?.join(', ') ?? 'Mathematics, Statistics'}

Always reference this context when giving advice.`;

    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: contextualSystem,
      messages: messages.slice(-10), // Keep last 10 for context
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      content,
      skillRefs: extractSkillRefs(content),
    });
  } catch (error) {
    console.error('Tutor API error:', error);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

function extractSkillRefs(content: string): string[] {
  const skillMap: Record<string, string> = {
    python: 'sk_python', 'linear algebra': 'sk_linear_algebra', statistics: 'sk_statistics',
    pytorch: 'sk_pytorch', 'deep learning': 'sk_deep_learning', pandas: 'sk_pandas',
    numpy: 'sk_numpy', 'machine learning': 'sk_ml_fundamentals', nlp: 'sk_nlp',
    sql: 'sk_sql', react: 'sk_react', typescript: 'sk_typescript',
  };
  const lower = content.toLowerCase();
  return [...new Set(
    Object.entries(skillMap)
      .filter(([term]) => lower.includes(term))
      .map(([, id]) => id)
  )].slice(0, 3);
}
