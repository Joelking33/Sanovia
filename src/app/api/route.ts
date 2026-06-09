import { NextRequest } from 'next/server'
import { authenticate, badRequest, error } from '@/lib/middleware'
import { preprocessText } from '@/lib/tts/text-preprocessor'
import { buildSSML } from '@/lib/tts/ssml-builder'
import { synthesizeWithGoogle } from '@/lib/tts/google-tts'
import { synthesizeWithElevenLabs } from '@/lib/tts/elevenlabs-tts'

/**
 * POST /api/voice/synthesize
 * Synthétiser la voix à partir du texte (TTS)
 *
 * Stratégie par langue — règle métier SANOVIA :
 *  - Français (fr)          → ElevenLabs (voix signature naturelle)
 *  - Langues locales        → Google Cloud TTS Neural2 + SSML
 *    (baoulé, dioula, bété, mooré, wolof, bambara, hausa)
 *  - Fallback universel     → Web Speech API navigateur
 */

// Langues locales africaines gérées par Google Neural2
const LOCAL_LANGUAGES = new Set([
  'baoulé',
  'dioula',
  'bété',
  'mooré',
  'wolof',
  'bambara',
  'hausa',
])

/** Détermine le provider optimal selon la langue */
function resolveProvider(language: string): 'elevenlabs' | 'google' | 'browser' {
  if (language === 'fr' || language === 'fr-FR') {
    return process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'browser'
  }
  if (LOCAL_LANGUAGES.has(language)) {
    return process.env.GOOGLE_TTS_API_KEY ? 'google' : 'browser'
  }
  // Autres langues (en, ar...) → ElevenLabs si dispo, sinon Google, sinon browser
  if (process.env.ELEVENLABS_API_KEY) return 'elevenlabs'
  if (process.env.GOOGLE_TTS_API_KEY) return 'google'
  return 'browser'
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { text, language = 'fr' } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return badRequest('Le texte à synthétiser est requis.')
    }

    // 1. Nettoyer le texte (emojis, markdown, caractères spéciaux)
    const cleanText = preprocessText(text, language)

    if (!cleanText) {
      return badRequest('Le texte ne contient aucun contenu prononçable.')
    }

    // 2. Résoudre le provider selon la langue
    const provider = resolveProvider(language)

    console.info(`[TTS] langue="${language}" → provider="${provider}"`)

    // 3a. ElevenLabs — Français
    if (provider === 'elevenlabs') {
      try {
        const audioBuffer = await synthesizeWithElevenLabs(cleanText, language)
        return audioResponse(audioBuffer, 'elevenlabs')
      } catch (err: any) {
        console.warn('[TTS] ElevenLabs failed, falling back to browser.', err?.message)
        return browserFallback(cleanText, language)
      }
    }

    // 3b. Google Neural2 — Langues locales
    if (provider === 'google') {
      try {
        const ssml = buildSSML(cleanText)
        const audioBuffer = await synthesizeWithGoogle(ssml, language)
        return audioResponse(audioBuffer, 'google')
      } catch (err: any) {
        console.warn('[TTS] Google TTS failed, falling back to browser.', err?.message)
        return browserFallback(cleanText, language)
      }
    }

    // 3c. Fallback navigateur
    return browserFallback(cleanText, language)

  } catch (err: any) {
    console.error('[Voice Synthesize Error]', err?.message || err)
    return error('Erreur lors de la synthèse vocale. Veuillez réessayer.')
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function audioResponse(buffer: ArrayBuffer, provider: string): Response {
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength.toString(),
      'X-TTS-Provider': provider,
      'Cache-Control': 'no-cache',
    },
  })
}

function browserFallback(text: string, language: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        text,
        language,
        source: 'browser',
        message: 'Synthèse vocale effectuée par votre navigateur via Web Speech API.',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}