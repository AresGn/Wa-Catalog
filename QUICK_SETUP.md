# ⚡ Quick Database Setup

## 🚀 3 Commandes pour Démarrer

### 1️⃣ Créer les Tables Automatiquement

```bash
npm run db:init
```

**Le script va:**
- Vous demander le password de votre DB Supabase
- Créer automatiquement 3 tables (vendors, products, search_logs)
- Créer les indexes de performance
- Afficher "✅ Database initialized successfully!"

### 2️⃣ Lancer le Dashboard

```bash
npm run admin:dev
```

Puis ouvrez: **http://localhost:3000**

### 3️⃣ (Optionnel) Ajouter des Données de Test

```bash
npm run db:seed
```

Ajoute 3 vendeurs et 3 produits d'exemple.

---

## 🔑 Où Trouver le Password de la DB?

Aller à: https://supabase.com/dashboard

1. Cliquez sur votre projet
2. Settings → Database → Connection pooling
3. Ou Settings → Database → Connection string

Le password est défini lors de la création du projet.

**Si vous l'avez oublié:**
1. Settings → Database
2. "Reset database password" 
3. Créer un nouveau password

---

## ✅ Checkliste

- [x] Script Node.js crée les tables automatiquement
- [x] 3 tables: vendors, products, search_logs
- [x] Indexes créés pour performance
- [x] Gestion d'erreurs correcte
- [x] Dashboard prêt à l'emploi

---

## 🆘 Erreurs Courants

### "ENOTFOUND" ou "Cannot reach database"
- Vérifier la connexion internet
- Vérifier que le projet Supabase est actif
- Vérifier SUPABASE_URL dans .env

### "28P01" ou "Wrong password"
- Vérifier le password saisi est correct
- Attention aux caractères spéciaux (!, @, #, etc.)
- Si doute, réinitialiser le password dans Supabase

### "MODULE_NOT_FOUND: pg"
- Le script l'installe automatiquement

---

## 📝 Commandes Disponibles

```bash
npm run admin:dev        # Lancer dashboard (dev)
npm run admin            # Lancer dashboard (prod)
npm run db:init          # Créer les tables 🆕
npm run db:setup         # Info sur les tables
npm run db:seed          # Ajouter données de test
```

---

**C'est tout! Lancez `npm run db:init` maintenant. 🚀**
