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
 *
 * Utilise l'API Google Cloud Speech-to-Text (gratuit : 60 min/mois)
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

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
      return error('Service de transcription non configure. Contactez l\'administrateur.')
    }

    // Mapping langue vers code BCP-47 pour Google Speech API
    const langMap: Record<string, string> = {
      fr: 'fr-FR',
      ba: 'fr-CI',
      dy: 'fr-CI',
      bq: 'fr-CI'
    }
    const speechLang = langMap[language] || 'fr-FR'

    // Utilisation de l'API Google Cloud Speech-to-Text v2 via REST
    const apiUrl = `https://speech.googleapis.com/v2/projects/-/locations/global/recognizers/_:recognize?key=${apiKey}`

    // Décoder le base64 et déterminer le type MIME
    const audioBuffer = Buffer.from(audio, 'base64')
    const audioContent = audioBuffer.toString('base64')

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          autoDetectDecodingConfig: true,
          languageCodes: [speechLang],
          model: 'long',
        },
        audio: {
          content: audioContent,
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Speech API Error]', errText)

      // Fallback : si l'API Speech n'est pas activée, retourner un message
      return success({
        text: '',
        language,
        message: 'La transcription vocale necessite l\'activation de Google Cloud Speech-to-Text. Utilisez la saisie texte.',
        fallback: true
      })
    }

    const result = await response.json()
    const transcribedText = result.results?.[0]?.alternatives?.[0]?.transcript || ''

    if (!transcribedText.trim()) {
      return success({ text: '', language, message: 'Aucune parole detectee dans l\'audio.' })
    }

    return success({
      text: transcribedText.trim(),
      language,
      confidence: true
    })

  } catch (err: any) {
    console.error('[Voice Transcribe Error]', err?.message || err)
    return error('Erreur lors de la transcription vocale. Veuillez reessayer.')
  }
}