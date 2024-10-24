// Basic Lib Import
require('dotenv').config();
const express = require('express');
// Security Middleware Lib Import
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const routes = require('./src/routes');
const { connectWithDB } = require('./src/config/mongo');
const { handleError } = require('./src/utility/errors.js');

const app = express();
const Bottleneck = require('bottleneck');

// Trust proxy
app.set('trust proxy', 1); // Trust the first proxy

// Security Middleware Implement
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'src', 'modules', 'uploads')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

// CORS CONFIGURATIONS
const whitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  'http://localhost:3005',
  '*',
];
const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
    return callback(null, true);
  },
};

app.use(cors(corsOptions));

// Request Rate Limit using express-rate-limit
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 3000, // Limit each IP to 3000 requests per `window`
// });
// app.use(limiter); // Apply express-rate-limit globally


// Set up a Bottleneck instance to throttle specific requests
const bottleneckLimiter = new Bottleneck({
  minTime: 200, // Minimum 200ms between requests
  maxConcurrent: 5 // Limit concurrent requests to 5
});

// Example function that will use Bottleneck to throttle requests
const fetchExternalData = async () => {
  // Simulate an external API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Data fetched' });
    }, 1000);
  });
};

// Throttle external API call using Bottleneck
const fetchExternalDataWithLimit = bottleneckLimiter.wrap(fetchExternalData);

// Example route that makes a throttled request
app.get('/throttled-route', async (req, res) => {
  try {
    const data = await fetchExternalDataWithLimit();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error occurred', error });
  }
});

// Mongo DB Database Connection
connectWithDB();

// Routing Implement
app.use('/api/v1', routes);
app.use('/health-check', (req, res) => res.status(200).json('Working'));
app.use(handleError);

// Undefined Route Implement
app.use('*', (req, res) => {
  res.status(404).json({ status: 'fail', data: 'Server is Okay, its Undefined Route' });
});

// Export app module
module.exports = app;

// Server log
console.log('Server running on port => 8080');

