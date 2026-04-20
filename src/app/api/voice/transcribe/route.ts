import { NextRequest } from 'next/server'
import { authenticate, success, badRequest, error } from '@/lib/middleware'

/**
 * POST /api/voice/transcribe
 * Transcrire un message vocal en texte (ASR - Speech to Text)
 *
 * Headers: Authorization: Bearer <token>
 * Body:
 * - audio (string, base64, requis) — Audio encodé en base64
 * - language (string, optionnel) — Langue de l'audio (fr, ba, dy, bq)
 *
 * Retourne le texte transcrit
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { audio, language = 'fr' } = body

    if (!audio || typeof audio !== 'string') {
      return badRequest('Audio encodé en base64 est requis.')
    }

    if (audio.length > 50 * 1024 * 1024) {
      return badRequest('Fichier audio trop volumineux (max 50 MB).')
    }

    // Importer le SDK côté serveur uniquement
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Transcrire l'audio
    const response = await zai.audio.asr.create({
      file_base64: audio
    })

    const transcribedText = response.text || ''

    if (!transcribedText.trim()) {
      return success({ text: '', language, message: 'Aucune parole détectée dans l\'audio.' })
    }

    return success({
      text: transcribedText.trim(),
      language,
      confidence: true
    })

  } catch (err: any) {
    console.error('[Voice Transcribe Error]', err?.message || err)
    return error('Erreur lors de la transcription vocale. Veuillez réessayer.')
  }
}
