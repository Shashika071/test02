const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mongoose = require('mongoose');
const employeeRoutes = require('./routes/employeeRoutes');
const fs = require('fs');
const path = require('path');
const xssClean = require('xss-clean');
require('dotenv').config();

const app = express();

// XSS Clean Middleware
app.use(xssClean());

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://thirasaim21062:fDfu0hcev0z9KfBq@cluster0.mlkd8.mongodb.net/employeeManagement?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Employee Routes
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api', employeeRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err); // Log errors
  res.status(500).json({ error: '❌ Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
