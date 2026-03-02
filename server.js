const express = require('express');
const Database = require('better-sqlite3');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la Base de Datos SQLite
const db = new Database('sensor_data.db', { verbose: console.log });

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints

// Guardar datos
app.post('/api/data', (req, res) => {
  const { temperature, humidity } = req.body;

  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: 'Temperatura y humedad son requeridas' });
  }

  try {
    const info = db.prepare('INSERT INTO readings (temperature, humidity) VALUES (?, ?)').run(temperature, humidity);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Datos guardados correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar los datos' });
  }
});

// Obtener historial
app.get('/api/data', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM readings ORDER BY timestamp DESC LIMIT 50').all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
