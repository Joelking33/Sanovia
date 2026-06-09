/**
 * google-tts.ts
 * Client Google Cloud Text-to-Speech avec voix Neural2.
 * Supporte le français, l'anglais, et les langues locales africaines
 * via une voix proxy + normalisation phonétique.
 *
 * Docs : https://cloud.google.com/text-to-speech/docs
 */

// Configuration des voix par langue
// Neural2 = meilleure qualité, Wavenet = bonne qualité
const VOICE_CONFIG: Record<string, { languageCode: string; name: string }> = {
  // Langues avec support natif Google
  fr:  { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },  // Femme française
  en:  { languageCode: 'en-US', name: 'en-US-Neural2-F' },  // Femme américaine
  ar:  { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A' },  // Arabe

  // Langues locales → voix proxy française (après normalisation phonétique)
  dioula:  { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  bambara: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  mooré:   { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  wolof:   { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
  hausa:   { languageCode: 'en-US', name: 'en-US-Neural2-F' },
}

interface GoogleTTSRequest {
  input: { ssml?: string; text?: string }
  voice: { languageCode: string; name: string }
  audioConfig: {
    audioEncoding: string
    speakingRate: number
    pitch: number
    effectsProfileId?: string[]
  }
}

/**
 * Synthétise le texte (SSML) avec Google Cloud TTS Neural2.
 * Retourne un Buffer audio MP3.
 */
export async function synthesizeWithGoogle(
  ssml: string,
  langue: string = 'fr'
): Promise<ArrayBuffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY non configurée.')

  const voice = VOICE_CONFIG[langue] ?? VOICE_CONFIG['fr']

  const requestBody: GoogleTTSRequest = {
    input: { ssml },
    voice,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.92,    // Légèrement plus lent = plus naturel
      pitch: -1.5,           // Voix légèrement plus grave = moins robotique
      effectsProfileId: ['handset-class-device'], // Optimisé mobile
    },
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Google TTS error ${response.status}: ${errBody}`)
  }

  const data = await response.json()

  if (!data.audioContent) {
    throw new Error('Google TTS : aucun contenu audio retourné.')
  }

  // Décoder le base64 en Buffer
  const binaryStr = atob(data.audioContent)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes.buffer
}