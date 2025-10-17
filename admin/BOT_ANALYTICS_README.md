# Bot Analytics Dashboard

## 🤖 Overview

La nouvelle page Bot Analytics du dashboard admin affiche les statistiques et performances du bot WhatsApp, notamment:

- **Total Users**: Nombre total d'utilisateurs ayant interagi avec le bot
- **Total Searches**: Nombre total de recherches effectuées
- **Link Clicks**: Nombre de clics sur les liens de vendeurs
- **Conversion Rate**: Taux de conversion (recherches → contacts vendeur)

## 📊 Features

### 1. Overview Stats
4 cartes principales affichant les métriques clés:
- Total d'utilisateurs et d'actifs aujourd'hui
- Total de recherches (avec celles d'aujourd'hui)
- Total de clics sur les liens
- Taux de conversion global

### 2. Top Search Keywords
Liste des mots-clés les plus recherchés avec:
- Classement numéroté
- Nombre de recherches par mot-clé
- Barre de progression visuelle

### 3. Top Vendors (Most Viewed)
Liste des vendeurs les plus consultés avec:
- Classement
- Nom et ville du vendeur
- Nombre de visualisations
- Nombre de clics reçus

### 4. Daily Activity Chart
Graphique des 7 derniers jours affichant:
- Nombre de recherches par jour (vert)
- Nombre de clics par jour (bleu)
- Nombre d'utilisateurs actifs par jour (orange)

### 5. Performance Metrics
4 sections détaillées:
- **Performance**: Temps de réponse, taux de succès/erreur
- **User Engagement**: Searches/user, clicks/user, taux de retour
- **Search Categories**: Types de requêtes (produits, vendeurs, aide, etc.)

### 6. Recent Searches
Liste des 15 dernières recherches avec:
- Heure exacte
- Requête utilisateur
- Nombre de résultats retournés
- Numéro de téléphone (masqué)

## 🔌 API Endpoints

Le bot peut envoyer des données via les endpoints suivants:

### Log une recherche
```bash
POST /api/bot/log-search
Content-Type: application/json

{
  "user_phone": "22997000000",
  "query": "iPhone 13",
  "results_count": 5,
  "response_time": 1200
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_phone": "22997000000",
    "query": "iPhone 13",
    "results_count": 5,
    "response_time": 1200,
    "created_at": "2025-01-18T10:30:00Z"
  }
}
```

### Log un clic sur un vendeur
```bash
POST /api/bot/log-click
Content-Type: application/json

{
  "user_phone": "22997000000",
  "vendor_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "user_phone": "22997000000",
    "vendor_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-01-18T10:35:00Z"
  }
}
```

### Récupère les stats globales
```bash
GET /api/bot/stats
```

### Récupère les stats pour une période donnée
```bash
GET /api/bot/stats/period/7
```
(Retourne les stats des 7 derniers jours)

## 🗄️ Database Schema

### search_logs table
```sql
CREATE TABLE search_logs (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  user_phone TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  response_time INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_user_phone ON search_logs(user_phone);
CREATE INDEX idx_search_logs_query ON search_logs(query);
```

### vendor_clicks table
```sql
CREATE TABLE vendor_clicks (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  user_phone TEXT NOT NULL,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendor_clicks_created_at ON vendor_clicks(created_at DESC);
CREATE INDEX idx_vendor_clicks_vendor_id ON vendor_clicks(vendor_id);
CREATE INDEX idx_vendor_clicks_user_phone ON vendor_clicks(user_phone);
```

## 🚀 Setup

### 1. Créer les tables Supabase

Allez dans Supabase SQL Editor et exécutez les scripts fournis ci-dessus, ou exécutez:

```bash
node admin/scripts/createBotTables.js
```

### 2. Intégrer le bot

Dans votre bot WhatsApp (`bot/index.js` ou `bot/handlers/messageHandler.js`), ajoutez les appels API:

```javascript
const axios = require('axios');

const ADMIN_API_URL = 'http://localhost:3000/api/bot';

// Après une recherche
const logSearch = async (userPhone, query, resultsCount, responseTime) => {
  try {
    await axios.post(`${ADMIN_API_URL}/log-search`, {
      user_phone: userPhone,
      query,
      results_count: resultsCount,
      response_time: responseTime
    });
  } catch (error) {
    console.error('Failed to log search:', error.message);
  }
};

// Quand l'utilisateur clique sur un vendeur
const logVendorClick = async (userPhone, vendorId) => {
  try {
    await axios.post(`${ADMIN_API_URL}/log-click`, {
      user_phone: userPhone,
      vendor_id: vendorId
    });
  } catch (error) {
    console.error('Failed to log click:', error.message);
  }
};

// Utilisation dans le message handler
const startTime = Date.now();
const results = await searchProducts(userMessage);
const responseTime = Date.now() - startTime;

await logSearch(
  message.from,
  userMessage,
  results.length,
  responseTime
);
```

### 3. Masquage des données sensibles

Les numéros de téléphone sont automatiquement masqués pour la confidentialité:
- Affichage: `224****000`
- Stockage: Complet dans la base de données

## 📈 Métriques Calculées

### Taux de Conversion
```
Conversion Rate = (Total Clicks / Total Searches) × 100%
```

### Engagement par Utilisateur
```
Avg Searches/User = Total Searches / Unique Users
Avg Clicks/User = Total Clicks / Unique Users
```

### Taux de Retour
```
Return Rate = (Users with 2+ searches) / Total Users × 100%
```

## 🔄 Données de Placeholder

En attendant que le bot envoie les vraies données, le système génère:
- Données fictives pour les activités journalières
- Listes d'exemple de vendeurs top
- Mots-clés d'exemple

Une fois que le bot commencera à envoyer des données, tout sera remplacé par les vraies statistiques.

## 🎨 Design

La page Bot Analytics utilise:
- **Sidebar**: Nouvelle icône 🤖 Robot
- **Cards**: Design moderne avec gradients et ombres
- **Charts**: Graphiques en barres pour les activités journalières
- **Lists**: Affichage des top keywords et vendeurs
- **Metrics**: Grille de métriques détaillées
- **Responsive**: Adaptée pour mobile, tablet et desktop

## 🔐 Sécurité

- Numéros de téléphone masqués pour la confidentialité
- Les endpoints API acceptent les données du bot seulement
- Les données sont stockées avec timestamps pour l'audit
- Les indexes sur les colonnes importantes pour les performances

## 📝 Logs et Débogage

Consultez les logs en console ou en base de données:

```javascript
// Vérifier les dernières recherches
supabase
  .from('search_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

// Compter les clics par vendeur
supabase
  .from('vendor_clicks')
  .select('vendor_id, count(*)')
  .group_by('vendor_id');
```

## 🎯 Prochaines Améliorations

- [ ] Filtrage par période (date picker)
- [ ] Export des données (CSV, PDF)
- [ ] Alertes sur anomalies
- [ ] Comparaison périodes (semaine vs semaine)
- [ ] Heatmap d'activité
- [ ] Intégration webhooks

---

**Version**: 1.0  
**Dernière mise à jour**: Janvier 2025
