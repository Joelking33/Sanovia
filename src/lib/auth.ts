import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'sanoovia-jwt-secret-change-in-production-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// ============================================================
// TYPES
// ============================================================

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
}

// ============================================================
// MOT DE PASSE
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================================
// JWT TOKEN
// ============================================================

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getToken(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  if (!token) return null

  return verifyToken(token)
}

// ============================================================
// VALIDATION EMAIL
// ============================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================
// VALIDATION MOT DE PASSE
// ============================================================

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule.' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule.' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre.' }
  }
  return { valid: true, message: 'Mot de passe valide.' }
}

// ============================================================
// LANGUES SUPPORTÉES
// ============================================================

export const SUPPORTED_LANGUAGES = ['fr', 'ba', 'dy', 'bq'] as const

export const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français',
  ba: 'Baoulé',
  dy: 'Dioula',
  bq: 'Bété'
}

export function isValidLanguage(lang: string): boolean {
  return SUPPORTED_LANGUAGES.includes(lang as any)
}

export function getLanguageName(lang: string): string {
  return LANGUAGE_NAMES[lang] || 'Français'
}
