# WA-Catalog Bot - Architecture Intégrée avec Base de Données

## 🚀 Vue d'ensemble

Le bot WhatsApp est maintenant entièrement intégré avec Supabase et le dashboard admin. L'architecture suit les principes de code propre et maintenable avec des composants séparés et scalables.

## 📁 Structure du Bot

```
bot/
├── index.js                    # Point d'entrée principal
├── handlers/
│   ├── messageHandler.js       # Gestion des messages
│   └── eventHandler.js         # Gestion des événements WhatsApp
└── services/
    ├── supabase.js            # Service de connexion DB
    ├── formatter.js           # Formatage des messages
    └── gemini.js              # Service IA (Gemini)
```

## 📊 Tables de Base de Données

### Tables Principales
- **vendors** - Informations vendeurs
- **products** - Catalogue produits  
- **search_logs** - Historique des recherches

### Tables Bot (Nouvelles)
- **bot_sessions** - Sessions WhatsApp authentifiées
- **bot_messages** - Historique complet des messages
- **bot_users** - Utilisateurs uniques du bot
- **bot_analytics** - Événements et métriques
- **vendor_clicks** - Tracking des clics vendeurs
- **bot_config** - Configuration du bot

## 🔧 Installation et Configuration

### 1. Initialiser les tables du bot
```bash
npm run db:init-bot
```
Entrez votre mot de passe Supabase quand demandé.

### 2. Démarrer le bot
```bash
npm start
# ou en mode développement
npm run dev
```

### 3. Démarrer le dashboard admin
```bash
npm run admin:dev
```
Accédez à http://localhost:3000

## 🤖 Fonctionnalités du Bot

### Messages Supportés
- **Recherche produits** : "iPhone 13", "baskets Nike"
- **Recherche vendeurs** : "vendeurs à Cotonou"
- **Commandes** : 
  - `aide` ou `help` - Affiche l'aide
  - `vendeurs` - Liste des vendeurs
  - `catégories` - Catégories disponibles
  - `nouveau` - Nouveaux produits

### Intelligence Artificielle (Gemini)
- Analyse d'intention des messages
- Extraction de mots-clés
- Amélioration des requêtes
- Génération de réponses personnalisées
- Détection de langue
- Modération de contenu

### Tracking et Analytics
- ✅ Tous les messages sont enregistrés
- ✅ Sessions utilisateurs trackées
- ✅ Métriques de performance
- ✅ Taux de conversion
- ✅ Temps de réponse

## 📈 Dashboard Admin - Onglet Bot

Le dashboard affiche maintenant des **données réelles** :

### Statistiques Globales
- Total utilisateurs actifs
- Nombre de recherches
- Taux de conversion
- Temps de réponse moyen

### Visualisations
- Top mots-clés recherchés
- Vendeurs les plus vus/cliqués
- Activité journalière (7 jours)
- Recherches récentes en temps réel

### Métriques Détaillées
- Performance (temps réponse, taux succès)
- Engagement utilisateur
- Catégories de recherche
- Historique des conversations

## 🔄 Flux de Données

1. **Réception Message** → Bot WhatsApp
2. **Analyse IA** → Gemini détermine l'intention
3. **Recherche DB** → Requête Supabase
4. **Formatage** → Message structuré WhatsApp
5. **Analytics** → Logging dans DB
6. **Dashboard** → Visualisation temps réel

## 🛡️ Sécurité et Performance

### Rate Limiting
- Max 10 messages/minute par utilisateur
- Protection contre le spam

### Gestion d'Erreurs
- Reconnexion automatique
- Logging des erreurs dans DB
- Graceful shutdown

### Session Management
- Sessions persistantes (LocalAuth)
- Sauvegarde en DB
- Récupération après crash

## 📝 Commandes Utiles

```bash
# Tables de base de données
npm run db:init          # Tables principales
npm run db:init-bot       # Tables du bot
npm run db:seed           # Données de test

# Développement
npm run dev               # Bot en mode dev
npm run admin:dev         # Dashboard en mode dev

# Production
npm start                 # Démarrer le bot
npm run admin             # Démarrer le dashboard
```

## 🔍 Debug et Monitoring

### Logs Console
Le bot affiche :
- 📨 Messages reçus
- ✅ Actions effectuées
- ❌ Erreurs rencontrées
- 📊 Métriques temps réel

### Base de Données
Consultez les tables :
- `bot_analytics` pour les événements
- `bot_messages` pour l'historique
- `search_logs` pour les recherches

### Dashboard
Accédez à `/bot` dans le dashboard admin pour voir toutes les statistiques en temps réel.

## 🚨 Troubleshooting

### Bot ne démarre pas
1. Vérifiez les variables d'environnement dans `.env`
2. Assurez-vous que les tables sont créées (`npm run db:init-bot`)
3. Vérifiez que Chromium est installé

### Pas de données dans le dashboard
1. Vérifiez que le bot est connecté à la DB
2. Envoyez quelques messages test
3. Rafraîchissez la page du dashboard

### Erreur de connexion DB
1. Vérifiez l'URL Supabase dans `.env`
2. Testez avec `npm run db:init-bot`
3. Vérifiez les permissions sur Supabase

## 🎯 Prochaines Étapes

- [ ] Ajouter support multilingue complet
- [ ] Implémenter cache Redis
- [ ] Webhooks pour notifications
- [ ] API REST pour intégrations
- [ ] Dashboard temps réel (WebSocket)
- [ ] Export des analytics

## 💡 Architecture Scalable

Le système est conçu pour :
- **Haute disponibilité** : Reconnexion automatique
- **Performance** : Requêtes optimisées, indexes DB
- **Maintenabilité** : Code modulaire, services séparés
- **Extensibilité** : Facile d'ajouter de nouvelles fonctionnalités

---

**Note** : Cette architecture respecte les bonnes pratiques de développement avec séparation des responsabilités, gestion d'erreurs robuste, et monitoring complet.
