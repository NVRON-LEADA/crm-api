require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const amazonRoutes = require('./routes/Amazon');

const app = express();
app.use(cors());

// Only for SNS route: parse as text
app.use('/api/ses/notifications', bodyParser.text({ type: '*/*' }));

// For all other routes, parse JSON normally
app.use(bodyParser.json());

// Mount routes
app.use('/api', amazonRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
