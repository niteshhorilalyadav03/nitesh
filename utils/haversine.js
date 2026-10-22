/**
 * ==============================================================================
 * Project: Lifeline - Smart Emergency Ambulance Dispatch and Routing System
 * Module: Haversine Distance Utility
 * Author: Yadav Nitesh Horilal (TE-IT, Shree L. R. Tiwari College of Engineering)
 * ==============================================================================
 * 
 * VIVA EXPLANATION NOTE:
 * ------------------------------------------------------------------------------
 * What is the Haversine Formula?
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 * 
 * Mathematical Formula:
 * a = sin²(Δφ / 2) + cos(φ1) * cos(φ2) * sin²(Δλ / 2)
 * c = 2 * atan2(√a, √(1 - a))
 * d = R * c
 * 
 * Where:
 * - φ (phi) is Latitude in Radians
 * - λ (lambda) is Longitude in Radians
 * - R is the Earth's mean radius = 6371 km
 * - d is the calculated spherical distance in kilometers
 * ==============================================================================
 */

/**
 * Converts degrees to radians.
 * Required because JavaScript's Math.sin and Math.cos accept angles in radians.
 * 
 * @param {number} degrees 
 * @returns {number} radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the straight-line spherical distance between two GPS coordinates in kilometers.
 * 
 * @param {number} lat1 - Latitude of Point 1 (e.g. Ambulance)
 * @param {number} lon1 - Longitude of Point 1
 * @param {number} lat2 - Latitude of Point 2 (e.g. Patient Emergency Site)
 * @param {number} lon2 - Longitude of Point 2
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371; // Mean Earth radius in kilometers

  // Step 1: Calculate differences in radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Step 2: Convert starting and ending latitudes to radians
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  // Step 3: Apply the Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Step 4: Compute angular distance in radians (c)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Step 5: Multiply by Earth radius to obtain physical distance
  const distanceKm = EARTH_RADIUS_KM * c;

  return parseFloat(distanceKm.toFixed(2));
}

/**
 * Calculates estimated travel time (ETA) based on average urban speed.
 * In Indian urban/suburban zones like Mira Road, average emergency transit speed is ~30 km/h.
 * 
 * @param {number} distanceKm 
 * @param {number} averageSpeedKmH 
 * @returns {number} Estimated time in minutes
 */
function estimateTravelTimeMinutes(distanceKm, averageSpeedKmH = 30) {
  const hours = distanceKm / averageSpeedKmH;
  const minutes = Math.ceil(hours * 60);
  return Math.max(minutes, 2); // Minimum 2 minutes buffer for immediate response
}

module.exports = {
  toRadians,
  calculateHaversineDistance,
  estimateTravelTimeMinutes
};
