const express = require('express');
const Consul = require('consul');     // ✅ Correct import
const consul = new Consul(
  {
    host: 'consul',   // This must match the service name in docker-compose
    port: '8500',
    promisify: true
  }
);
const app = express();
app.use(express.json());

const users = [
  { id: 1, username: 'user1', password: 'pass1' },
  { id: 2, username: 'user2', password: 'pass2' }
];

// Authentication
app.post('/login', (req, res) => {
  const user = users.find(u =>
    u.username === req.body.username &&
    u.password === req.body.password
  );
  user ? res.json({ success: true }) : res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Service Registration
consul.agent.service.register({
  name: 'auth-service',
  address: 'auth-service',
  port: 3001,
  check: {
    http: 'http://auth-service:3001/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3001, () => console.log('Auth Service running on port 3001'));