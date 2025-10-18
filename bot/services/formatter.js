class MessageFormatter {
  // Format vendor info for WhatsApp message
  formatVendorInfo(vendor) {
    let message = `🏪 *${vendor.name}*\n`;
    message += `📍 ${vendor.city}\n`;
    
    if (vendor.category && vendor.category.length > 0) {
      message += `📦 Catégories: ${vendor.category.join(', ')}\n`;
    }
    
    if (vendor.verified) {
      message += `✅ Vendeur Vérifié\n`;
    }
    
    if (vendor.rating_average > 0) {
      message += `⭐ Note: ${vendor.rating_average}/5 (${vendor.rating_count} avis)\n`;
    }
    
    message += `📱 WhatsApp: wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}\n`;
    
    return message;
  }

  // Format product info for WhatsApp message
  formatProductInfo(product, includeVendor = false) {
    let message = `📦 *${product.name}*\n`;
    message += `💵 Prix: ${this.formatPrice(product.price)} FCFA\n`;
    
    if (product.description) {
      message += `📝 ${product.description}\n`;
    }
    
    message += `📂 Catégorie: ${product.category}\n`;
    message += `📊 État: ${product.condition || 'Neuf'}\n`;
    
    if (product.availability === 'in_stock') {
      message += `✅ En stock\n`;
    } else {
      message += `❌ Rupture de stock\n`;
    }
    
    if (includeVendor && product.vendor) {
      message += `\n👤 *Vendeur:*\n`;
      message += `• ${product.vendor.name} (${product.vendor.city})\n`;
      message += `• WhatsApp: wa.me/${product.vendor.whatsapp_number.replace(/\D/g, '')}\n`;
    }
    
    return message;
  }

  // Format search results
  formatSearchResults(products, vendors, query) {
    if (products.length === 0 && vendors.length === 0) {
      return this.formatNoResults(query);
    }

    let message = `🔍 *Résultats pour "${query}"*\n\n`;
    
    // Format products
    if (products.length > 0) {
      message += `📦 *PRODUITS TROUVÉS (${products.length}):*\n`;
      message += `${'─'.repeat(25)}\n\n`;
      
      products.slice(0, 5).forEach((product, index) => {
        message += `${index + 1}. ${this.formatProductInfo(product, true)}\n`;
        message += `${'─'.repeat(25)}\n\n`;
      });
      
      if (products.length > 5) {
        message += `_... et ${products.length - 5} autres produits_\n\n`;
      }
    }
    
    // Format vendors
    if (vendors.length > 0) {
      message += `\n🏪 *VENDEURS CORRESPONDANTS (${vendors.length}):*\n`;
      message += `${'─'.repeat(25)}\n\n`;
      
      vendors.slice(0, 3).forEach((vendor, index) => {
        message += `${index + 1}. ${this.formatVendorInfo(vendor)}\n`;
        message += `${'─'.repeat(25)}\n\n`;
      });
      
      if (vendors.length > 3) {
        message += `_... et ${vendors.length - 3} autres vendeurs_\n\n`;
      }
    }
    
    message += `\n💡 *Astuce:* Cliquez sur les liens WhatsApp pour contacter directement les vendeurs!`;
    
    return message;
  }

  // Format no results message
  formatNoResults(query) {
    return `😔 Aucun résultat pour *"${query}"*\n\n` +
           `💡 *Suggestions:*\n` +
           `• Vérifiez l'orthographe\n` +
           `• Essayez des termes plus généraux\n` +
           `• Utilisez des mots-clés simples\n\n` +
           `Exemples: "téléphone", "chaussures", "ordinateur"`;
  }

  // Format price with thousands separator
  formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Format help message
  formatHelpMessage() {
    return `🤖 *WA-CATALOG BOT - AIDE*\n\n` +
           `Je peux vous aider à trouver:\n` +
           `• 🛍️ Produits spécifiques\n` +
           `• 🏪 Vendeurs par catégorie\n` +
           `• 📍 Commerces par ville\n\n` +
           `*COMMENT RECHERCHER:*\n` +
           `Envoyez simplement ce que vous cherchez:\n` +
           `• "iPhone 13"\n` +
           `• "Chaussures Nike"\n` +
           `• "Vendeurs à Cotonou"\n` +
           `• "Restaurants à Parakou"\n\n` +
           `*COMMANDES DISPONIBLES:*\n` +
           `• *aide* ou *help* - Afficher cette aide\n` +
           `• *vendeurs* - Liste des vendeurs vérifiés\n` +
           `• *catégories* - Voir toutes les catégories\n` +
           `• *nouveau* - Produits récemment ajoutés\n\n` +
           `📞 Support: support@wa-catalog.com`;
  }

  // Format welcome message
  formatWelcomeMessage(userName = null) {
    const greeting = userName ? `Bonjour ${userName}` : 'Bonjour';
    return `👋 ${greeting}!\n\n` +
           `Bienvenue sur *WA-CATALOG* 🛍️\n` +
           `Votre marketplace WhatsApp au Bénin!\n\n` +
           `Je peux vous aider à trouver:\n` +
           `• Des produits\n` +
           `• Des vendeurs\n` +
           `• Des services\n\n` +
           `💬 *Que recherchez-vous aujourd'hui?*\n\n` +
           `_Tapez "aide" pour plus d'informations_`;
  }

  // Format vendor list
  formatVendorsList(vendors, category = null) {
    if (vendors.length === 0) {
      return `😔 Aucun vendeur trouvé${category ? ` dans la catégorie "${category}"` : ''}.`;
    }

    let message = category ? 
      `🏪 *Vendeurs - ${category}*\n\n` :
      `🏪 *Tous les vendeurs vérifiés*\n\n`;
    
    vendors.forEach((vendor, index) => {
      message += `${index + 1}. *${vendor.name}*\n`;
      message += `   📍 ${vendor.city}\n`;
      message += `   📱 wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}\n`;
      
      if (vendor.rating_average > 0) {
        message += `   ⭐ ${vendor.rating_average}/5\n`;
      }
      
      message += '\n';
    });
    
    return message;
  }

  // Format categories list
  formatCategoriesList(categories) {
    let message = `📂 *CATÉGORIES DISPONIBLES*\n\n`;
    
    const categoryEmojis = {
      'Électronique': '📱',
      'Mode': '👕',
      'Alimentation': '🍕',
      'Beauté': '💄',
      'Maison': '🏠',
      'Auto/Moto': '🚗',
      'Services': '🔧',
      'Santé': '💊',
      'Sport': '⚽',
      'Éducation': '📚'
    };
    
    categories.forEach((category, index) => {
      const emoji = categoryEmojis[category] || '📦';
      message += `${emoji} ${index + 1}. ${category}\n`;
    });
    
    message += `\n💡 Envoyez le nom d'une catégorie pour voir les vendeurs`;
    
    return message;
  }

  // Format error message
  formatErrorMessage(error = null) {
    return `❌ *Oops! Une erreur s'est produite*\n\n` +
           `Nous n'avons pas pu traiter votre demande.\n` +
           `Veuillez réessayer dans quelques instants.\n\n` +
           `Si le problème persiste, contactez le support.\n` +
           `_Code erreur: ${error?.code || 'UNKNOWN'}_`;
  }

  // Format rate limit message
  formatRateLimitMessage() {
    return `⏱️ *Trop de requêtes!*\n\n` +
           `Vous avez atteint la limite de messages.\n` +
           `Veuillez patienter quelques secondes avant de réessayer.\n\n` +
           `_Cette limite est mise en place pour garantir une bonne expérience à tous les utilisateurs._`;
  }

  // Format typing indicator
  getTypingIndicator() {
    return '✍️ _En train de chercher..._';
  }

  // Format product added notification
  formatProductAddedNotification(product) {
    return `🆕 *Nouveau produit ajouté!*\n\n` +
           `${this.formatProductInfo(product, true)}\n\n` +
           `🔔 _Vous recevez cette notification car vous suivez cette catégorie_`;
  }

  // Format order confirmation
  formatOrderConfirmation(vendor, product, userPhone) {
    return `✅ *Demande envoyée!*\n\n` +
           `Votre intérêt pour *${product.name}* a été transmis à *${vendor.name}*.\n\n` +
           `Le vendeur vous contactera bientôt au numéro:\n` +
           `📱 ${userPhone}\n\n` +
           `_Merci d'utiliser WA-Catalog!_`;
  }
}

module.exports = new MessageFormatter();