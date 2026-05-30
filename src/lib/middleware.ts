import { NextRequest, NextResponse } from 'next/server'
import { getToken, isValidLanguage, LANGUAGE_NAMES } from './auth'

// Ré-exporter les utilitaires d'auth pour simplifier les imports dans les routes
export { isValidLanguage, LANGUAGE_NAMES }

// ============================================================
// CONSTANTES
// ============================================================

const SUPPORTED_CATEGORIES = ['general', 'premiers_secours', 'grossesse'] as const

export function isValidCategory(category: string): boolean {
  return SUPPORTED_CATEGORIES.includes(category as any)
}

// ============================================================
// SÉRIALISATION JSON SÉCURISÉE
// Prévient l'erreur "toISOString is not a function"
// lors de la sérialisation des objets Date de Prisma
// ============================================================

/**
 * Replacer JSON qui convertit les objets Date en chaînes ISO.
 * Les objets Date Prisma sont passés par référence et peuvent
 * poser problème avec JSON.stringify() dans certains runtimes.
 */
const dateReplacer = (_key: string, value: unknown): unknown => {
  if (value instanceof Date) {
    try {
      return value.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }
  return value
}

export function safeJsonStringify(data: unknown): string {
  try {
    return JSON.stringify(data, dateReplacer)
  } catch (err) {
    console.error('[safeJsonStringify] Erreur de sérialisation:', err)
    // Fallback : convertir les dates manuellement
    return JSON.stringify(data, (_key, value) => {
      if (value && typeof value === 'object' && 'toISOString' in value) {
        try { return (value as Date).toISOString() } catch { return String(value) }
      }
      return value
    })
  }
}

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================

/**
 * Middleware d'authentification pour les routes protégées
 * Vérifie le token JWT dans le header Authorization: Bearer <token>
 */
export async function authenticate(request: NextRequest) {
  try {
    const payload = await getToken(request)
    if (!payload) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Authentification requise. Veuillez fournir un token JWT valide.' },
          { status: 401 }
        )
      }
    }
    return { success: true, userId: payload.userId, email: payload.email }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Token invalide ou expiré.' },
        { status: 401 }
      )
    }
  }
}

/**
 * Middleware optionnel d'authentification
 * Ne renvoie pas d'erreur si pas de token, mais attache userId si présent
 */
export async function optionalAuth(request: NextRequest) {
  try {
    const payload = await getToken(request)
    if (!payload) return { success: true, userId: null }
    return { success: true, userId: payload.userId }
  } catch {
    return { success: true, userId: null }
  }
}

// ============================================================
// HANDLERS DE RÉPONSES API STANDARDISÉS
// Utilisent safeJsonStringify pour éviter les erreurs Date
// ============================================================

export function success(data: unknown, status = 200) {
  const body = safeJsonStringify({ success: true, data })
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function created(data: unknown) {
  const body = safeJsonStringify({ success: true, data })
  return new NextResponse(body, {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function badRequest(message: string) {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function unauthorized(message = 'Authentification requise.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function forbidden(message = 'Accès interdit.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function notFound(message = 'Ressource non trouvée.') {
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function error(message: string, status = 500) {
  console.error(`[API Error ${status}] ${message}`)
  const body = safeJsonStringify({ success: false, error: message })
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
