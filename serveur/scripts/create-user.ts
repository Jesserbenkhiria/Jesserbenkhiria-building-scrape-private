import { initMongo, closeMongo } from '../src/store/mongo';
import { createUser, initUsersCollection } from '../src/store/user-repo';
import { env } from '../src/config/env';

async function main() {
  const username = process.argv[2] || 'zied';
  const password = process.argv[3] || 'topsecret2025';

  try {
    console.log('🔌 Connexion à MongoDB...');
    
    if (!env.MONGO_URI) {
      console.error('❌ MONGO_URI n\'est pas configuré dans le fichier .env');
      process.exit(1);
    }

    await initMongo();
    await initUsersCollection();
    console.log('✅ MongoDB connecté');

    console.log(`\n👤 Création de l'utilisateur "${username}"...`);
    
    try {
      const user = await createUser(username, password);
      console.log('✅ Utilisateur créé avec succès !');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Créé le: ${user.created_at}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('existe déjà')) {
        console.log('⚠️  Cet utilisateur existe déjà');
      } else {
        throw error;
      }
    }

    await closeMongo();
    console.log('\n✅ Terminé');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();

