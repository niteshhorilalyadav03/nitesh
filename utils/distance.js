/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch & Routing System
 * Module: Haversine Distance & ETA Utility
 * File: utils/distance.js
 * Author: Yadav Nitesh Horilal (TE-IT, Shree L. R. Tiwari College of Engineering)
 * ==============================================================================
 * 
 * VIVA THEORY GUIDE (FOR PROFESSOR / EXAMINER):
 * ------------------------------------------------------------------------------
 * Q: What is the Haversine Formula?
 * A: It calculates the shortest great-circle distance between two points on the
 *    surface of a sphere (Earth), given their latitudes and longitudes.
 * 
 * Mathematical Formulation:
 *   a = sin²(Δφ / 2) + cos(φ1) * cos(φ2) * sin²(Δλ / 2)
 *   c = 2 * atan2( √a, √(1 - a) )
 *   d = R * c
 * 
 * Where:
 *   - φ (phi) is Latitude in Radians: φ = lat * (π / 180)
 *   - λ (lambda) is Longitude in Radians: λ = lon * (π / 180)
 *   - Δφ = φ2 - φ1 (Difference in latitude)
 *   - Δλ = λ2 - λ1 (Difference in longitude)
 *   - R = 6371 km (Mean volumetric radius of Earth)
 *   - c = Angular distance in radians
 *   - d = Great-circle distance in kilometers
 * ==============================================================================
 */

/**
 * Helper function to convert degrees to radians.
 * Math.sin and Math.cos in JavaScript accept radians, not degrees.
 * 
 * @param {number} degrees 
 * @returns {number} radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates great-circle distance between two GPS coordinates in kilometers.
 * 
 * @param {number} lat1 - Latitude of Point 1 (e.g., Ambulance)
 * @param {number} lon1 - Longitude of Point 1
 * @param {number} lat2 - Latitude of Point 2 (e.g., Emergency victim)
 * @param {number} lon2 - Longitude of Point 2
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  // Mean Earth Radius in Kilometers
  const EARTH_RADIUS_KM = 6371;

  // Step 1: Compute coordinate differences in radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Step 2: Convert latitude points to radians
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  // Step 3: Apply Haversine trigonometric formulation
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Step 4: Compute the central angular distance
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Step 5: Multiply by Earth radius to get distance in km
  const distanceKm = EARTH_RADIUS_KM * c;

  // Return formatted number with 2 decimal places (e.g., 2.34 km)
  return parseFloat(distanceKm.toFixed(2));
}

/**
 * Computes Estimated Time of Arrival (ETA) in minutes based on distance.
 * Assumes average urban emergency speed of 30 km/h in Mira Road traffic.
 * 
 * Formula:
 *   Time (hours) = Distance (km) / Speed (km/h)
 *   Time (minutes) = Time (hours) * 60
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmH - Average vehicle speed in km/h (default: 30 km/h)
 * @returns {number} ETA in whole minutes (minimum 2 mins buffer for immediate start)
 */
function calculateETA(distanceKm, avgSpeedKmH = 30) {
  const travelHours = distanceKm / avgSpeedKmH;
  const travelMinutes = Math.ceil(travelHours * 60);
  return Math.max(travelMinutes, 2); // Buffer of minimum 2 minutes
}

module.exports = {
  toRadians,
  calculateHaversineDistance,
  calculateETA
};
