import { NextRequest } from 'next/server'
import { authenticate, badRequest, error } from '@/lib/middleware'

/**
 * POST /api/voice/synthesize
 * Synthetiser la voix a partir du texte (TTS)
 *
 * Utilise l'API OpenRouter-compatible ou le navigateur (Web Speech API).
 * Cette route utilise l'API Responsive Voice / Browser TTS comme fallback.
 */

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { text, language = 'fr' } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return badRequest('Le texte a synthetiser est requis.')
    }

    // Nettoyer le texte pour le TTS
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[.🚨🧠🤰🚑🏥🩸🧬💊🩺]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanText) {
      return badRequest('Le texte ne contient aucun contenu prononcable.')
    }

    // La synthèse vocale se fait côté client via Web Speech API (SpeechSynthesis)
    // Cette route retourne le texte nettoyé pour que le client le lise
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          text: cleanText,
          language,
          source: 'browser',
          message: 'Synthese vocale effectuee par votre navigateur via Web Speech API.'
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (err: any) {
    console.error('[Voice Synthesize Error]', err?.message || err)
    return error('Erreur lors de la synthese vocale. Veuillez reessayer.')
  }
}
