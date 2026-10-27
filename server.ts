import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getAllUsersFromDb,
  getUserByIdFromDb,
  getUserByEmailFromDb,
  insertUserInDb,
  updateUserInDb,
  deleteUserFromDb,
  getDatabaseStats,
  getAllEmergenciesFromDb,
  getEmergencyByIdFromDb,
  insertEmergencyInDb,
  updateEmergencyInDb,
  deleteEmergencyFromDb,
  EmergencyRecord
} from './server/db.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize SQLite database on startup
initDatabase();

// --------------------------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Bus
// Broadcasts additions/updates across all connected dashboards
// --------------------------------------------------------------------------
let sseClients: Response[] = [];

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send initial connection ack
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Lifeline Realtime SQLite Sync Connected' })}\n\n`);

  // Heartbeat to keep connection active
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c !== res);
  });
});

function broadcastEvent(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// --------------------------------------------------------------------------
// REST API ROUTES: Users & Personnel Management (SQLite Database)
// --------------------------------------------------------------------------
app.get('/api/users', (_req: Request, res: Response) => {
  try {
    const users = getAllUsersFromDb();
    res.json({
      success: true,
      count: users.length,
      data: users,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const user = getUserByIdFromDb(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', (req: Request, res: Response) => {
  try {
    const { name, email, role, phone } = req.body;
    if (!name || !email || !role || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, role, and 10-digit phone number are required.'
      });
    }

    // Check if email already exists
    const existing = getUserByEmailFromDb(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A user with email "${email}" already exists in the database.`
      });
    }

    const id = req.body.id || `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userToInsert = {
      ...req.body,
      id,
      phone: String(phone).replace(/\D/g, '').slice(-10),
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0]
    };

    const savedUser = insertUserInDb(userToInsert);

    // Broadcast real-time SSE event to all connected dashboard tabs
    broadcastEvent('USER_ADDED', savedUser);

    res.status(201).json({
      success: true,
      message: `User ${savedUser.name} (${savedUser.role}) created and persisted to database.`,
      data: savedUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = getUserByIdFromDb(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const updatedUser = updateUserInDb(id, req.body);
    if (!updatedUser) {
      return res.status(400).json({ success: false, message: 'Failed to update user.' });
    }

    broadcastEvent('USER_UPDATED', updatedUser);

    res.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully in database.`,
      data: updatedUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = getUserByIdFromDb(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const success = deleteUserFromDb(id);
    if (success) {
      broadcastEvent('USER_DELETED', { id, name: existing.name, role: existing.role });
      res.json({
        success: true,
        message: `User ${existing.name} removed from database.`
      });
    } else {
      res.status(500).json({ success: false, message: 'Could not delete user.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/stats', (_req: Request, res: Response) => {
  try {
    const stats = getDatabaseStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------------------------------
// REST API ROUTES: Fleet & Hospital Data
// --------------------------------------------------------------------------
const ambulancesFilePath = path.join(process.cwd(), 'data/ambulances.json');
const hospitalsFilePath = path.join(process.cwd(), 'data/hospitals.json');

function getAmbulances() {
  if (fs.existsSync(ambulancesFilePath)) {
    return JSON.parse(fs.readFileSync(ambulancesFilePath, 'utf-8'));
  }
  return [];
}

function saveAmbulances(data: any) {
  fs.writeFileSync(ambulancesFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getHospitals() {
  if (fs.existsSync(hospitalsFilePath)) {
    return JSON.parse(fs.readFileSync(hospitalsFilePath, 'utf-8'));
  }
  return [];
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

app.get('/api/ambulances', (req: Request, res: Response) => {
  try {
    const ambulances = getAmbulances();
    const { status, type } = req.query;
    let filtered = [...ambulances];

    if (status) {
      filtered = filtered.filter((a: any) => a.status.toLowerCase() === String(status).toLowerCase());
    }
    if (type) {
      filtered = filtered.filter((a: any) => a.type.toLowerCase().includes(String(type).toLowerCase()));
    }

    res.json({
      success: true,
      count: filtered.length,
      total_in_fleet: ambulances.length,
      data: filtered,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ambulances/:id', (req: Request, res: Response) => {
  const ambulances = getAmbulances();
  const ambulance = ambulances.find((a: any) => a.id.toUpperCase() === req.params.id.toUpperCase());
  if (!ambulance) {
    return res.status(404).json({ success: false, message: 'Ambulance not found' });
  }
  res.json({ success: true, data: ambulance });
});

app.post('/api/ambulances/dispatch', (req: Request, res: Response) => {
  try {
    const { latitude, longitude, patient_name, emergency_type, required_type } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const patientLat = parseFloat(latitude);
    const patientLon = parseFloat(longitude);
    const ambulances = getAmbulances();

    let candidates = ambulances.filter((a: any) => a.status === 'available');
    if (required_type) {
      const match = candidates.filter((a: any) => a.type.toLowerCase().includes(String(required_type).toLowerCase()));
      if (match.length > 0) candidates = match;
    }

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No available ambulances found in Mira Road area.'
      });
    }

    const withDistance = candidates.map((u: any) => {
      const dist = calculateHaversineDistance(
        u.current_location.latitude,
        u.current_location.longitude,
        patientLat,
        patientLon
      );
      const eta = Math.max(Math.ceil((dist / 30) * 60), 2);
      return { ...u, distance_km: dist, eta_minutes: eta };
    }).sort((a: any, b: any) => a.distance_km - b.distance_km);

    const selected = withDistance[0];

    // Find nearest hospital
    const hospitals = getHospitals();
    const hospitalsWithDist = hospitals.map((h: any) => ({
      ...h,
      distance_km: calculateHaversineDistance(patientLat, patientLon, h.location.latitude, h.location.longitude)
    })).sort((a: any, b: any) => a.distance_km - b.distance_km);

    const recommendedHospital = hospitalsWithDist[0] || null;

    // Automatically persist emergency incident into SQLite database
    const emergencyId = req.body.id || `EMG-${Date.now().toString().slice(-5)}`;
    const emergencyRecord: EmergencyRecord = {
      id: emergencyId,
      caller_name: patient_name || 'Emergency Victim',
      caller_phone: String(req.body.patient_contact || req.body.caller_phone || '9892088776').replace(/\D/g, '').slice(-10),
      emergency_type: emergency_type || 'General Emergency',
      priority: req.body.priority || 'Critical (P1)',
      latitude: patientLat,
      longitude: patientLon,
      landmark: req.body.landmark || 'Mira Road GPS Landmark',
      status: 'dispatched',
      assigned_ambulance_id: selected.id,
      assigned_ambulance_plate: selected.vehicle_number,
      driver_name: selected.driver_name,
      driver_contact: selected.contact,
      target_hospital_id: recommendedHospital?.id || null,
      target_hospital_name: recommendedHospital?.name || null,
      eta_minutes: selected.eta_minutes || 4,
      distance_km: selected.distance_km || 1.5,
      vitals_json: req.body.vitals ? JSON.stringify(req.body.vitals) : null,
      notes: req.body.notes || `Dispatched Unit ${selected.vehicle_number} to ${req.body.landmark || 'incident location'}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      insertEmergencyInDb(emergencyRecord);
    } catch (dbErr) {
      console.warn('Emergency DB insert fallback:', dbErr);
    }

    const dispatchPayload = {
      emergency_location: { latitude: patientLat, longitude: patientLon, landmark: emergencyRecord.landmark },
      patient_name: patient_name || 'Emergency Victim',
      patient_contact: emergencyRecord.caller_phone,
      emergency_type: emergency_type || 'General Emergency',
      assigned_ambulance: selected,
      recommended_hospital: recommendedHospital,
      other_available_units: withDistance.slice(1),
      mission_id: `MSN-${Date.now().toString().slice(-5)}`,
      emergency_record: emergencyRecord
    };

    // BROADCAST INSTANT TELEMETRY ACROSS ALL CONNECTED DASHBOARD TABS
    // (Admin Dash, Driver Dash, Dispatcher Dash, Hospital Coordinator)
    broadcastEvent('EMERGENCY_DISPATCHED', dispatchPayload);

    res.json({
      success: true,
      message: `Nearest ambulance ${selected.vehicle_number} (${selected.id}) assigned successfully!`,
      dispatch_result: dispatchPayload,
      dispatched_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------------------------------------------------------
// REST API ROUTES: Real-Time Emergencies & CAD Incident Persistence (SQLite)
// --------------------------------------------------------------------------
app.get('/api/emergencies', (_req: Request, res: Response) => {
  try {
    const list = getAllEmergenciesFromDb();
    res.json({
      success: true,
      count: list.length,
      data: list,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/emergencies/:id', (req: Request, res: Response) => {
  try {
    const item = getEmergencyByIdFromDb(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/emergencies', (req: Request, res: Response) => {
  try {
    const { caller_name, caller_phone, emergency_type, latitude, longitude, landmark, priority } = req.body;
    if (!caller_name || !emergency_type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Caller name, emergency type, latitude, and longitude are required.'
      });
    }

    const id = req.body.id || `EMG-${Date.now().toString().slice(-5)}`;
    const newEmergency: EmergencyRecord = {
      id,
      caller_name,
      caller_phone: String(caller_phone || '9892088776').replace(/\D/g, '').slice(-10),
      emergency_type,
      priority: priority || 'Critical (P1)',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      landmark: landmark || 'Mira Road GPS Landmark',
      status: req.body.status || 'pending',
      assigned_ambulance_id: req.body.assigned_ambulance_id || null,
      assigned_ambulance_plate: req.body.assigned_ambulance_plate || null,
      driver_name: req.body.driver_name || null,
      driver_contact: req.body.driver_contact || null,
      target_hospital_id: req.body.target_hospital_id || null,
      target_hospital_name: req.body.target_hospital_name || null,
      eta_minutes: req.body.eta_minutes || null,
      distance_km: req.body.distance_km || null,
      vitals_json: req.body.vitals_json || null,
      notes: req.body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = insertEmergencyInDb(newEmergency);

    // Broadcast live SOS incident to Platform Administrator, Driver, CAD Dispatcher
    broadcastEvent('EMERGENCY_CREATED', saved);

    res.status(201).json({
      success: true,
      message: `Emergency incident ${saved.id} registered and broadcasted across network.`,
      data: saved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/emergencies/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = getEmergencyByIdFromDb(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Emergency incident not found in database.' });
    }

    const updated = updateEmergencyInDb(id, req.body);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Failed to update emergency.' });
    }

    // Broadcast updated state to all connected dashboards
    broadcastEvent('EMERGENCY_UPDATED', updated);
    if (updated.status === 'completed' || updated.status === 'cancelled') {
      broadcastEvent('MISSION_ENDED', { emergencyId: id, status: updated.status });
    }

    res.json({
      success: true,
      message: `Emergency incident ${id} updated to status "${updated.status}".`,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/emergencies/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteEmergencyFromDb(id);
    if (deleted) {
      broadcastEvent('EMERGENCY_DELETED', { id });
      res.json({ success: true, message: `Emergency ${id} removed.` });
    } else {
      res.status(404).json({ success: false, message: 'Emergency not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/ambulances/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  let { status } = req.body;

  const ambulances = getAmbulances();
  const idx = ambulances.findIndex((a: any) => a.id.toUpperCase() === id.toUpperCase());
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Ambulance not found' });
  }

  // If status is not provided, toggle current state
  if (!status) {
    status = ambulances[idx].status === 'available' ? 'busy' : 'available';
  } else {
    status = status.toLowerCase();
    if (!['available', 'busy'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be available or busy' });
    }
  }

  ambulances[idx].status = status;
  saveAmbulances(ambulances);

  // Broadcast fleet status change
  broadcastEvent('AMBULANCE_STATUS_UPDATED', { id, status, vehicle_number: ambulances[idx].vehicle_number });

  res.json({ success: true, message: `Status updated to ${status}`, data: ambulances[idx] });
});

app.get('/api/hospitals', (_req: Request, res: Response) => {
  const hospitals = getHospitals();
  res.json({ success: true, count: hospitals.length, data: hospitals });
});

app.get('/api/system-info', (_req: Request, res: Response) => {
  res.json({
    project: 'Lifeline: Smart Emergency Ambulance Dispatch & Routing System',
    version: '1.0.0-production',
    region: 'Mira Road Emergency Operations Center, Thane, Mumbai Suburban Region',
    algorithm: 'Haversine Great-Circle Distance Metric + Status Heuristics',
    coverage_area: 'Mira Road East & West, Kashimira, Western Express Highway',
    database: 'SQLite 3 (node:sqlite) + Real-time Server-Sent Events',
    database_features: ['Persistent multi-user storage', 'Live SSE dashboard broadcast', 'Auto schema migrations']
  });
});

// Full-stack Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚑 Lifeline Server with SQLite Database running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
