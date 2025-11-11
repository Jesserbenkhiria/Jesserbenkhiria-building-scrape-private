import { config } from 'dotenv';
import { z } from 'zod';
import { resolve } from 'path';

// Charger le fichier .env avec chemin explicite
const envPath = resolve(process.cwd(), '.env');
const result = config({ path: envPath });

if (result.error) {
  console.error('⚠️  Impossible de charger le fichier .env:', result.error.message);
  console.error('   Chemin cherché:', envPath);
} else {
  console.log('✅ Fichier .env chargé depuis:', envPath);
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  BING_KEY: z.string().optional(),
  GOOGLE_PLACES_KEY: z.string().optional(),
  USE_SERPER: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
  SERPER_KEY: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default('60'),
  REQUESTS_PER_SECOND: z.string().transform(Number).default('3'),
  MONGO_URI: z.string().optional(),
  JWT_SECRET: z.string().default('topsecret2025'),
});

const parseEnv = () => {
  // Debug: afficher les variables importantes
  console.log("🔍 Variables d'environnement détectées:");
  console.log(
    '   GOOGLE_PLACES_KEY:',
    process.env.GOOGLE_PLACES_KEY ? '✅ Définie' : '❌ Non définie'
  );
  console.log('   BING_KEY:', process.env.BING_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('   SERPER_KEY:', process.env.SERPER_KEY ? '✅ Définie' : '❌ Non définie');
  console.log('   SERPAPI_KEY:', process.env.SERPAPI_KEY ? '✅ Définie' : '❌ Non définie');

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Configuration invalide:', result.error.format());
    throw new Error('Configuration invalide');
  }

  return result.data;
};

export const env = parseEnv();

export const validateApiKeys = () => {
  const missing = [];
  const available = [];

  if (!env.BING_KEY) {
    missing.push('BING_KEY');
  } else {
    available.push('BING_KEY');
  }

  if (!env.GOOGLE_PLACES_KEY) {
    missing.push('GOOGLE_PLACES_KEY');
  } else {
    available.push('GOOGLE_PLACES_KEY');
  }

  if (!env.SERPER_KEY) {
    missing.push('SERPER_KEY');
  } else {
    available.push('SERPER_KEY');
  }

  if (!env.SERPAPI_KEY) {
    missing.push('SERPAPI_KEY');
  } else {
    available.push('SERPAPI_KEY');
  }

  return {
    valid: available.length > 0, // Au moins une clé API doit être disponible
    missing,
    available,
  };
};
