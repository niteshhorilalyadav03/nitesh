/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch and Routing System
 * Module: Ambulance Express Router
 * Author: Yadav Nitesh Horilal (TE-IT, Shree L. R. Tiwari College of Engineering)
 * ==============================================================================
 * 
 * VIVA EXPLANATION NOTE:
 * ------------------------------------------------------------------------------
 * What is Express.Router()?
 * - An Express Router is a mini Express application capable only of performing
 *   middleware and routing functions.
 * - It creates modular, mountable route handlers. Instead of putting all endpoints
 *   inside server.js, we break them into dedicated route files for clean code.
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();

const {
  getAllAmbulances,
  getAmbulanceById,
  dispatchNearestAmbulance,
  updateAmbulanceStatus
} = require('../controllers/ambulanceController');

// 1. GET /api/ambulances - Retrieve all ambulances (supports ?status=available query)
router.get('/', getAllAmbulances);

// 2. POST /api/ambulances/dispatch - Run nearest ambulance dispatch algorithm
router.post('/dispatch', dispatchNearestAmbulance);

// 3. GET /api/ambulances/:id - Retrieve specific ambulance details by its ID
router.get('/:id', getAmbulanceById);

// 4. PATCH /api/ambulances/:id/status - Toggle availability status (available/busy)
router.patch('/:id/status', updateAmbulanceStatus);

module.exports = router;
