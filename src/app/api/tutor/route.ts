import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MODEL_IDS, CONTEXT_DEPTH_SIZES, PERSONALITY_INSTRUCTIONS } from '@/lib/settings';

const DEFAULT_MODEL = 'claude-opus-5';
const DEFAULT_CONTEXT_DEPTH = 10;

const PROMPT_HEAD = `You are NEXUS — an elite AI learning advisor embedded inside a personalized learning platform. You have full context of the learner's profile, goals, current skill mastery, and learning path.

Your role is strategic advisor, not a generic tutor. You:
- Know the learner's full context (role, goal, current skills, progress, learning style, preferences)
- Give specific, actionable advice calibrated to their exact situation`;

/** Only included when the learner has Learning Analogies switched on. */
const PROMPT_ANALOGIES = `- Use analogies from their existing knowledge (e.g., React/JS concepts to explain ML ideas)`;

const PROMPT_TAIL = `- Are direct and honest about timelines, difficulty, and priorities
- Flag risks and blockers proactively
- Always connect advice back to their goal and path
- Keep responses focused and appropriately concise — not unnecessarily long`;

const PROMPT_BRIDGE_WITH_ANALOGIES = `When explaining technical concepts, use the learner's background as a bridge. When giving advice on focus or prioritization, reference their actual skill gaps and path status.`;

const PROMPT_BRIDGE_PLAIN = `When explaining technical concepts, build up from fundamentals in the learner's own terms. When giving advice on focus or prioritization, reference their actual skill gaps and path status.`;

const PROMPT_FORMAT = `Format your responses with clear structure when helpful. Use **bold** for emphasis on key terms. Keep a professional but warm, direct tone — like a senior mentor who respects the learner's time.`;

interface TutorSettings {
  aiModel?: string;
  tutorPersonality?: string;
  contextDepth?: string;
  learningAnalogies?: boolean;
}

function buildSystemPrompt(settings: TutorSettings | undefined, contextBlock: string): string {
  const analogies = settings?.learningAnalogies !== false;
  const personality = settings?.tutorPersonality
    ? PERSONALITY_INSTRUCTIONS[settings.tutorPersonality]
    : undefined;

  return [
    PROMPT_HEAD,
    analogies ? PROMPT_ANALOGIES : null,
    PROMPT_TAIL,
    '',
    analogies ? PROMPT_BRIDGE_WITH_ANALOGIES : PROMPT_BRIDGE_PLAIN,
    '',
    PROMPT_FORMAT,
    personality ? `\nTone: ${personality}` : null,
    '',
    contextBlock,
  ].filter(l => l !== null).join('\n');
}

export async function POST(req: NextRequest) {
  // Check availability before constructing the SDK client — the Anthropic
  // constructor throws without a key, which would fail the whole module.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI tutor unavailable — no API key configured', available: false },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const { messages, userContext, settings } = body as {
      messages?: unknown;
      userContext?: Record<string, unknown>;
      settings?: TutorSettings;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const turns = messages
      .filter((m): m is { role: string; content: string } =>
        !!m && typeof m === 'object'
        && typeof (m as { content?: unknown }).content === 'string'
        && ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant'))
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (turns.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const ctx = (userContext ?? {}) as Record<string, string | number | string[] | undefined>;
    const list = (v: unknown, fallback: string) =>
      Array.isArray(v) && v.length > 0 ? v.join(', ') : fallback;

    const contextBlock = `Current learner profile:
- Name: ${ctx.name ?? 'Akshat'}
- Current role: ${ctx.currentRole ?? 'Frontend Developer'}
- Target: ${ctx.targetRole ?? 'ML Engineer'}
- Goal progress: ${ctx.goalProgress ?? 31}%
- Streak: ${ctx.streakDays ?? 23} days
- Learning style: ${ctx.style ?? 'hands-on'}
- Preferred formats: ${ctx.formats ?? 'video, interactive'}
- Time available: ${ctx.weeklyHours ?? '12h'} per week
- Challenge preference: ${ctx.difficulty ?? 'moderate challenge'}
- Strengths: ${list(ctx.strengths, 'JavaScript, React')}
- Areas to develop: ${list(ctx.weaknesses, 'Mathematics, Statistics')}

Always reference this context when giving advice.`;

    // Resolve settings through the shared maps — never pass an unvalidated
    // model string or window size straight through from the client.
    const model = (settings?.aiModel && MODEL_IDS[settings.aiModel]) || DEFAULT_MODEL;
    const depth = (settings?.contextDepth && CONTEXT_DEPTH_SIZES[settings.contextDepth])
      || DEFAULT_CONTEXT_DEPTH;

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: buildSystemPrompt(settings, contextBlock),
      messages: turns.slice(-depth),
    });

    const first = response.content[0];
    const content = first && first.type === 'text' ? first.text : '';

    // Nothing usable came back — let the client fall back rather than
    // rendering an empty assistant bubble.
    if (!content) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 });
    }

    return NextResponse.json({
      content,
      skillRefs: extractSkillRefs(content),
      source: 'ai',
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
