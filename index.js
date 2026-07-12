const express = require('express');

// ── Load seed data into memory once at startup ────────────────────────────────
const seed = require('./seed_data.json');

const provinces = seed.provinces;   // [{ id, name }]
const districts = seed.districts;   // [{ id, name, province_id }]
const stations  = seed.stations;    // [{ id, name, district_id }]
const vehicles  = seed.vehicles;    // [{ id, registration_number, device_id, station_id }]
const pings     = seed.pings;       // [{ id, vehicle_id, latitude, longitude, timestamp }]

// ── Shape-mapping helpers (seed field names → response field names) ────────────

const fmtProvince = p => ({
  province_id : p.id,
  name        : p.name,
});

const fmtDistrict = d => ({
  district_id : d.id,
  name        : d.name,
  province_id : d.province_id,
});

const fmtStation = s => ({
  station_id  : s.id,
  name        : s.name,
  district_id : s.district_id,
});

const fmtVehicle = v => ({
  vehicle_id  : v.id,
  reg_number  : v.registration_number,
  device_id   : v.device_id,
  station_id  : v.station_id,
});

const fmtPing = p => ({
  ping_id    : p.id,
  vehicle_id : p.vehicle_id,
  timestamp  : p.timestamp,
  lat        : p.latitude,
  lng        : p.longitude,
  speed      : p.speed ?? null,
});

// ── App setup ─────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', session: 'NB6007CEM S2' });
});

// ── Provinces ─────────────────────────────────────────────────────────────────

// GET /provinces  -> [{ province_id, name }]
app.get('/provinces', (req, res) => {
  res.json(provinces.map(fmtProvince));
});

// GET /provinces/:id  -> { province_id, name }
app.get('/provinces/:id', (req, res) => {
  const province = provinces.find(p => p.id === Number(req.params.id));
  if (!province) {
    return res.status(404).json({ error: "Province not found" });
  }
  res.json(fmtProvince(province));
});

// ── Districts ─────────────────────────────────────────────────────────────────

// GET /districts  -> [{ district_id, name, province_id }]
app.get('/districts', (req, res) => {
  res.json(districts.map(fmtDistrict));
});

// GET /districts/:id  -> { district_id, name, province_id }
app.get('/districts/:id', (req, res) => {
  const district = districts.find(d => d.id === Number(req.params.id));
  if (!district) {
    return res.status(404).json({ error: "District not found" });
  }
  res.json(fmtDistrict(district));
});

// ── Stations ──────────────────────────────────────────────────────────────────

// GET /stations  -> [{ station_id, name, district_id }]
app.get('/stations', (req, res) => {
  res.json(stations.map(fmtStation));
});

// GET /stations/:id  -> { station_id, name, district_id }
app.get('/stations/:id', (req, res) => {
  const station = stations.find(s => s.id === Number(req.params.id));
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }
  res.json(fmtStation(station));
});

// ── Vehicles ──────────────────────────────────────────────────────────────────

// GET /vehicles  -> [{ vehicle_id, reg_number, device_id, station_id }]
app.get('/vehicles', (req, res) => {
  res.json(vehicles.map(fmtVehicle));
});

// GET /vehicles/:id  -> { vehicle_id, reg_number, device_id, station_id, last_ping }
app.get('/vehicles/:id', (req, res) => {
  const id      = Number(req.params.id);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  // Find the most recent ping for this vehicle
  const lastPing = pings
    .filter(p => p.vehicle_id === id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] ?? null;

  res.json({
    ...fmtVehicle(vehicle),
    last_ping: lastPing ? fmtPing(lastPing) : null,
  });
});

// GET /vehicles/:id/pings  -> [{ ping_id, vehicle_id, timestamp, lat, lng, speed }]
app.get('/vehicles/:id/pings', (req, res) => {
  const id      = Number(req.params.id);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  res.json(pings.filter(p => p.vehicle_id === id).map(fmtPing));
});

// GET /vehicles/:id/last-position  -> { vehicle_id, timestamp, lat, lng, speed }
app.post('/vehicles/:id/pings', (req, res) => {
  const id      = Number(req.params.id);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const { latitude, longitude, speed } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }

  const newPing = {
    id: pings.length > 0 ? Math.max(...pings.map(p => p.id)) + 1 : 1,
    vehicle_id: id,
    latitude: Number(latitude),
    longitude: Number(longitude),
    speed: speed !== undefined ? Number(speed) : null,
    timestamp: new Date().toISOString()
  };

  pings.push(newPing);

  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, 'seed_data.json'), JSON.stringify(seed, null, 2));

  res.status(201).json(fmtPing(newPing));
});

// GET /vehicles/:id/last-position  -> { vehicle_id, timestamp, lat, lng, speed }
app.get('/vehicles/:id/last-position', (req, res) => {
  const id      = Number(req.params.id);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const lastPing = pings
    .filter(p => p.vehicle_id === id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (!lastPing) {
    return res.status(404).json({ error: "Position data not found" });
  }

  res.json({
    vehicle_id : lastPing.vehicle_id,
    timestamp  : lastPing.timestamp,
    lat        : lastPing.latitude,
    lng        : lastPing.longitude,
    speed      : lastPing.speed ?? null,
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded: ${provinces.length} provinces, ${districts.length} districts, ` +
              `${stations.length} stations, ${vehicles.length} vehicles, ${pings.length} pings`);
});
