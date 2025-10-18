const supabase = require('../config/supabase');

class BotService {
  // Récupère les stats globales du bot
  async getStats() {
    console.log('📊 Fetching bot stats...');
    
    // Initialiser les stats avec des valeurs par défaut
    const stats = {
      totalUsers: 0,
      activeToday: 0,
      totalSearches: 0,
      searchesToday: 0,
      totalClicks: 0,
      avgResponseTime: 0,
      conversionRate: 0,
      topSearches: {},
      topVendors: [],
      dailyActivity: [],
      maxResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      avgSearchesPerUser: 0,
      avgClicksPerUser: 0,
      returnRate: 0,
      avgSessionDuration: 0,
      productSearches: 0,
      vendorSearches: 0,
      helpRequests: 0,
      otherQueries: 0,
      recentSearches: []
    };
    
    try {

      // Récupérer les vraies données depuis la base de données
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 1. Récupérer les stats des utilisateurs
      try {
        const { data: users, error: userError } = await supabase
          .from('bot_users')
          .select('*');
        
        if (!userError && users) {
          stats.totalUsers = users.length;
          
          // Utilisateurs actifs aujourd'hui
          stats.activeToday = users.filter(
            user => new Date(user.last_message_at) >= today
          ).length;
          
          // Calculer les moyennes
          if (users.length > 0) {
            const totalSearches = users.reduce((sum, user) => sum + (user.total_searches || 0), 0);
            const totalClicks = users.reduce((sum, user) => sum + (user.total_clicks || 0), 0);
            stats.avgSearchesPerUser = (totalSearches / users.length).toFixed(1);
            stats.avgClicksPerUser = (totalClicks / users.length).toFixed(1);
            
            // Taux de retour (utilisateurs avec plus d'un message)
            const returningUsers = users.filter(user => user.total_messages > 1).length;
            stats.returnRate = users.length > 0 ? ((returningUsers / users.length) * 100).toFixed(1) : 0;
          }
        }
      } catch (e) {
        console.log('Error fetching user stats:', e);
      }
      
      // 2. Récupérer les stats de recherche
      try {
        const { data: searchLogs, error: logError } = await supabase
          .from('search_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!logError && searchLogs) {
          stats.totalSearches = searchLogs.length;
          
          // Recherches d'aujourd'hui
          stats.searchesToday = searchLogs.filter(
            log => new Date(log.created_at) >= today
          ).length;
          
          // Recent searches (15 dernières)
          stats.recentSearches = searchLogs.slice(0, 15).map(log => ({
            query: log.query || 'Unknown query',
            userPhone: this.maskPhone(log.user_phone || 'Unknown'),
            timestamp: log.created_at,
            results: log.results_count || 0
          }));

          // Top searches
          const searches = {};
          searchLogs.forEach(log => {
            const query = log.query?.toLowerCase() || 'unknown';
            searches[query] = (searches[query] || 0) + 1;
          });
          stats.topSearches = searches;
          
          // Temps de réponse moyen
          const responseTimes = searchLogs
            .filter(log => log.response_time)
            .map(log => log.response_time);
          
          if (responseTimes.length > 0) {
            stats.avgResponseTime = Math.round(
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            );
            stats.maxResponseTime = Math.max(...responseTimes);
          }
        }
      } catch (e) {
        console.log('Error fetching search logs:', e);
      }
      
      // 3. Récupérer les clics vendeurs
      try {
        const { data: clicks, error: clickError } = await supabase
          .from('vendor_clicks')
          .select('*');
        
        if (!clickError && clicks) {
          stats.totalClicks = clicks.length;
          
          // Taux de conversion (clics / recherches)
          if (stats.totalSearches > 0) {
            stats.conversionRate = ((stats.totalClicks / stats.totalSearches) * 100).toFixed(1);
          }
        }
      } catch (e) {
        console.log('Error fetching vendor clicks:', e);
      }
      
      // 4. Récupérer les analytics du bot
      try {
        const { data: analytics, error: analyticsError } = await supabase
          .from('bot_analytics')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!analyticsError && analytics) {
          // Compter par type d'événement
          const eventCounts = {};
          analytics.forEach(event => {
            eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
          });
          
          stats.productSearches = eventCounts['search_product'] || 0;
          stats.vendorSearches = eventCounts['search_vendor'] || 0;
          stats.helpRequests = eventCounts['help'] || 0;
          stats.otherQueries = eventCounts['other'] || 0;
          
          // Calculer le taux de succès/erreur
          const totalEvents = analytics.length;
          const errorEvents = eventCounts['error'] || 0;
          if (totalEvents > 0) {
            stats.errorRate = ((errorEvents / totalEvents) * 100).toFixed(1);
            stats.successRate = (100 - stats.errorRate).toFixed(1);
          }
          
          // Durée moyenne de session (estimation basée sur l'activité)
          const userSessions = {};
          analytics.forEach(event => {
            if (event.user_phone && event.user_phone !== 'system') {
              if (!userSessions[event.user_phone]) {
                userSessions[event.user_phone] = [];
              }
              userSessions[event.user_phone].push(new Date(event.created_at));
            }
          });
          
          const sessionDurations = [];
          Object.values(userSessions).forEach(sessions => {
            if (sessions.length > 1) {
              sessions.sort((a, b) => a - b);
              const duration = (sessions[sessions.length - 1] - sessions[0]) / 1000; // en secondes
              sessionDurations.push(duration);
            }
          });
          
          if (sessionDurations.length > 0) {
            stats.avgSessionDuration = Math.round(
              sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
            );
          }
        }
      } catch (e) {
        console.log('Error fetching bot analytics:', e);
      }
      
      // 5. Générer l'activité journalière (7 derniers jours)
      try {
        const dailyActivity = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          
          // Compter les recherches du jour
          const { count: daySearches } = await supabase
            .from('search_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
          
          // Compter les clics du jour
          const { count: dayClicks } = await supabase
            .from('vendor_clicks')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString());
          
          // Compter les utilisateurs actifs du jour
          const { count: dayUsers } = await supabase
            .from('bot_users')
            .select('*', { count: 'exact', head: true })
            .gte('last_message_at', date.toISOString())
            .lt('last_message_at', nextDate.toISOString());
          
          dailyActivity.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            searches: daySearches || 0,
            clicks: dayClicks || 0,
            users: dayUsers || 0
          });
        }
        stats.dailyActivity = dailyActivity;
      } catch (e) {
        console.log('Error fetching daily activity:', e);
      }

      // 6. Récupérer les top vendeurs (basé sur les clics réels)
      try {
        const { data: vendors, error: vendorError } = await supabase
          .from('vendors')
          .select('id, name, city');

        if (!vendorError && vendors) {
          // Compter les clics par vendeur
          const { data: clicks } = await supabase
            .from('vendor_clicks')
            .select('vendor_id');
          
          const vendorClickCounts = {};
          if (clicks) {
            clicks.forEach(click => {
              vendorClickCounts[click.vendor_id] = (vendorClickCounts[click.vendor_id] || 0) + 1;
            });
          }
          
          // Compter les vues (apparitions dans les résultats de recherche)
          const { data: searchLogs } = await supabase
            .from('search_logs')
            .select('vendors_returned');
          
          const vendorViewCounts = {};
          if (searchLogs) {
            searchLogs.forEach(log => {
              if (log.vendors_returned) {
                log.vendors_returned.forEach(vendorId => {
                  vendorViewCounts[vendorId] = (vendorViewCounts[vendorId] || 0) + 1;
                });
              }
            });
          }
          
          // Mapper les vendeurs avec leurs stats
          const vendorsWithStats = vendors.map(vendor => ({
            name: vendor.name,
            city: vendor.city,
            views: vendorViewCounts[vendor.id] || 0,
            clicks: vendorClickCounts[vendor.id] || 0
          }));
          
          // Trier par nombre de clics et prendre le top 8
          stats.topVendors = vendorsWithStats
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 8);
        }
      } catch (e) {
        console.log('Error fetching vendor stats:', e);
      }

      return stats;
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      return this.getDefaultStats();
    }
  }

  // Générer une activité vide si pas de données
  generateEmptyDailyActivity() {
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        searches: 0,
        clicks: 0,
        users: 0
      });
    }
    return activity;
  }

  // Masquer les numéros de téléphone pour la confidentialité
  maskPhone(phone) {
    if (!phone || phone.length < 7) return 'Hidden';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }

  // Stats par défaut
  getDefaultStats() {
    return {
      totalUsers: 0,
      activeToday: 0,
      totalSearches: 0,
      searchesToday: 0,
      totalClicks: 0,
      avgResponseTime: 0,
      conversionRate: 0,
      topSearches: {},
      topVendors: [],
      dailyActivity: this.generateEmptyDailyActivity(),
      avgResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      avgSearchesPerUser: 0,
      avgClicksPerUser: 0,
      returnRate: 0,
      avgSessionDuration: 0,
      productSearches: 0,
      vendorSearches: 0,
      helpRequests: 0,
      otherQueries: 0,
      recentSearches: []
    };
  }

  // Log une recherche (appelé par le bot)
  async logSearch(data) {
    try {
      const { user_phone, query, results_count, response_time } = data;

      const { data: logData, error } = await supabase
        .from('search_logs')
        .insert([{
          user_phone,
          query,
          results_count: results_count || 0,
          response_time: response_time || 0,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return logData;
    } catch (error) {
      console.error('Error logging search:', error);
      return null;
    }
  }

  // Log un clic sur un vendeur
  async logVendorClick(data) {
    try {
      const { user_phone, vendor_id } = data;

      const { data: clickData, error } = await supabase
        .from('vendor_clicks')
        .insert([{
          user_phone,
          vendor_id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return clickData;
    } catch (error) {
      console.error('Error logging vendor click:', error);
      return null;
    }
  }

  // Récupère les stats détaillées pour une période donnée
  async getStatsByPeriod(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: searchLogs, error } = await supabase
        .from('search_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        period: `Last ${days} days`,
        totalSearches: searchLogs?.length || 0,
        avgResponseTime: this.calculateAvgResponseTime(searchLogs || []),
        uniqueUsers: new Set(searchLogs?.map(log => log.user_phone) || []).size
      };
    } catch (error) {
      console.error('Error fetching period stats:', error);
      return null;
    }
  }

  // Calcule le temps de réponse moyen
  calculateAvgResponseTime(logs) {
    if (!logs || logs.length === 0) return 0;
    const total = logs.reduce((acc, log) => acc + (log.response_time || 0), 0);
    return Math.round(total / logs.length);
  }
}

module.exports = new BotService();
