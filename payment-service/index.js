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
const Opossum = require('opossum');
app.use(express.json());

// Circuit Breaker for payment service
const paymentCircuit = new Opossum(async () => {
  // Mock payment service call
  if (Math.random() > 0.2) return 'success';
  throw new Error('Payment failed');
}, { timeout: 1000, errorThresholdPercentage: 50 });

app.post('/process', (req, res) => {
  const success = Math.random() < 0.8; // 80% success rate
  res.json({ success, transactionId: Date.now().toString(36) });
});

// Service Registration
consul.agent.service.register({
  name: 'payment-service',
  address: 'payment-service',
  port: 3005,
  check: {
    http: 'http://payment-service:3005/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3005, () => console.log('Payment Service running on port 3005'));