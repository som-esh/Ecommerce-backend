const express = require('express');
const Consul = require('consul');     // ✅ Correct import
const consul = new Consul(
  {
    host: 'consul',   
    port: '8500',
    promisify: true
  }
); 
const app = express();
app.use(express.json());

app.post('/notify', (req, res) => {
  console.log(`Notification sent: ${JSON.stringify(req.body)}`);
  res.json({ success: true });
});

// Service Registration
consul.agent.service.register({
  name: 'notification-service',
  address: 'notification-service',
  port: 3006,
  check: {
    http: 'http://notification-service:3006/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3006, () => console.log('Notification Service running on port 3006'));