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
// ============================================================

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 })
}

export function unauthorized(message = 'Authentification requise.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function forbidden(message = 'Accès interdit.') {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}

export function notFound(message = 'Ressource non trouvée.') {
  return NextResponse.json({ success: false, error: message }, { status: 404 })
}

export function error(message: string, status = 500) {
  console.error(`[API Error ${status}] ${message}`)
  return NextResponse.json({ success: false, error: message }, { status })
}
