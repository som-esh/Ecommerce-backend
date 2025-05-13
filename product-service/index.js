const express = require('express');
const rateLimit = require('express-rate-limit');
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

let products = [
  { id: 1, name: 'Product 1', price: 100, stock: 10 },
  { id: 2, name: 'Product 2', price: 200, stock: 5 }
];

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Product Endpoints
app.get('/', (req, res) => res.json(products));
app.post('/check-stock', (req, res) => {
  const sufficientStock = req.body.items.every(item =>
    products.find(p => p.id === item.productId)?.stock >= item.quantity
  );
  res.json({ inStock: sufficientStock });
});

app.post('/update-inventory', (req, res) => {
  const { items } = req.body;

  try {
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (product.stock >= item.quantity) {
          product.stock -= item.quantity;  // Deduct stock
        } else {
          throw new Error(`Not enough stock for product ${item.productId}`);
        }
      } else {
        throw new Error(`Product ${item.productId} not found`);
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Inventory update failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Service Registration
consul.agent.service.register({
  name: 'product-service',
  address: 'product-service',
  port: 3002,
  check: {
    http: 'http://product-service:3002/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3002, () => console.log('Product Service running on port 3002'));