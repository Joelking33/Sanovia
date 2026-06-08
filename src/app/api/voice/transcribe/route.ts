// app/api/voice/transcribe/route.ts
// Transcription réelle avec Groq Whisper — supporte fr, ba, dy, bq

import { NextRequest } from 'next/server'
import { authenticate, success, badRequest, error } from '@/lib/middleware'
import { chatWithAI } from '@/lib/ai'

const TRANSCRIPTION_PROMPTS: Record<string, string> = {
  fr: 'Transcription en français ivoirien.',
  ba: 'Cette audio contient du baoulé, langue locale ivoirienne. Transcris phonétiquement ce que tu entends.',
  dy: 'Cette audio contient du dioula ivoirien. Transcris phonétiquement ce que tu entends.',
  bq: 'Cette audio contient du bété ivoirien. Transcris phonétiquement ce que tu entends.',
}

const WHISPER_LANG: Record<string, string | null> = {
  fr: 'fr',
  ba: null,
  dy: null,
  bq: null,
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const contentType = request.headers.get('content-type') ?? ''

    // CAS 1 : JSON avec base64 (format envoyé par page.tsx)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { audio, language = 'fr', category = 'general', text } = body

      if (text?.trim()) {
        const aiResponse = await chatWithAI(text.trim(), language, category, [])
        return success({ text: text.trim(), response: aiResponse.content, language, source: 'client' })
      }

      if (!audio) return badRequest('Champ "audio" (base64) requis.')

      const groqKey = (process.env.GROQ_API_KEY ?? '').trim()
      if (!groqKey) return error('GROQ_API_KEY manquant. Ajoutez-le dans Vercel → Settings → Environment Variables.')

      const base64Clean  = audio.replace(/^data:[^;]+;base64,/, '')
      const audioBuffer  = Buffer.from(base64Clean, 'base64')

      if (audioBuffer.length < 500) return badRequest('Audio trop court. Parlez au moins 1 seconde.')

      const ext      = body.ext || 'webm'
      const mimeType = ext === 'mp4' ? 'audio/mp4' : ext === 'ogg' ? 'audio/ogg' : 'audio/webm'
      const audioFile = new File([audioBuffer], `rec.${ext}`, { type: mimeType })

      const transcript = await transcribeWithGroq(audioFile, language, groqKey)
      if (!transcript) return badRequest('Aucune parole détectée. Parlez plus clairement et réessayez.')

      console.log(`[TRANSCRIBE] "${transcript.slice(0, 80)}" (${language})`)
      const aiResponse = await chatWithAI(transcript, language, category, [])
      return success({ text: transcript, response: aiResponse.content, metadata: aiResponse.metadata, language, source: 'groq-whisper' })
    }

    // CAS 2 : FormData avec fichier
    if (contentType.includes('multipart/form-data')) {
      const groqKey = (process.env.GROQ_API_KEY ?? '').trim()
      if (!groqKey) return error('GROQ_API_KEY manquant.')

      const formData  = await request.formData()
      const audioFile = formData.get('audio') as File | null
      const language  = (formData.get('language') as string) || 'fr'
      const category  = (formData.get('category') as string) || 'general'

      if (!audioFile || audioFile.size < 500) return badRequest('Fichier audio absent ou trop court.')

      const transcript = await transcribeWithGroq(audioFile, language, groqKey)
      if (!transcript) return badRequest('Aucune parole détectée.')

      const aiResponse = await chatWithAI(transcript, language, category, [])
      return success({ text: transcript, response: aiResponse.content, metadata: aiResponse.metadata, language, source: 'groq-whisper' })
    }

    return badRequest('Format non supporté.')
  } catch (err: any) {
    console.error('[TRANSCRIBE]', err?.message || err)
    return error('Erreur lors de la transcription vocale.')
  }
}

async function transcribeWithGroq(audioFile: File, language: string, groqKey: string): Promise<string | null> {
  const form = new FormData()
  form.append('file',            audioFile)
  form.append('model',           'whisper-large-v3')
  form.append('response_format', 'json')
  form.append('temperature',     '0')
  form.append('prompt',          TRANSCRIPTION_PROMPTS[language] ?? TRANSCRIPTION_PROMPTS.fr)

  const whisperLang = WHISPER_LANG[language]
  if (whisperLang) form.append('language', whisperLang)

  const ctrl = new AbortController()
  setTimeout(() => ctrl.abort(), 30000)

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${groqKey}` },
    body: form, signal: ctrl.signal,
  })

  if (!res.ok) { console.error('[TRANSCRIBE] Groq:', res.status, await res.text().catch(() => '')); return null }
  const data = await res.json()
  return (data.text ?? '').trim() || null
}