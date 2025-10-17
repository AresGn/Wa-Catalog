require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Custom EJS middleware to render with layout
app.use((req, res, next) => {
  const originalRender = res.render;
  res.render = function(view, options = {}, callback) {
    const { title = 'Admin', ...data } = options;
    
    originalRender.call(
      this,
      view,
      { title, ...data },
      (err, html) => {
        if (err) return callback?.(err);
        
        const layoutPath = path.join(__dirname, 'views', 'layout.ejs');
        originalRender.call(
          this,
          layoutPath,
          { title, body: html, ...data },
          callback
        );
      }
    );
  };
  next();
});

// Routes
app.use('/api/vendors', require('./routes/api/vendors'));
app.use('/api/products', require('./routes/api/products'));
app.use('/', require('./routes/pages'));

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Admin Dashboard running on http://localhost:${PORT}`);
});
