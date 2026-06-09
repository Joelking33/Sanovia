/**
 * elevenlabs-tts.ts
 * Client ElevenLabs Text-to-Speech avec le modèle eleven_multilingual_v2.
 * Offre la voix la plus naturelle disponible (~30 langues supportées).
 *
 * Docs : https://elevenlabs.io/docs/api-reference/text-to-speech
 */

// ID de voix recommandées depuis la bibliothèque ElevenLabs
// Vous pouvez aussi cloner une voix et mettre son ID ici
const VOICE_IDS: Record<string, string> = {
  // Voix par défaut selon la langue/région
  fr:      '21m00Tcm4TlvDq8ikWAM', // Rachel (neutre, claire)
  en:      'EXAVITQu4vr4xnSDxMaL', // Bella (naturelle)

  // Langues locales → voix francophone naturelle
  dioula:  '21m00Tcm4TlvDq8ikWAM',
  bambara: '21m00Tcm4TlvDq8ikWAM',
  mooré:   '21m00Tcm4TlvDq8ikWAM',
  wolof:   '21m00Tcm4TlvDq8ikWAM',
  hausa:   'EXAVITQu4vr4xnSDxMaL',
}

// Paramètres de voix optimisés pour une lecture médicale claire
const VOICE_SETTINGS = {
  stability: 0.45,         // Plus bas = plus expressif, plus haut = plus stable
  similarity_boost: 0.80,  // Fidélité à la voix originale
  style: 0.25,             // Style expressif (0 = neutre, 1 = très expressif)
  use_speaker_boost: true, // Améliore la clarté de la voix
}

/**
 * Synthétise le texte avec ElevenLabs.
 * Retourne un ArrayBuffer audio MP3.
 */
export async function synthesizeWithElevenLabs(
  text: string,
  langue: string = 'fr'
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY non configurée.')

  const voiceId = VOICE_IDS[langue] ?? VOICE_IDS['fr']

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Meilleur modèle multilingue
        voice_settings: VOICE_SETTINGS,
      }),
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`ElevenLabs error ${response.status}: ${errBody}`)
  }

  return response.arrayBuffer()
}