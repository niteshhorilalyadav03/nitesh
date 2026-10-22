/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch and Routing System
 * Module: Ambulance Controller
 * File: controllers/ambulanceController.js
 * Author: Yadav Nitesh Horilal (TE-IT, Shree L. R. Tiwari College of Engineering)
 * ==============================================================================
 * 
 * VIVA THEORY GUIDE (FOR PROFESSOR / EXAMINER):
 * ------------------------------------------------------------------------------
 * Q: What is the Controller's responsibility in MVC?
 * A: The controller acts as the intermediate brain. It receives the parsed HTTP
 *    request from Express routes, executes business logic (filtering, Haversine
 *    distance calculation, status validation), queries the database/JSON, and
 *    structures the standard JSON response sent back to the client.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { calculateHaversineDistance, calculateETA } = require('../utils/distance');

// Data file paths
const ambulancesFilePath = path.join(__dirname, '../data/ambulances.json');
const hospitalsFilePath = path.join(__dirname, '../data/hospitals.json');

/**
 * Helper: Reads the current list of ambulances from data/ambulances.json
 * @returns {Array} Array of ambulance objects
 */
function readAmbulancesData() {
  const rawData = fs.readFileSync(ambulancesFilePath, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Helper: Writes updated ambulance data back to data/ambulances.json
 * @param {Array} data - Updated array of ambulances
 */
function writeAmbulancesData(data) {
  fs.writeFileSync(ambulancesFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Helper: Reads local Mira Road hospitals
 * @returns {Array} List of hospitals in Mira Road, Thane
 */
function readHospitalsData() {
  if (fs.existsSync(hospitalsFilePath)) {
    const rawData = fs.readFileSync(hospitalsFilePath, 'utf-8');
    return JSON.parse(rawData);
  }
  // Default Mira Road hospital fallbacks if file is absent
  return [
    {
      id: "HOSP-001",
      name: "Bhaktivedanta Hospital & Research Institute",
      address: "Sector 1, Srishti Complex, Mira Road East, Thane 401107",
      location: { latitude: 19.2905, longitude: 72.8628 },
      emergency_contact: "022-29452500"
    },
    {
      id: "HOSP-002",
      name: "Wockhardt Hospital",
      address: "The Umrao IMSR, Near Railway Station, Mira Road East 401107",
      location: { latitude: 19.2915, longitude: 72.8540 },
      emergency_contact: "022-68800108"
    },
    {
      id: "HOSP-003",
      name: "Thunga Hospital",
      address: "Mira Bhayandar Road, Beverly Park, Mira Road East 401107",
      location: { latitude: 19.2970, longitude: 72.8535 },
      emergency_contact: "022-28114400"
    }
  ];
}

/**
 * @route   GET /api/ambulances
 * @desc    Fetch all ambulances or filter by status (?status=available)
 */
const getAllAmbulances = (req, res) => {
  try {
    const ambulances = readAmbulancesData();
    const { status, type } = req.query;

    let filtered = [...ambulances];

    if (status) {
      filtered = filtered.filter(
        amb => amb.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (type) {
      filtered = filtered.filter(
        amb => amb.type.toLowerCase().includes(type.toLowerCase())
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      total_in_fleet: ambulances.length,
      data: filtered,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading ambulances:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve ambulance records',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/ambulances/:id
 * @desc    Fetch single ambulance details by ID
 */
const getAmbulanceById = (req, res) => {
  try {
    const { id } = req.params;
    const ambulances = readAmbulancesData();
    const ambulance = ambulances.find(
      amb => amb.id.toUpperCase() === id.toUpperCase()
    );

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: `Ambulance with ID '${id}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: ambulance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching ambulance',
      error: error.message
    });
  }
};

/**
 * ==============================================================================
 * PHASE A (API 1): PATCH /api/ambulances/:id/status
 * ==============================================================================
 * @route   PATCH /api/ambulances/:id/status
 * @desc    Toggles or updates ambulance status between 'available' and 'busy'
 * @body    { status?: 'available' | 'busy' } - If omitted, toggles to opposite
 */
const updateAmbulanceStatus = (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    const ambulances = readAmbulancesData();
    const index = ambulances.findIndex(
      amb => amb.id.toUpperCase() === id.toUpperCase()
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Ambulance with ID '${id}' does not exist.`
      });
    }

    const currentAmbulance = ambulances[index];

    // If specific status not provided in request body, toggle to opposite status
    if (!status) {
      status = currentAmbulance.status === 'available' ? 'busy' : 'available';
    } else {
      status = status.toLowerCase();
      if (!['available', 'busy'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'available' or 'busy'."
        });
      }
    }

    // Update status and save to data/ambulances.json
    ambulances[index].status = status;
    writeAmbulancesData(ambulances);

    return res.status(200).json({
      success: true,
      message: `Status of ${currentAmbulance.vehicle_number} (${id}) updated to '${status}'.`,
      data: ambulances[index]
    });
  } catch (error) {
    console.error('Error toggling ambulance status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ambulance status',
      error: error.message
    });
  }
};

/**
 * ==============================================================================
 * PHASE A (API 2): POST /api/ambulances/dispatch (CORE DISPATCH LOGIC)
 * ==============================================================================
 * @route   POST /api/ambulances/dispatch
 * @desc    1. Validates incoming latitude and longitude
 *          2. Filters ambulance dataset for 'available' units
 *          3. Computes Haversine distance for every available unit
 *          4. Finds unit with shortest distance
 *          5. Calculates ETA based on 30 km/h average speed
 *          6. Assigns local Mira Road hospital
 * @body    { latitude: number, longitude: number, emergency_type?: string }
 */
const dispatchNearestAmbulance = (req, res) => {
  try {
    const { latitude, longitude, emergency_type, patient_name } = req.body;

    // Step 1: Input Validation
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: latitude and longitude are required.'
      });
    }

    const emergencyLat = parseFloat(latitude);
    const emergencyLon = parseFloat(longitude);

    if (isNaN(emergencyLat) || isNaN(emergencyLon)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid numerical floating-point values.'
      });
    }

    // Step 2: Read dataset and filter for 'available' units only
    const allAmbulances = readAmbulancesData();
    const availableAmbulances = allAmbulances.filter(
      amb => amb.status === 'available'
    );

    // If no units available, return 404 with emergency advice
    if (availableAmbulances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'All ambulances in the Mira Road network are currently busy. Escalating to regional backup.'
      });
    }

    // Step 3: Loop through available units and compute Haversine distance & ETA
    let nearestAmbulance = null;
    let shortestDistance = Infinity;

    const evaluatedUnits = availableAmbulances.map(unit => {
      // Calculate distance using our Haversine utility
      const distance = calculateHaversineDistance(
        unit.current_location.latitude,
        unit.current_location.longitude,
        emergencyLat,
        emergencyLon
      );

      // Calculate ETA assuming 30 km/h average speed
      const eta = calculateETA(distance, 30);

      const unitWithMetrics = {
        ...unit,
        distance_km: distance,
        estimated_eta_minutes: eta,
        eta_minutes: eta
      };

      // Find the unit with shortest distance
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestAmbulance = unitWithMetrics;
      }

      return unitWithMetrics;
    });

    // Step 4: Assign a local Mira Road hospital (picks nearest or local hospital)
    const hospitals = readHospitalsData();
    // Sort hospitals by distance to emergency site
    const sortedHospitals = hospitals.map(h => ({
      ...h,
      distance_km: calculateHaversineDistance(
        emergencyLat,
        emergencyLon,
        h.location.latitude,
        h.location.longitude
      )
    })).sort((a, b) => a.distance_km - b.distance_km);

    const assignedHospital = sortedHospitals[0] || {
      name: "Bhaktivedanta Hospital & Research Institute",
      address: "Sector 1, Srishti Complex, Mira Road East, Thane",
      emergency_contact: "022-29452500"
    };

    // Step 5: Format and return response
    return res.status(200).json({
      success: true,
      message: `Emergency dispatch confirmed! Ambulance ${nearestAmbulance.vehicle_number} (${nearestAmbulance.id}) assigned.`,
      dispatch_result: {
        emergency_location: {
          latitude: emergencyLat,
          longitude: emergencyLon
        },
        patient_name: patient_name || 'Emergency Victim',
        emergency_type: emergency_type || 'General Medical Emergency',
        assigned_ambulance: {
          id: nearestAmbulance.id,
          vehicle_number: nearestAmbulance.vehicle_number,
          driver_name: nearestAmbulance.driver_name,
          contact: nearestAmbulance.contact,
          type: nearestAmbulance.type,
          base_station: nearestAmbulance.base_station,
          current_location: nearestAmbulance.current_location,
          distance_km: nearestAmbulance.distance_km,
          estimated_eta_minutes: nearestAmbulance.estimated_eta_minutes,
          eta_minutes: nearestAmbulance.eta_minutes,
          fuel_level: nearestAmbulance.fuel_level
        },
        recommended_hospital: assignedHospital,
        other_available_units: evaluatedUnits
          .filter(u => u.id !== nearestAmbulance.id)
          .sort((a, b) => a.distance_km - b.distance_km)
          .map(u => ({
            id: u.id,
            vehicle_number: u.vehicle_number,
            distance_km: u.distance_km,
            eta_minutes: u.eta_minutes
          }))
      },
      dispatched_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Core dispatch execution error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while executing dispatch algorithm',
      error: error.message
    });
  }
};

module.exports = {
  getAllAmbulances,
  getAmbulanceById,
  updateAmbulanceStatus,
  dispatchNearestAmbulance
};
