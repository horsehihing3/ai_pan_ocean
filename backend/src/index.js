require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const visitRequestRoutes = require('./routes/visitRequests');
const evaluationRoutes = require('./routes/evaluations');
const companyRoutes = require('./routes/companies');
const noticeRoutes = require('./routes/notices');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/visit-requests', visitRequestRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/notices', noticeRoutes);

app.use(errorHandler);

const { startReminderScheduler } = require('./utils/scheduler');

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReminderScheduler();
});
