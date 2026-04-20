import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePassword, isValidEmail, generateToken } from '@/lib/auth'
import { badRequest, created, error } from '@/lib/middleware'

/**
 * POST /api/auth/register
 * Inscription avec email et mot de passe
 *
 * Body:
 * - email (string, requis)
 * - password (string, requis, min 8 caractères)
 * - name (string, requis)
 * - language (string, optionnel, défaut: "fr")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, language } = body

    // Validation des champs requis
    if (!email || !password || !name) {
      return badRequest('Tous les champs sont requis : email, password, name.')
    }

    // Validation de l'email
    if (!isValidEmail(email)) {
      return badRequest('Adresse email invalide.')
    }

    // Validation du mot de passe
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return badRequest(passwordValidation.message)
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      return badRequest('Un compte avec cet email existe déjà.')
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password)

    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        language: language || 'fr',
        authProvider: 'email',
        lastLoginAt: new Date()
      }
    })

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    // Retourner la réponse (sans le mot de passe hashé)
    return created({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    })

  } catch (err: any) {
    console.error('[Register Error]', err)
    return error('Erreur lors de l\'inscription. Veuillez réessayer.')
  }
}
