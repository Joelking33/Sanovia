// SANOvIA — Système d'internationalisation (i18n)
// Supporte : fr (Français), ba (Baoulé), dy (Dioula), bq (Bété)
// ============================================================

export type Language = 'fr' | 'ba' | 'dy' | 'bq'

export interface LanguageInfo {
  code: Language
  label: string
  flag: string
  speechCode: string
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'ba', label: 'Baoulé', flag: '🇨🇮', speechCode: 'fr-FR' },
  { code: 'dy', label: 'Dioula', flag: '🇨🇮', speechCode: 'fr-FR' },
  { code: 'bq', label: 'Bété', flag: '🇨🇮', speechCode: 'fr-FR' },
]

// ============================================================
// TRADUCTIONS COMPLÈTES
// ============================================================

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Chargement...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia est un assistant informatif, pas un médecin. Les informations fournies ne remplacent pas un avis médical professionnel.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Connexion',
    'login.subtitle': 'Assistant santé intelligent pour la Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Mot de passe',
    'login.passwordPlaceholder': 'Votre mot de passe',
    'login.submit': 'Se connecter',
    'login.forgotPassword': 'Mot de passe oublié ?',
    'login.noAccount': 'Pas encore de compte ?',
    'login.createAccount': 'Créer un compte',
    'login.errorEmpty': 'Veuillez remplir tous les champs.',
    'login.errorGeneric': 'Erreur de connexion.',
    'login.orGoogle': 'Ou se connecter avec Google',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Créer un compte',
    'register.subtitle': 'Rejoignez Sanovia pour accéder à l\'assistant santé',
    'register.name': 'Nom complet',
    'register.namePlaceholder': 'Votre nom complet',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Mot de passe',
    'register.passwordPlaceholder': 'Min. 8 caractères, 1 majuscule, 1 chiffre',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.confirmPasswordPlaceholder': 'Confirmez votre mot de passe',
    'register.language': 'Langue préférée',
    'register.submit': 'Créer mon compte',
    'register.hasAccount': 'Déjà un compte ?',
    'register.login': 'Se connecter',
    'register.errorEmpty': 'Veuillez remplir tous les champs.',
    'register.errorPasswordLength': 'Le mot de passe doit contenir au moins 8 caractères.',
    'register.errorPasswordStrength': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.',
    'register.errorPasswordMismatch': 'Les mots de passe ne correspondent pas.',
    'register.errorGeneric': 'Erreur d\'inscription.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Mot de passe oublié ?',
    'forgot.subtitle': 'Réinitialisation du mot de passe',
    'forgot.description': 'Entrez l\'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.',
    'forgot.email': 'Adresse email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Envoyer le lien de réinitialisation',
    'forgot.backToLogin': '← Retour à la connexion',
    'forgot.errorEmpty': 'Veuillez entrer votre adresse email.',
    'forgot.success': 'Si cette adresse email est associée à un compte, un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception (et spam).',
    'forgot.errorGeneric': 'Erreur lors de la demande.',
    'forgot.devMode': 'Mode développement — SMTP non configuré.',
    'forgot.useToken': 'Utiliser ce token pour réinitialiser',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Définir un nouveau mot de passe',
    'reset.subtitle': 'Nouveau mot de passe',
    'reset.description': 'Créez un mot de passe fort pour sécuriser votre compte Sanovia.',
    'reset.token': 'Token de réinitialisation',
    'reset.tokenPlaceholder': 'Collez le token de réinitialisation ici...',
    'reset.tokenHint': 'Token pré-rempli (mode développement)',
    'reset.password': 'Nouveau mot de passe',
    'reset.passwordPlaceholder': 'Min. 8 caractères, 1 majuscule, 1 chiffre',
    'reset.confirmPassword': 'Confirmer le mot de passe',
    'reset.confirmPasswordPlaceholder': 'Confirmez votre nouveau mot de passe',
    'reset.submit': 'Réinitialiser mon mot de passe',
    'reset.backToLogin': '← Retour à la connexion',
    'reset.expiry': 'Le lien de réinitialisation expire dans 1 heure. Si vous n\'avez pas reçu l\'email, vérifiez vos spams ou refaites une demande.',
    'reset.successTitle': 'Mot de passe mis à jour !',
    'reset.successMessage': 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    'reset.loginButton': 'Se connecter',
    'reset.errorNoToken': 'Le token de réinitialisation est requis.',
    'reset.errorEmpty': 'Veuillez remplir tous les champs.',
    'reset.errorPasswordLength': 'Le mot de passe doit contenir au moins 8 caractères.',
    'reset.errorPasswordUpper': 'Le mot de passe doit contenir au moins une majuscule.',
    'reset.errorPasswordDigit': 'Le mot de passe doit contenir au moins un chiffre.',
    'reset.errorPasswordMismatch': 'Les mots de passe ne correspondent pas.',
    'reset.errorMismatch': 'Les mots de passe ne correspondent pas.',
    'reset.errorGeneric': 'Erreur lors de la réinitialisation.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': 'Bonjour {name} ! Je suis votre assistant d\'information santé.\nJe peux vous aider sur des questions de santé, de prévention et de bien-être.',
    'chat.voiceHint': 'Vous pouvez aussi m\'envoyer des messages vocaux ! Cliquez sur le micro pour enregistrer.\nJ\'écouterai en {lang} et vous répondrai également à voix.',
    'chat.disclaimer': 'Je ne suis pas un médecin. Ces informations sont à titre éducatif.\nConsultez toujours un professionnel de santé pour votre situation personnelle.',
    'chat.suggestion1': 'Comment traiter une petite brûlure ?',
    'chat.suggestion2': 'Signes de grossesse au premier trimestre',
    'chat.suggestion3': 'Symptômes du paludisme',
    'chat.placeholder': 'Posez votre question de santé...',
    'chat.newChat': 'Nouveau chat',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Aucune conversation pour le moment.\nCommencez par poser une question de santé !',
    'chat.newConversation': 'Nouvelle conversation',
    'chat.logout': 'Se déconnecter',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'ENREGISTREMENT',
    'voice.cancel': 'Annuler',
    'voice.send': 'Envoyer',
    'voice.cancelTooltip': 'Annuler l\'enregistrement',
    'voice.sendTooltip': 'Envoyer le message vocal',
    'voice.transcribing': 'Transcription en cours en {lang}...',
    'voice.tooShort': 'Enregistrement trop court. Parlez plus longtemps.',
    'voice.noSpeech': 'Aucune parole détectée. Veuillez réessayer.',
    'voice.transcriptionError': 'Erreur lors de la transcription. Vérifiez votre connexion.',
    'voice.noMic': 'Impossible d\'accéder au microphone. Vérifiez les permissions de votre navigateur.',
    'voice.micTooltip': 'Enregistrer un message vocal',
    'voice.languageHint': 'Langue vocale : {lang} — Changez la langue dans le sélecteur en haut',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Écouter la réponse vocale',
    'tts.generating': 'Génération...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Arrêter',
    'tts.replay': 'Rejouer',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Urgences CI',
    'urgency.samu': 'SAMU / Urgences médicales',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police secours',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Centre Anti-Poison',
    'urgency.psychiatric': 'SOS Psychiatrique',
    'urgency.blood': 'Centre Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Ligne Info Santé',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Santé',
    'category.premiers_secours': 'Urgences',
    'category.grossesse': 'Grossesse',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Aujourd\'hui',
    'date.yesterday': 'Hier',
    'date.daysAgo': 'Il y a {n} jours',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Erreur réseau. Vérifiez votre connexion.',
    'error.session': 'Session expirée. Veuillez vous reconnecter.',
  },

  ba: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'A ke ene...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia ye sran man tooro, a te tooro. Kunnafoniw te tooro kene bee.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Je ke',
    'login.subtitle': 'Sran man tooro Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunafon min bee',
    'login.passwordPlaceholder': 'I kunafon min bee',
    'login.submit': 'Je ke',
    'login.forgotPassword': 'Kunafon wolo ?',
    'login.noAccount': 'I te komen te ?',
    'login.createAccount': 'Komen ke',
    'login.errorEmpty': 'Beew ke.',
    'login.errorGeneric': 'Je ke banna.',
    'login.orGoogle': 'Google je ke',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Komen ke',
    'register.subtitle': 'Sanovia soro sran man tooro',
    'register.name': 'I togo',
    'register.namePlaceholder': 'I togo',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunafon min bee',
    'register.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'register.confirmPassword': 'Kunafon soro',
    'register.confirmPasswordPlaceholder': 'Kunafon soro',
    'register.language': 'Kan',
    'register.submit': 'Komen ke',
    'register.hasAccount': 'I te komen te ?',
    'register.login': 'Je ke',
    'register.errorEmpty': 'Beew ke.',
    'register.errorPasswordLength': 'Kunafon 8 kene.',
    'register.errorPasswordStrength': 'Kunafon nufelen, ninsoron ni nombere ke.',
    'register.errorPasswordMismatch': 'Kunafonw te moro.',
    'register.errorGeneric': 'Komen banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunafon wolo ?',
    'forgot.subtitle': 'Kunafon elemon',
    'forgot.description': 'I email ke.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunafon link min bee',
    'forgot.backToLogin': '← Je ke',
    'forgot.errorEmpty': 'I email ke.',
    'forgot.success': 'Email bee. I email ke.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP te.',
    'forgot.useToken': 'Token soro',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunafon elemon',
    'reset.subtitle': 'Kunafon elemon',
    'reset.description': 'Kunafon kene.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token ke...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunafon elemon',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'reset.confirmPassword': 'Kunafon soro',
    'reset.confirmPasswordPlaceholder': 'Kunafon soro',
    'reset.submit': 'Kunafon elemon',
    'reset.backToLogin': '← Je ke',
    'reset.expiry': 'Link 1 l\'ere. I email te, soro ene.',
    'reset.successTitle': 'Kunafon kene !',
    'reset.successMessage': 'Kunafon kene. Je ke.',
    'reset.loginButton': 'Je ke',
    'reset.errorNoToken': 'Token ke.',
    'reset.errorEmpty': 'Beew ke.',
    'reset.errorPasswordLength': 'Kunafon 8 kene.',
    'reset.errorPasswordUpper': 'Kunafon nufelen ke.',
    'reset.errorPasswordDigit': 'Kunafon nombere ke.',
    'reset.errorPasswordMismatch': 'Kunafonw te moro.',
    'reset.errorMismatch': 'Kunafonw te moro.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! Lue Sanoovia, sran man tooro.\nSran man kunnafoni bee deme.',
    'chat.voiceHint': 'I be meseje were fo ! Mekro ke.\n{lang} fo, n\'a repon.',
    'chat.disclaimer': 'Lue sran man tooro te. Kunnafoni ye.\nTooro kene.',
    'chat.suggestion1': 'Oro yelema ?',
    'chat.suggestion2': 'Glo globele soronow',
    'chat.suggestion3': 'Paludisme soronow',
    'chat.placeholder': 'Sran man fon...',
    'chat.newChat': 'Kunnafoni elemon',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni te.\nSran man fon !',
    'chat.newConversation': 'Kunnafoni elemon',
    'chat.logout': 'Kene',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FON',
    'voice.cancel': 'Tebe',
    'voice.send': 'Min bee',
    'voice.cancelTooltip': 'Fon tebe',
    'voice.sendTooltip': 'Meseje min bee',
    'voice.transcribing': 'Kunnafon ke {lang}...',
    'voice.tooShort': 'Fon kene. Fo ene.',
    'voice.noSpeech': 'Parole te. Soro ene.',
    'voice.transcriptionError': 'Kunnafon banna.',
    'voice.noMic': 'Mekro te. Permissions ke.',
    'voice.micTooltip': 'Meseje fo',
    'voice.languageHint': 'Kan : {lang} — Kan elemon',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fo',
    'tts.generating': 'Ke ene...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Teme',
    'tts.replay': 'Soro ene',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banje CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kenemokon',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Santé',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Sran',
    'category.premiers_secours': 'Banje',
    'category.grossesse': 'Glo',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Lela',
    'date.yesterday': 'Deme',
    'date.daysAgo': '{n} lela',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion ke.',
    'error.session': 'Session banna. Je ke ene.',
  },

  dy: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Ka ke ene...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia ye banje eere la jelen ye, tooro te ye. Kunnafoniw te tooro kene bee.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Se connecter',
    'login.subtitle': 'Banje eere tooro Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunnafon',
    'login.passwordPlaceholder': 'I kunnafon',
    'login.submit': 'Se connecter',
    'login.forgotPassword': 'Kunnafon wolo ?',
    'login.noAccount': 'I te compte te ?',
    'login.createAccount': 'Compte ke',
    'login.errorEmpty': 'Beew ke.',
    'login.errorGeneric': 'Connexion banna.',
    'login.orGoogle': 'Google se connecter',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Compte ke',
    'register.subtitle': 'Sanovia banje eere tooro',
    'register.name': 'I togo',
    'register.namePlaceholder': 'I togo',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunnafon',
    'register.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'register.confirmPassword': 'Kunnafon soro',
    'register.confirmPasswordPlaceholder': 'Kunnafon soro',
    'register.language': 'Kan',
    'register.submit': 'Compte ke',
    'register.hasAccount': 'I te compte te ?',
    'register.login': 'Se connecter',
    'register.errorEmpty': 'Beew ke.',
    'register.errorPasswordLength': 'Kunnafon 8 kene.',
    'register.errorPasswordStrength': 'Kunnafon nufelen, ninsoron ni nombere ke.',
    'register.errorPasswordMismatch': 'Kunnafonw te moro.',
    'register.errorGeneric': 'Compte banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunnafon wolo ?',
    'forgot.subtitle': 'Kunnafon elemon',
    'forgot.description': 'I email ke.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunnafon link min bee',
    'forgot.backToLogin': '← Se connecter',
    'forgot.errorEmpty': 'I email ke.',
    'forgot.success': 'Email bee. I email ke.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP te.',
    'forgot.useToken': 'Token soro',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunnafon elemon',
    'reset.subtitle': 'Kunnafon elemon',
    'reset.description': 'Kunnafon kene.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token ke...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunnafon elemon',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'reset.confirmPassword': 'Kunnafon soro',
    'reset.confirmPasswordPlaceholder': 'Kunnafon soro',
    'reset.submit': 'Kunnafon elemon',
    'reset.backToLogin': '← Se connecter',
    'reset.expiry': 'Link 1 l\'ere.',
    'reset.successTitle': 'Kunnafon kene !',
    'reset.successMessage': 'Kunnafon kene. Se connecter.',
    'reset.loginButton': 'Se connecter',
    'reset.errorNoToken': 'Token ke.',
    'reset.errorEmpty': 'Beew ke.',
    'reset.errorPasswordLength': 'Kunnafon 8 kene.',
    'reset.errorPasswordUpper': 'Kunnafon nufelen ke.',
    'reset.errorPasswordDigit': 'Kunnafon nombere ke.',
    'reset.errorPasswordMismatch': 'Kunnafonw te moro.',
    'reset.errorMismatch': 'Kunnafonw te moro.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! I tooro Sanoovia ye, banje eere tooro.\nBanje eere kunnafoni bee deme.',
    'chat.voiceHint': 'I be meseje were fo ! Mekro ke.\n{lang} fo, n\'a repon.',
    'chat.disclaimer': 'Tooro te ye. Kunnafoni ye.\nTooro kene.',
    'chat.suggestion1': 'Oro yelema ?',
    'chat.suggestion2': 'Glo globele soronow',
    'chat.suggestion3': 'Paludisme soronow',
    'chat.placeholder': 'Banje eere fon...',
    'chat.newChat': 'Kunnafoni elemon',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni te.\nBanje eere fon !',
    'chat.newConversation': 'Kunnafoni elemon',
    'chat.logout': 'Kene',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FON',
    'voice.cancel': 'Tebe',
    'voice.send': 'Min bee',
    'voice.cancelTooltip': 'Fon tebe',
    'voice.sendTooltip': 'Meseje min bee',
    'voice.transcribing': 'Kunnafon ke {lang}...',
    'voice.tooShort': 'Fon kene. Fo ene.',
    'voice.noSpeech': 'Parole te. Soro ene.',
    'voice.transcriptionError': 'Kunnafon banna.',
    'voice.noMic': 'Mekro te. Permissions ke.',
    'voice.micTooltip': 'Meseje fo',
    'voice.languageHint': 'Kan : {lang} — Kan elemon',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fo',
    'tts.generating': 'Ka ke ene...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Teme',
    'tts.replay': 'Soro ene',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banje CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kenemokon',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Banje',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Banje',
    'category.premiers_secours': 'Banje',
    'category.grossesse': 'Glo',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Bii',
    'date.yesterday': 'Jina',
    'date.daysAgo': '{n} bii',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion ke.',
    'error.session': 'Session banna. Se connecter ene.',
  },

  bq: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Ka ke ene...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia ye sran elemon wle, tooro te. Kunnafoniw te tooro kene bee.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Je ke',
    'login.subtitle': 'Sran elemon tooro Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunafon',
    'login.passwordPlaceholder': 'I kunafon',
    'login.submit': 'Je ke',
    'login.forgotPassword': 'Kunafon wolo ?',
    'login.noAccount': 'I te komen te ?',
    'login.createAccount': 'Komen ke',
    'login.errorEmpty': 'Beew ke.',
    'login.errorGeneric': 'Je ke banna.',
    'login.orGoogle': 'Google je ke',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Komen ke',
    'register.subtitle': 'Sanovia sran elemon tooro',
    'register.name': 'I togo',
    'register.namePlaceholder': 'I togo',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunafon',
    'register.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'register.confirmPassword': 'Kunafon soro',
    'register.confirmPasswordPlaceholder': 'Kunafon soro',
    'register.language': 'Kan',
    'register.submit': 'Komen ke',
    'register.hasAccount': 'I te komen te ?',
    'register.login': 'Je ke',
    'register.errorEmpty': 'Beew ke.',
    'register.errorPasswordLength': 'Kunafon 8 kene.',
    'register.errorPasswordStrength': 'Kunafon nufelen, ninsoron ni nombere ke.',
    'register.errorPasswordMismatch': 'Kunafonw te moro.',
    'register.errorGeneric': 'Komen banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunafon wolo ?',
    'forgot.subtitle': 'Kunafon elemon',
    'forgot.description': 'I email ke.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunafon link min bee',
    'forgot.backToLogin': '← Je ke',
    'forgot.errorEmpty': 'I email ke.',
    'forgot.success': 'Email bee. I email ke.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP te.',
    'forgot.useToken': 'Token soro',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunafon elemon',
    'reset.subtitle': 'Kunafon elemon',
    'reset.description': 'Kunafon kene.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token ke...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunafon elemon',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufelen, 1 nombere',
    'reset.confirmPassword': 'Kunafon soro',
    'reset.confirmPasswordPlaceholder': 'Kunafon soro',
    'reset.submit': 'Kunafon elemon',
    'reset.backToLogin': '← Je ke',
    'reset.expiry': 'Link 1 l\'ere.',
    'reset.successTitle': 'Kunafon kene !',
    'reset.successMessage': 'Kunafon kene. Je ke.',
    'reset.loginButton': 'Je ke',
    'reset.errorNoToken': 'Token ke.',
    'reset.errorEmpty': 'Beew ke.',
    'reset.errorPasswordLength': 'Kunafon 8 kene.',
    'reset.errorPasswordUpper': 'Kunafon nufelen ke.',
    'reset.errorPasswordDigit': 'Kunafon nombere ke.',
    'reset.errorPasswordMismatch': 'Kunafonw te moro.',
    'reset.errorMismatch': 'Kunafonw te moro.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! Sanovia ye, sran elemon wle.\nSran kunnafoni bee wle.',
    'chat.voiceHint': 'I be meseje were fo ! Mekro ke.\n{lang} fo, n\'a repon.',
    'chat.disclaimer': 'Tooro te. Kunnafoni ye.\nTooro kene.',
    'chat.suggestion1': 'Oro yelema ?',
    'chat.suggestion2': 'Glo globele soronow',
    'chat.suggestion3': 'Paludisme soronow',
    'chat.placeholder': 'Sran fon...',
    'chat.newChat': 'Kunnafoni elemon',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni te.\nSran fon !',
    'chat.newConversation': 'Kunnafoni elemon',
    'chat.logout': 'Kene',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FON',
    'voice.cancel': 'Tebe',
    'voice.send': 'Min bee',
    'voice.cancelTooltip': 'Fon tebe',
    'voice.sendTooltip': 'Meseje min bee',
    'voice.transcribing': 'Kunnafon ke {lang}...',
    'voice.tooShort': 'Fon kene. Fo ene.',
    'voice.noSpeech': 'Parole te. Soro ene.',
    'voice.transcriptionError': 'Kunnafon banna.',
    'voice.noMic': 'Mekro te. Permissions ke.',
    'voice.micTooltip': 'Meseje fo',
    'voice.languageHint': 'Kan : {lang} — Kan elemon',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fo',
    'tts.generating': 'Ka ke ene...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Teme',
    'tts.replay': 'Soro ene',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banje CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kenemokon',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Sran',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Sran',
    'category.premiers_secours': 'Banje',
    'category.grossesse': 'Glo',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Lela',
    'date.yesterday': 'Deme',
    'date.daysAgo': '{n} lela',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion ke.',
    'error.session': 'Session banna. Je ke ene.',
  },
}

// ============================================================
// FONCTIONS PUBLIQUES
// ============================================================

/**
 * Traduit une clé dans la langue donnée
 * Supporte les variables : t('chat.welcome', 'fr', { name: 'Kofi', lang: 'Baoulé' })
 */
export function t(key: string, language: Language = 'fr', vars?: Record<string, string>): string {
  let text = translations[language]?.[key] || translations.fr[key] || key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
  }

  return text
}

/**
 * Retourne les infos d'une langue
 */
export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0]
}

/**
 * Retourne le label d'une langue dans sa propre langue
 */
export function getLanguageLabel(code: Language): string {
  return getLanguageInfo(code).label
}
