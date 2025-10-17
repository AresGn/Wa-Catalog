const express = require('express');
const router = express.Router();
const botService = require('../../services/botService');

// Log une recherche
router.post('/log-search', async (req, res, next) => {
  try {
    const { user_phone, query, results_count, response_time } = req.body;

    if (!user_phone || !query) {
      return res.status(400).json({ error: 'Missing required fields: user_phone, query' });
    }

    const result = await botService.logSearch({
      user_phone,
      query,
      results_count: results_count || 0,
      response_time: response_time || 0
    });

    if (!result) {
      return res.status(500).json({ error: 'Failed to log search' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Log un clic sur un vendeur
router.post('/log-click', async (req, res, next) => {
  try {
    const { user_phone, vendor_id } = req.body;

    if (!user_phone || !vendor_id) {
      return res.status(400).json({ error: 'Missing required fields: user_phone, vendor_id' });
    }

    const result = await botService.logVendorClick({
      user_phone,
      vendor_id
    });

    if (!result) {
      return res.status(500).json({ error: 'Failed to log click' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Récupère les stats du bot
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await botService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Récupère les stats pour une période donnée
router.get('/stats/period/:days', async (req, res, next) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const stats = await botService.getStatsByPeriod(days);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
