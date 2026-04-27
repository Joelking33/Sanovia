import { NextRequest } from 'next/server'
import { authenticate, success, badRequest, error } from '@/lib/middleware'

/**
 * POST /api/voice/transcribe
 * Transcrire un message vocal en texte (ASR)
 *
 * Utilise le navigateur Web Speech API (côté client).
 * Cette route est un fallback pour les transcriptions serveur.
 */

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { audio, language = 'fr', text } = body

    // Si le texte est déjà fourni (transcription côté client), le retourner directement
    if (text && typeof text === 'string' && text.trim()) {
      return success({
        text: text.trim(),
        language,
        confidence: true,
        source: 'client'
      })
    }

    // Sinon, la transcription vocale se fait côté client via Web Speech API
    return success({
      text: '',
      language,
      message: 'La transcription vocale est effectuee directement dans votre navigateur. Utilisez le microphone integre.',
      source: 'browser'
    })

  } catch (err: any) {
    console.error('[Voice Transcribe Error]', err?.message || err)
    return error('Erreur lors de la transcription vocale. Veuillez reessayer.')
  }
}
