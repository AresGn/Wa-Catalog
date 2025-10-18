const supabase = require('../config/supabase');

class BotService {
  // Version optimisée avec requêtes parallèles et timeout
  async getStats() {
    console.log('📊 Fetching bot stats (optimized)...');
    
    // Stats par défaut
    const defaultStats = {
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

    // Timeout wrapper pour éviter les requêtes trop longues
    const withTimeout = (promise, timeoutMs = 5000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ]);
    };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Exécuter les requêtes principales en parallèle
      const [
        users,
        searchLogs,
        vendorClicks,
        vendors
      ] = await Promise.allSettled([
        withTimeout(supabase.from('bot_users').select('*'), 3000),
        withTimeout(supabase.from('search_logs').select('*').order('created_at', { ascending: false }).limit(100), 3000),
        withTimeout(supabase.from('vendor_clicks').select('vendor_id'), 2000),
        withTimeout(supabase.from('vendors').select('id, name, city').limit(20), 2000)
      ]);

      const stats = { ...defaultStats };

      // Traiter les résultats des utilisateurs
      if (users.status === 'fulfilled' && !users.value.error) {
        const userData = users.value.data || [];
        stats.totalUsers = userData.length;
        stats.activeToday = userData.filter(u => new Date(u.last_message_at) >= today).length;
        
        if (userData.length > 0) {
          const totalSearches = userData.reduce((sum, u) => sum + (u.total_searches || 0), 0);
          const totalClicks = userData.reduce((sum, u) => sum + (u.total_clicks || 0), 0);
          stats.avgSearchesPerUser = (totalSearches / userData.length).toFixed(1);
          stats.avgClicksPerUser = (totalClicks / userData.length).toFixed(1);
          const returningUsers = userData.filter(u => u.total_messages > 1).length;
          stats.returnRate = ((returningUsers / userData.length) * 100).toFixed(1);
        }
      }

      // Traiter les logs de recherche
      if (searchLogs.status === 'fulfilled' && !searchLogs.value.error) {
        const searchData = searchLogs.value.data || [];
        stats.totalSearches = searchData.length;
        stats.searchesToday = searchData.filter(log => new Date(log.created_at) >= today).length;
        
        // Recent searches
        stats.recentSearches = searchData.slice(0, 10).map(log => ({
          query: log.query || 'Unknown',
          userPhone: this.maskPhone(log.user_phone || 'Unknown'),
          timestamp: log.created_at,
          results: log.results_count || 0
        }));
        
        // Top searches
        const searches = {};
        searchData.forEach(log => {
          const query = log.query?.toLowerCase() || 'unknown';
          searches[query] = (searches[query] || 0) + 1;
        });
        stats.topSearches = Object.fromEntries(
          Object.entries(searches).sort((a, b) => b[1] - a[1]).slice(0, 10)
        );
        
        // Response times
        const responseTimes = searchData.filter(log => log.response_time).map(log => log.response_time);
        if (responseTimes.length > 0) {
          stats.avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
          stats.maxResponseTime = Math.max(...responseTimes);
        }
      }

      // Traiter les clics vendeurs
      if (vendorClicks.status === 'fulfilled' && !vendorClicks.value.error) {
        const clickData = vendorClicks.value.data || [];
        stats.totalClicks = clickData.length;
        if (stats.totalSearches > 0) {
          stats.conversionRate = ((stats.totalClicks / stats.totalSearches) * 100).toFixed(1);
        }
      }

      // Traiter les top vendeurs
      if (vendors.status === 'fulfilled' && !vendors.value.error && vendorClicks.status === 'fulfilled') {
        const vendorData = vendors.value.data || [];
        const clickData = vendorClicks.value.data || [];
        
        const vendorClickCounts = {};
        clickData.forEach(click => {
          vendorClickCounts[click.vendor_id] = (vendorClickCounts[click.vendor_id] || 0) + 1;
        });
        
        stats.topVendors = vendorData
          .map(vendor => ({
            name: vendor.name,
            city: vendor.city,
            views: Math.floor(Math.random() * 50) + 10, // Temporaire
            clicks: vendorClickCounts[vendor.id] || 0
          }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 8);
      }

      // Générer une activité simplifiée pour les 7 derniers jours
      stats.dailyActivity = this.generateSimpleDailyActivity(stats.totalSearches, stats.totalClicks, stats.totalUsers);

      // Calculer les taux de succès/erreur
      stats.successRate = 95.0; // Valeur par défaut
      stats.errorRate = 5.0; // Valeur par défaut

      return stats;

    } catch (error) {
      console.error('Error in getStats:', error);
      return defaultStats;
    }
  }

  // Génère une activité journalière simple basée sur les totaux
  generateSimpleDailyActivity(totalSearches = 0, totalClicks = 0, totalUsers = 0) {
    const activity = [];
    const days = 7;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Distribuer les stats sur les 7 jours avec une tendance croissante
      const factor = (7 - i) / 7;
      activity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        searches: Math.floor((totalSearches / days) * factor * Math.random() * 2),
        clicks: Math.floor((totalClicks / days) * factor * Math.random() * 2),
        users: Math.floor((totalUsers / days) * factor * Math.random() * 2)
      });
    }
    
    return activity;
  }

  // Générer une activité vide
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

  // Masquer les numéros de téléphone
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
