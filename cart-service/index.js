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

const carts = new Map();

// Cart Endpoints
app.get('/:userId', (req, res) =>
  res.json([...carts.get(Number(req.params.userId)) || []])
);

app.post('/add', (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  const cart = carts.get(userId) || [];
  cart.push({ productId, quantity });
  carts.set(userId, cart);
  res.json({ success: true });
});

// Service Registration
consul.agent.service.register({
  name: 'cart-service',
  address: 'cart-service',
  port: 3003,
  check: {
    http: 'http://cart-service:3003/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3003, () => console.log('Cart Service running on port 3003'));