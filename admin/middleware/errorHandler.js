const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message.includes('Supabase')) {
    return res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  }

  if (err.message.includes('validation')) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
