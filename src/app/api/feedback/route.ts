// app/api/feedback/route.ts
// Feedback avec validation automatique par l'IA + recherche web

import { NextRequest } from 'next/server'
import { authenticate, success, created, badRequest, error } from '@/lib/middleware'
import { approveResponse, getLearningStats }                 from '@/lib/ai'
import { validateMedicalCorrection }                         from '@/lib/feedback-validator'

// Stockage temporaire des corrections validées (en mémoire)
// En production → remplacer par Prisma DB
const PENDING_CORRECTIONS: Array<{
  id:               string
  question:         string
  correction:       string
  originalResponse: string
  language:         string
  category:         string
  validation:       Awaited<ReturnType<typeof validateMedicalCorrection>>
  submittedAt:      string
}> = []

const REJECTED_LOG: Array<{
  id:          string
  reason:      string
  rejectedAt:  string
}> = []

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback
// Soumettre un feedback positif ou une correction (feedback négatif)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  try {
    const {
      question,
      response,
      language         = 'fr',
      category         = 'general',
      type             = 'positive',
      originalResponse = '',
    } = await request.json()

    if (!question || !response) {
      return badRequest('Champs requis : question, response')
    }

    // ── CAS 1 : Feedback positif — stockage direct ──────────────────────────
    if (type === 'positive') {
      const result = approveResponse(language, category, question, response)
      return success({
        type:    'positive',
        stored:  result.stored,
        total:   result.total,
        message: result.stored
          ? '✅ Réponse approuvée — l\'IA s\'en souviendra !'
          : '⚠️ Cette réponse était déjà enregistrée.',
      })
    }

    // ── CAS 2 : Correction (feedback négatif) — validation par l'IA ─────────
    if (type === 'correction') {
      const correctionText = response.trim()

      if (correctionText.length < 20) {
        return badRequest('La correction est trop courte (min. 20 caractères).')
      }
      if (correctionText.length > 1000) {
        return badRequest('La correction est trop longue (max. 1000 caractères).')
      }

      console.log('[FEEDBACK] 🔍 Validation IA en cours...')

      // Appel à la validation IA avec recherche web
      const validation = await validateMedicalCorrection(
        question,
        originalResponse,
        correctionText,
        language,
      )

      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      // ── Correction approuvée ──
      if (validation.valid && validation.status === 'approved') {
        // Stocker directement dans le système d'apprentissage
        const stored = approveResponse(language, category, question, correctionText)

        return success({
          type:       'correction',
          status:     'approved',
          valid:      true,
          confidence: validation.confidence,
          reason:     validation.reason,
          sources:    validation.sources,
          message:    `✅ Correction validée par l'IA (confiance ${validation.confidence}%) — l'IA va s'améliorer !`,
          stored:     stored.stored,
        })
      }

      // ── Correction incertaine → log mais pas injectée ──
      if (validation.status === 'uncertain') {
        PENDING_CORRECTIONS.push({
          id,
          question,
          correction:       correctionText,
          originalResponse,
          language,
          category,
          validation,
          submittedAt:      new Date().toISOString(),
        })

        return success({
          type:       'correction',
          status:     'uncertain',
          valid:      false,
          confidence: validation.confidence,
          reason:     validation.reason,
          message:    `⚠️ Correction incertaine — non utilisée par l'IA pour l'instant (confiance ${validation.confidence}%)`,
        })
      }

      // ── Correction rejetée ──
      REJECTED_LOG.push({ id, reason: validation.reason, rejectedAt: new Date().toISOString() })

      return success({
        type:       'correction',
        status:     'rejected',
        valid:      false,
        confidence: validation.confidence,
        reason:     validation.reason,
        sources:    validation.sources,
        message:    `❌ Correction rejetée : ${validation.reason}`,
      })
    }

    return badRequest('Type invalide. Utilisez "positive" ou "correction".')

  } catch (err: any) {
    console.error('[Feedback Error]', err)
    return error('Erreur lors du traitement du feedback.')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feedback
// Statistiques d'apprentissage
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.success) return auth.response

  return success({
    learningStats:       getLearningStats(),
    pendingCorrections:  PENDING_CORRECTIONS.length,
    rejectedCorrections: REJECTED_LOG.length,
  })
}