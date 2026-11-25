import { NextResponse } from 'next/server';

/**
 * Reports whether the tutor can actually reach the model, so the UI can tell
 * AI mode apart from local fallback instead of always claiming to be live.
 *
 * Returns a boolean only — never the key, its length, or any prefix.
 *
 * Route Handlers are not cached by default in this Next version (and Cache
 * Components is not enabled), so this is evaluated per request.
 */
export async function GET() {
  return NextResponse.json({ available: !!process.env.ANTHROPIC_API_KEY });
}
