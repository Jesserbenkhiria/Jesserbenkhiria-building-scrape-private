import { decode } from 'he';
import type { ExtractedContacts } from '../types';

/**
 * Extrait les emails et téléphones d'un HTML
 */
export function extractContacts(html: string): ExtractedContacts {
  // Décoder les entités HTML
  const text = decode(html);
  
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  
  return { emails, phones };
}

/**
 * Extrait les adresses email
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  
  // Filtrer les emails communs non pertinents
  const filtered = matches.filter(email => {
    const lower = email.toLowerCase();
    return !lower.includes('example.com') &&
           !lower.includes('yourdomain.com') &&
           !lower.includes('sentry.io') &&
           !lower.includes('google.com') &&
           !lower.includes('facebook.com');
  });
  
  // Dédoublonner
  return Array.from(new Set(filtered));
}

/**
 * Extrait les numéros de téléphone tunisiens
 */
function extractPhones(text: string): string[] {
  const phones: string[] = [];
  
  // Pattern pour les numéros internationaux tunisiens
  const intlPatterns = [
    /\+216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
    /00216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
  ];
  
  // Pattern pour les numéros locaux à 8 chiffres
  const localPattern = /\b\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;
  
  // Extraire les numéros internationaux
  for (const pattern of intlPatterns) {
    const matches = text.match(pattern) || [];
    phones.push(...matches);
  }
  
  // Extraire les numéros locaux
  const localMatches = text.match(localPattern) || [];
  phones.push(...localMatches);
  
  // Nettoyer et dédoublonner
  const cleaned = phones.map(p => p.replace(/[^\d+]/g, ''));
  return Array.from(new Set(cleaned));
}

/**
 * Trouve les liens vers les réseaux sociaux
 */
export function findSocialLinks(html: string): string[] {
  const socialDomains = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
  ];
  
  const links: string[] = [];
  
  // Pattern pour extraire les URLs
  const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
  const matches = html.match(urlPattern) || [];
  
  for (const url of matches) {
    try {
      const parsed = new URL(url);
      if (socialDomains.some(domain => parsed.hostname.includes(domain))) {
        // Nettoyer l'URL (enlever les query params tracking)
        const clean = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
        links.push(clean);
      }
    } catch {
      // Ignorer les URLs invalides
    }
  }
  
  return Array.from(new Set(links));
}

/**
 * Nettoie le HTML pour en extraire le texte brut
 */
export function stripHtml(html: string): string {
  // Supprimer les scripts et styles
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Supprimer les balises HTML
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Décoder les entités HTML
  text = decode(text);
  
  // Nettoyer les espaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

