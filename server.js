/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch and Routing System
 * File: server.js (Main Backend Entry Point)
 * Author: Yadav Nitesh Horilal (TE-IT, Roll No: 66, Div: C, Shree L. R. Tiwari CoE)
 * ==============================================================================
 * 
 * VIVA EXPLANATION GUIDE FOR PROFESSOR / EXAMINER:
 * ------------------------------------------------------------------------------
 * 1. Express: A minimalist, flexible Node.js web application framework that provides
 *    robust features for web and mobile applications (routing, middleware, HTTP utilities).
 * 2. CORS (Cross-Origin Resource Sharing): A security mechanism that allows or restricts
 *    requested resources on a web server from another domain. Without CORS, the browser
 *    would block the frontend from calling the backend API.
 * 3. Middleware: Functions that have access to the request object (req), the response
 *    object (res), and the next middleware function in the application’s request-response cycle.
 * 4. express.json(): Built-in middleware to parse incoming requests with JSON payloads.
 * 5. dotenv: Module that loads environment variables from a .env file into process.env.
 * ==============================================================================
 */

// Step 1: Import required Node.js core and third-party modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Step 2: Load environment variables from .env file
dotenv.config();

// Step 3: Initialize Express application instance
const app = express();

// Step 4: Define Port (reads from environment variable or defaults to 5000 / 3000)
const PORT = process.env.PORT || 5000;

// ==============================================================================
// MIDDLEWARE CONFIGURATION
// ==============================================================================

// Enable CORS so client applications running on other ports can communicate with this API
app.use(cors({
  origin: '*', // Allows all origins during development & viva demo
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Built-in middleware to parse incoming JSON request bodies into req.body
app.use(express.json());

// Built-in middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging & viva demonstration
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('en-IN');
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware or route handler
});

// ==============================================================================
// IMPORT MODULAR ROUTES
// ==============================================================================
const ambulanceRoutes = require('./routes/ambulanceRoutes');

// Mount the ambulance routes at /api/ambulances
app.use('/api/ambulances', ambulanceRoutes);

// Additional helpful route: Get Mira Road Partner Hospitals
app.get('/api/hospitals', (req, res) => {
  try {
    const hospitalsPath = path.join(__dirname, 'data/hospitals.json');
    const rawData = fs.readFileSync(hospitalsPath, 'utf-8');
    const hospitals = JSON.parse(rawData);
    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to read hospitals database',
      error: err.message
    });
  }
});

// Basic Root Route to verify server is running healthily
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'Online',
    system: 'Lifeline: Smart Emergency Ambulance Dispatch & Routing System',
    version: '1.0.0-production',
    region: 'Mira Road Emergency Operations Center, Thane',
    endpoints: {
      getAllAmbulances: 'GET /api/ambulances',
      getAvailableOnly: 'GET /api/ambulances?status=available',
      getSingleAmbulance: 'GET /api/ambulances/:id',
      dispatchNearest: 'POST /api/ambulances/dispatch',
      getHospitals: 'GET /api/hospitals'
    }
  });
});

// ==============================================================================
// 404 NOT FOUND HANDLER & GLOBAL ERROR HANDLER
// ==============================================================================

// Catch-all for non-existing endpoints
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found on Lifeline Server.`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// ==============================================================================
// START SERVER
// ==============================================================================
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚑 Lifeline Emergency Dispatch Server is active!`);
  console.log(`📍 Station Hub: Mira Road (East), Thane - 401 107`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📡 API Endpoint: http://localhost:${PORT}/api/ambulances`);
  console.log('================================================================');
});

module.exports = app;
