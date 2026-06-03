// app/api/voice/route.ts
// Traitement des messages vocaux : Audio → Texte (Whisper) → chatWithAI → Réponse

import { NextRequest } from 'next/server'
import { chatWithAI } from '@/lib/ai'

// Mapping langue Sanovia → code Whisper
const LANGUAGE_TO_WHISPER: Record<string, string> = {
  fr: 'fr',   // Français → parfait
  ba: 'fr',   // Baoulé → utilise le français comme base (phonétique proche)
  dy: 'fr',   // Dioula → idem
  bq: 'fr',   // Bété   → idem
}

// Taille max audio : 25 MB (limite Whisper)
const MAX_AUDIO_SIZE = 25 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const groqKey = (process.env.GROQ_API_KEY ?? '').trim()
    if (!groqKey) {
      return Response.json(
        { error: 'GROQ_API_KEY manquant. Ajoute-le dans tes variables d\'environnement Vercel.' },
        { status: 500 }
      )
    }

    // ── 1. Récupérer l'audio et les paramètres ──
    const formData  = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const language  = (formData.get('language') as string) || 'fr'
    const category  = (formData.get('category') as string) || 'general'

    if (!audioFile) {
      return Response.json({ error: 'Aucun fichier audio reçu.' }, { status: 400 })
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return Response.json({ error: 'Fichier audio trop large (max 25 MB).' }, { status: 400 })
    }

    console.log(`[VOICE] 🎤 Audio reçu : ${audioFile.name} (${(audioFile.size / 1024).toFixed(0)} KB) — langue: ${language}`)

    // ── 2. Transcription avec Groq Whisper ──
    const whisperLang = LANGUAGE_TO_WHISPER[language] ?? 'fr'

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile)
    whisperForm.append('model', 'whisper-large-v3')
    whisperForm.append('language', whisperLang)
    whisperForm.append('response_format', 'json')
    whisperForm.append('temperature', '0')

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${groqKey}` },
      body:    whisperForm,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.text()
      console.error('[VOICE] ❌ Whisper error:', err)
      return Response.json(
        { error: 'Erreur de transcription audio. Réessayez.' },
        { status: 500 }
      )
    }

    const whisperData = await whisperRes.json()
    const transcript  = (whisperData.text ?? '').trim()

    if (!transcript) {
      return Response.json(
        { error: 'Aucun texte détecté dans l\'audio. Parlez plus clairement et réessayez.' },
        { status: 400 }
      )
    }

    console.log(`[VOICE] ✅ Transcription : "${transcript.slice(0, 100)}"`)

    // ── 3. Envoyer la transcription à chatWithAI ──
    const aiResponse = await chatWithAI(transcript, language, category, [])

    // ── 4. Retourner transcription + réponse IA ──
    return Response.json({
      success:    true,
      transcript,         // Le texte transcrit du vocal
      response:   aiResponse.content,
      metadata:   aiResponse.metadata,
      language,
    })

  } catch (err: any) {
    console.error('[VOICE] ❌ Erreur:', err)
    return Response.json(
      { error: 'Erreur interne du serveur vocal.' },
      { status: 500 }
    )
  }
}