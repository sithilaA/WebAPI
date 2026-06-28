const express = require('express');
const path    = require('path');

// ── Load seed data into memory once at startup ────────────────────────────────
const seed = require('./seed_data.json');

const provinces = seed.provinces;   // [{ id, name }]
const districts = seed.districts;   // [{ id, name, province_id }]
const stations  = seed.stations;    // [{ id, name, district_id }]
const vehicles  = seed.vehicles;    // [{ id, registration_number, device_id, station_id }]
const pings     = seed.pings;       // [{ id, vehicle_id, latitude, longitude, timestamp }]

// ── App setup ─────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', session: 'NB6007CEM S2' });
});

// ── Provinces ─────────────────────────────────────────────────────────────────

// GET /provinces  – list all provinces
app.get('/provinces', (req, res) => {
  res.json(provinces);
});

// GET /provinces/:provinceId  – single province
app.get('/provinces/:provinceId', (req, res) => {
  const id       = Number(req.params.provinceId);
  const province = provinces.find(p => p.id === id);
  if (!province) {
    return res.status(404).json({ error: `Province with id ${id} not found.` });
  }
  res.json(province);
});

// ── Districts ─────────────────────────────────────────────────────────────────

// GET /districts  – list all districts
app.get('/districts', (req, res) => {
  res.json(districts);
});

// GET /districts/:districtId  – single district
app.get('/districts/:districtId', (req, res) => {
  const id       = Number(req.params.districtId);
  const district = districts.find(d => d.id === id);
  if (!district) {
    return res.status(404).json({ error: `District with id ${id} not found.` });
  }
  res.json(district);
});

// ── Stations ──────────────────────────────────────────────────────────────────

// GET /stations  – list all stations
app.get('/stations', (req, res) => {
  res.json(stations);
});

// GET /stations/:stationId  – single station
app.get('/stations/:stationId', (req, res) => {
  const id      = Number(req.params.stationId);
  const station = stations.find(s => s.id === id);
  if (!station) {
    return res.status(404).json({ error: `Station with id ${id} not found.` });
  }
  res.json(station);
});

// ── Vehicles ──────────────────────────────────────────────────────────────────

// GET /vehicles  – list all vehicles
app.get('/vehicles', (req, res) => {
  res.json(vehicles);
});

// GET /vehicles/:vehicleId  – single vehicle
app.get('/vehicles/:vehicleId', (req, res) => {
  const id      = Number(req.params.vehicleId);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle with id ${id} not found.` });
  }
  res.json(vehicle);
});

// GET /vehicles/:vehicleId/pings  – all pings for a vehicle
app.get('/vehicles/:vehicleId/pings', (req, res) => {
  const id      = Number(req.params.vehicleId);
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    return res.status(404).json({ error: `Vehicle with id ${id} not found.` });
  }
  const vehiclePings = pings.filter(p => p.vehicle_id === id);
  res.json(vehiclePings);
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded: ${provinces.length} provinces, ${districts.length} districts, ` +
              `${stations.length} stations, ${vehicles.length} vehicles, ${pings.length} pings`);
});
