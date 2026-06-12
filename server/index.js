require('express-async-errors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const membersRoutes = require('./routes/members');
const givingsRoutes = require('./routes/givings');
const tithesRoutes = require('./routes/tithes');
const projectsRoutes = require('./routes/projects');
const inventoryRoutes = require('./routes/inventory');
const attendanceRoutes = require('./routes/attendance');
const expensesRoutes = require('./routes/expenses');
const departmentsRoutes = require('./routes/departments');
const departmentTransactionsRoutes = require('./routes/department-transactions');
const bulkSmsRoutes = require('./routes/bulk-sms');
const { initDatabase } = require('./db');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// expose routes after the database is ready
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/givings', givingsRoutes);
app.use('/api/tithes', tithesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/department-transactions', departmentTransactionsRoutes);
app.use('/api/bulk-sms', bulkSmsRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      }
    });
  }
}

app.get('/api', (req, res) => {
  res.json({ message: 'Mizpah church management API' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const http = require('http');
const { setIo } = require('./realtime');

initDatabase().then(() => {
  const server = http.createServer(app);
  // initialize realtime sockets (allows CORS to frontend)
  setIo(server, { origin: process.env.CORS_ORIGIN || '*' });
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
