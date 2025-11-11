/**
 * Convertit un tableau d'objets en format CSV
 * @param {Array} data - Les données à convertir
 * @param {Array} columns - Les colonnes à inclure (optionnel)
 * @returns {string} - Le contenu CSV
 */
export function convertToCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Si aucune colonne n'est spécifiée, utiliser toutes les clés du premier objet
  const headers = columns || Object.keys(data[0]);
  
  // Créer la ligne d'en-tête
  const csvHeader = headers.join(',');
  
  // Créer les lignes de données
  const csvRows = data.map(item => {
    return headers.map(header => {
      let value = item[header];
      
      // Gérer les valeurs null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Gérer les tableaux
      if (Array.isArray(value)) {
        value = value.join('; ');
      }
      
      // Gérer les objets
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      // Convertir en chaîne et échapper les guillemets
      value = String(value).replace(/"/g, '""');
      
      // Entourer de guillemets si contient une virgule, un guillemet ou un saut de ligne
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combiner l'en-tête et les lignes
  return [csvHeader, ...csvRows].join('\n');
}

/**
 * Télécharge un fichier CSV
 * @param {string} csvContent - Le contenu CSV
 * @param {string} filename - Le nom du fichier
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
  // Ajouter le BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Créer un lien de téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL
  URL.revokeObjectURL(url);
}

/**
 * Formate les données d'entreprise pour l'export CSV
 * @param {Array} companies - Les entreprises à formater
 * @returns {Array} - Les données formatées
 */
export function formatCompaniesForCSV(companies) {
  return companies.map(company => ({
    Nom: company.name || '',
    Catégorie: company.category || '',
    'Mot-clé': company.searchKeyword || '',
    Téléphones: (company.phones || []).join('; '),
    Emails: (company.emails || []).join('; '),
    'Site Web': company.website || '',
    'Liens Sociaux': (company.social || []).join('; '),
    Adresse: company.address || '',
    Ville: company.city || '',
    Pays: company.country || '',
    Latitude: company.lat || '',
    Longitude: company.lng || '',
    Confiance: company.confidence ? `${Math.round(company.confidence * 100)}%` : '',
    'Date de création': company.created_at || '',
    'Date de mise à jour': company.updated_at || '',
  }));
}

/**
 * Génère un nom de fichier avec la date et l'heure
 * @param {string} prefix - Le préfixe du nom de fichier
 * @returns {string} - Le nom de fichier
 */
export function generateFilename(prefix = 'export') {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${date}_${time}.csv`;
}

