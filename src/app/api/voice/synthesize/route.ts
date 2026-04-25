import { NextRequest } from 'next/server'
import { authenticate, badRequest, error } from '@/lib/middleware'

/**
 * POST /api/voice/synthesize
 * Synthetiser la voix a partir du texte (TTS - Text to Speech)
 *
 * Headers: Authorization: Bearer <token>
 * Body:
 * - text (string, requis) — Texte a synthetiser
 * - language (string, optionnel) — Langue cible (fr, ba, dy, bq)
 * - voice (string, optionnel) — Voix a utiliser
 * - speed (number, optionnel) — Vitesse de parole (0.5-2.0, defaut: 1.0)
 *
 * Retourne l'audio en base64
 *
 * Utilise l'API Google Cloud Text-to-Speech (gratuit : 4M caracteres/mois)
 */

// Mapping langue vers voix Google Cloud TTS
const LANGUAGE_VOICE_MAP: Record<string, string> = {
  fr: 'fr-FR-Neural2-A',
  ba: 'fr-FR-Neural2-A',
  dy: 'fr-FR-Neural2-A',
  bq: 'fr-FR-Neural2-A'
}

// Decouper un texte long en morceaux de max 1000 caracteres
function splitTextIntoChunks(text: string, maxLength = 1000): string[] {
  if (text.length <= maxLength) return [text]

  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?\n])\s*/)
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim()
    } else {
      if (currentChunk) chunks.push(currentChunk.trim())
      if (sentence.length > maxLength) {
        const words = sentence.split(' ')
        currentChunk = ''
        for (const word of words) {
          if ((currentChunk + ' ' + word).trim().length <= maxLength) {
            currentChunk = (currentChunk + ' ' + word).trim()
          } else {
            if (currentChunk) chunks.push(currentChunk.trim())
            currentChunk = word
          }
        }
      } else {
        currentChunk = sentence
      }
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  return chunks.length > 0 ? chunks : [text.substring(0, maxLength)]
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { text, language = 'fr', voice, speed = 1.0 } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return badRequest('Le texte a synthetiser est requis.')
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!apiKey) {
      return error('Service de synthese vocale non configure. Contactez l\'administrateur.')
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

    const selectedVoice = voice || LANGUAGE_VOICE_MAP[language] || 'fr-FR-Neural2-A'
    const clampedSpeed = Math.min(2.0, Math.max(0.5, speed))

    // Utilisation de l'API Google Cloud Text-to-Speech v1 via REST
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`

    const chunks = splitTextIntoChunks(cleanText)
    const audioBuffers: Buffer[] = []

    for (const chunk of chunks) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: chunk },
          voice: {
            languageCode: 'fr-FR',
            name: selectedVoice,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: clampedSpeed,
          }
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[TTS API Error]', errText)

        // Fallback si l'API TTS n'est pas activée
        return new Response(
          JSON.stringify({
            success: false,
            error: 'La synthese vocale necessite l\'activation de Google Cloud Text-to-Speech. Activez l\'API dans Google Cloud Console.',
            fallback: true
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      const result = await response.json()
      const audioContent = result.audioContent

      if (audioContent) {
        const buffer = Buffer.from(audioContent, 'base64')
        audioBuffers.push(buffer)
      }
    }

    if (audioBuffers.length === 0) {
      return error('Erreur lors de la generation audio.')
    }

    const finalBuffer = Buffer.concat(audioBuffers)
    const audioBase64 = finalBuffer.toString('base64')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          audio: audioBase64,
          format: 'mp3',
          language,
          voice: selectedVoice,
          duration: Math.round(chunks.length * 5),
          chunks: chunks.length
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