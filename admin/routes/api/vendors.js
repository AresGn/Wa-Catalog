const express = require('express');
const router = express.Router();
const vendorService = require('../../services/vendorService');

router.get('/', async (req, res, next) => {
  try {
    const vendors = await vendorService.getAll();
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await vendorService.getById(req.params.id);
    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, whatsappNumber, city, category, verified } = req.body;

    if (!name || !whatsappNumber || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vendor = await vendorService.create({
      name,
      whatsappNumber,
      city,
      category,
      verified
    });

    res.status(201).json(vendor);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const vendor = await vendorService.update(req.params.id, req.body);
    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await vendorService.delete(req.params.id);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await vendorService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
