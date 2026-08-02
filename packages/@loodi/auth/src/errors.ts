export function toUserFacingAuthError(message: string): string {
  if (message.includes('profiles_handle_key') || message.includes('duplicate key')) {
    return 'Ce nom de joueur est déjà pris. Et si tu en essayais un autre ?'
  }
  if (message.includes('This handle is reserved')) return 'Ce handle est réservé. Essaie-en un autre.'
  if (message.includes('One of email or phone must be set')) return 'Indique ton e-mail pour recevoir un lien de connexion.'
  if (message.includes('rate limit')) return 'Trop de messages ont été envoyés. Réessaie un peu plus tard.'
  if (message.includes('Email address is already registered')) return 'Cette adresse e-mail est déjà associée à un compte Loodi.'
  if (message.includes('Error sending confirmation email')) return 'L’e-mail de confirmation n’a pas pu être envoyé. Réessaie un peu plus tard.'
  if (message.includes('Identity is already linked')) return 'Ce compte Google est déjà associé à un autre compte Loodi.'
  if (message.toLowerCase().includes('manual linking')) return 'L’association de compte Google doit être activée dans les réglages Supabase.'
  return 'Une erreur est survenue. Réessaie dans un instant.'
}
