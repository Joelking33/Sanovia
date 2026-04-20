import { NextRequest } from 'next/server'
import { authenticate, badRequest, error } from '@/lib/middleware'

/**
 * POST /api/voice/synthesize
 * Synthétiser la voix à partir du texte (TTS - Text to Speech)
 *
 * Headers: Authorization: Bearer <token>
 * Body:
 * - text (string, requis) — Texte à synthétiser (max 1024 caractères par morceau)
 * - language (string, optionnel) — Langue cible (fr, ba, dy, bq)
 * - voice (string, optionnel) — Voix à utiliser (défaut: tongtong)
 * - speed (number, optionnel) — Vitesse de parole (0.5-2.0, défaut: 1.0)
 *
 * Retourne l'audio en base64
 */

// Mapping langue vers voix
const LANGUAGE_VOICE_MAP: Record<string, string> = {
  fr: 'tongtong',
  ba: 'tongtong',
  dy: 'tongtong',
  bq: 'tongtong'
}

// Découper un texte long en morceaux de max 1000 caractères
function splitTextIntoChunks(text: string, maxLength = 1000): string[] {
  if (text.length <= maxLength) return [text]

  const chunks: string[] = []
  // Découper aux sauts de ligne ou aux points
  const sentences = text.split(/(?<=[.!?\n])\s*/)
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim()
    } else {
      if (currentChunk) chunks.push(currentChunk.trim())
      // Si une seule phrase dépasse la limite, la couper de force
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
      return badRequest('Le texte à synthétiser est requis.')
    }

    // Nettoyer le texte pour le TTS (enlever les emojis et caractères spéciaux)
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
      .replace(/[⚕️🚨🧠🤰🚑🏥🩸🧬💊🩺⚕]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanText) {
      return badRequest('Le texte ne contient aucun contenu prononçable.')
    }

    const selectedVoice = voice || LANGUAGE_VOICE_MAP[language] || 'tongtong'
    const clampedSpeed = Math.min(2.0, Math.max(0.5, speed))

    // Importer le SDK côté serveur uniquement
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const chunks = splitTextIntoChunks(cleanText)
    const audioBuffers: Buffer[] = []

    for (const chunk of chunks) {
      const response = await zai.audio.tts.create({
        input: chunk,
        voice: selectedVoice,
        speed: clampedSpeed,
        response_format: 'mp3',
        stream: false
      })

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))
      audioBuffers.push(buffer)
    }

    // Concaténer tous les buffers audio
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
          duration: Math.round(chunks.length * 5), // estimation approximative
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
    return error('Erreur lors de la synthèse vocale. Veuillez réessayer.')
  }
}
