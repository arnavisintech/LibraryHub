const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/constants');
const authenticate = require('./middleware/authenticate');

const app = express();

app.use(cors({ origin: ['http://localhost:3001', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use('/api', authenticate);

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/books',        require('./routes/books'));
app.use('/api/members',      require('./routes/members'));
app.use('/api/issues',       require('./routes/issues'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/fines',        require('./routes/fines'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/users',        require('./routes/users'));

app.listen(PORT, () => {
  console.log(`Library Dashboard API running at http://localhost:${PORT}`);
});
