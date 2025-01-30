const express = require('express'); // Framework for web servers and APIs
const cors = require('cors'); // Middleware for enabling CORS to communicate between frontend and backend
const mongoose = require('mongoose');
const fs = require('fs'); // Work with file systems
require('dotenv').config(); // Load environment variables from a .env file
const employeeRoutes = require('./routes/employeeRoutes'); // Contains URLs to API requests
const path = require('path');
const xssClean = require('xss-clean');

const app = express();

// Apply XSS clean middleware
app.use(xssClean());

// Validate required environment variables
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is not set in the environment variables.');
  process.exit(1); // Exit the process if MONGODB_URI is not set
}

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to parse form data

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// CORS middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || 'https://employee-management-2z1.pages.dev',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// MongoDB connection with improved error handling
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true, // Deprecated, can be removed in latest versions
    useUnifiedTopology: true, // Deprecated, can be removed in latest versions
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Use the employee routes
app.use('/api', employeeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: '✅ Server is running successfully!' });
});

// General error handling middleware for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: '❌ Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '❌ Internal server error' });
});

// Start the server with port conflict handling
const PORT = parseInt(process.env.PORT, 10) || 5001;
let server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle EADDRINUSE error (port already in use)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use. Trying another port...`);
    setTimeout(() => {
      server.close();
      const newPort = PORT + 1;
      server = app.listen(newPort, () => {
        console.log(`🚀 Server running on port ${newPort}`);
      });
    }, 1000);
  } else {
    console.error('❌ Server error:', err);
  }
});
