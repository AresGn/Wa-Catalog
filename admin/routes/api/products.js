const express = require('express');
const router = express.Router();
const productService = require('../../services/productService');

router.get('/', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.vendorId) filters.vendorId = req.query.vendorId;
    if (req.query.category) filters.category = req.query.category;

    const products = await productService.getAll(filters);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { vendorId, name, category, price, description, availability, condition } = req.body;

    if (!vendorId || !name || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await productService.create({
      vendorId,
      name,
      category,
      price,
      description,
      availability,
      condition
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await productService.delete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await productService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
