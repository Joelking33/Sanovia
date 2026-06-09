/**
 * useTTS.ts
 * Hook React pour appeler /api/voice/synthesize et lire l'audio.
 *
 * Gère automatiquement :
 * - La réponse audio binaire (Google / ElevenLabs) → lecture via <audio>
 * - La réponse JSON navigateur (fallback) → Web Speech API
 */

import { useState, useCallback, useRef } from 'react'

type TTSState = 'idle' | 'loading' | 'playing' | 'error'
type TTSProvider = 'auto' | 'google' | 'elevenlabs'

interface UseTTSOptions {
  provider?: TTSProvider
  onStart?: () => void
  onEnd?: () => void
  onError?: (err: Error) => void
}

export function useTTS(options: UseTTSOptions = {}) {
  const { provider = 'auto', onStart, onEnd, onError } = options

  const [state, setState] = useState<TTSState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  /**
   * Arrête toute lecture en cours.
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel()
    }
    setState('idle')
  }, [])

  /**
   * Lit le texte via l'API TTS.
   */
  const speak = useCallback(
    async (text: string, language: string = 'fr') => {
      if (!text.trim()) return

      // Arrêter la lecture précédente
      stop()
      setState('loading')

      try {
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, provider }),
        })

        if (!response.ok) {
          throw new Error(`Erreur API TTS: ${response.status}`)
        }

        const contentType = response.headers.get('Content-Type') ?? ''

        // --- Réponse audio binaire (Google ou ElevenLabs) ---
        if (contentType.includes('audio/')) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)

          const audio = new Audio(audioUrl)
          audioRef.current = audio

          audio.onplay = () => {
            setState('playing')
            onStart?.()
          }

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            setState('idle')
            onEnd?.()
          }

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            setState('error')
            onError?.(new Error('Erreur de lecture audio'))
          }

          await audio.play()
        }
        // --- Réponse JSON (fallback Web Speech API) ---
        else if (contentType.includes('application/json')) {
          const data = await response.json()
          const cleanText: string = data?.data?.text ?? text
          const lang: string = data?.data?.language ?? language

          if (!window.speechSynthesis) {
            throw new Error('Web Speech API non supportée par ce navigateur.')
          }

          const utterance = new SpeechSynthesisUtterance(cleanText)
          utterance.lang = lang
          utterance.rate = 0.9    // Légèrement plus lent = plus naturel
          utterance.pitch = 0.95  // Légèrement plus grave = moins robotique
          utterance.volume = 1

          // Sélectionner une voix locale si disponible
          const voices = window.speechSynthesis.getVoices()
          const localVoice = voices.find(
            (v) => v.lang.startsWith(lang) && !v.name.includes('Google')
          )
          if (localVoice) utterance.voice = localVoice

          utterance.onstart = () => {
            setState('playing')
            onStart?.()
          }
          utterance.onend = () => {
            setState('idle')
            onEnd?.()
          }
          utterance.onerror = (e) => {
            setState('error')
            onError?.(new Error(`SpeechSynthesis error: ${e.error}`))
          }

          speechRef.current = utterance
          window.speechSynthesis.speak(utterance)
          setState('playing')
        }
      } catch (err: any) {
        console.error('[useTTS]', err)
        setState('error')
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    },
    [provider, stop, onStart, onEnd, onError]
  )

  return {
    speak,
    stop,
    state,
    isLoading: state === 'loading',
    isPlaying: state === 'playing',
  }
}