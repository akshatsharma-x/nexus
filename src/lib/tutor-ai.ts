/**
 * Whether the tutor may call the model. Off unless deliberately switched on.
 *
 * Two conditions, both required: an API key, and TUTOR_AI_ENABLED=true. The
 * key alone is not enough on purpose — a key that lands in a deployment's
 * environment (added for something else, or by mistake) must never start
 * billing by itself. With the switch off, the tutor route answers before an
 * SDK client exists, so no request can reach the paid API, and the tutor
 * page writes every reply on the device from the learner's own progress data.
 *
 * Server-only: neither variable is exposed to the browser.
 */
export function isTutorAiEnabled(): boolean {
  return process.env.TUTOR_AI_ENABLED === 'true' && Boolean(process.env.ANTHROPIC_API_KEY);
}
