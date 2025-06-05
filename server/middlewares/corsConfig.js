// middlewares/corsConfig.js

const cors = require('cors');

const corsConfig = cors({
  origin: 'http://localhost:5173', // your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // optional, for extra clarity
});

module.exports = corsConfig;
