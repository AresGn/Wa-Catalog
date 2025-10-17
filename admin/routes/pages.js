const express = require('express');
const router = express.Router();
const vendorService = require('../services/vendorService');
const productService = require('../services/productService');

router.get('/', async (req, res, next) => {
  try {
    const vendorStats = await vendorService.getStats();
    const productStats = await productService.getStats();

    res.render('dashboard', {
      title: 'Dashboard',
      vendorStats,
      productStats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/vendors', async (req, res, next) => {
  try {
    const vendors = await vendorService.getAll();
    res.render('vendors/list', {
      title: 'Vendors',
      vendors
    });
  } catch (error) {
    next(error);
  }
});

router.get('/vendors/new', (req, res) => {
  res.render('vendors/form', {
    title: 'Add Vendor',
    vendor: null
  });
});

router.get('/vendors/:id/edit', async (req, res, next) => {
  try {
    const vendor = await vendorService.getById(req.params.id);
    res.render('vendors/form', {
      title: 'Edit Vendor',
      vendor
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await productService.getAll();
    res.render('products/list', {
      title: 'Products',
      products
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/new', async (req, res, next) => {
  try {
    const vendors = await vendorService.getAll();
    res.render('products/form', {
      title: 'Add Product',
      product: null,
      vendors
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id/edit', async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    const vendors = await vendorService.getAll();
    res.render('products/form', {
      title: 'Edit Product',
      product,
      vendors
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
