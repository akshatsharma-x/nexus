import { NextResponse } from 'next/server';
import { isTutorAiEnabled } from '@/lib/tutor-ai';

/**
 * Reports whether the tutor can actually reach the model, so the UI can tell
 * AI mode apart from offline mode instead of always claiming to be live. Uses
 * the same switch the tutor route enforces: off unless a key and
 * TUTOR_AI_ENABLED=true are both set.
 *
 * Returns a boolean only — never the key, its length, or any prefix.
 *
 * Route Handlers are not cached by default in this Next version (and Cache
 * Components is not enabled), so this is evaluated per request.
 */
export async function GET() {
  return NextResponse.json({ available: isTutorAiEnabled() });
}
