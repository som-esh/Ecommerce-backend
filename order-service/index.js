const express = require('express');
const Consul = require('consul');     // ✅ Correct import
const consul = new Consul(
  {
    host: 'consul',   // This must match the service name in docker-compose
    port: '8500',
    promisify: true
  }
);
const axios = require('axios');
const app = express();
app.use(express.json());

const getServiceUrl = async (serviceName) => {
  const instances = await consul.health.service(serviceName);
  return `http://${instances[0].Service.Address}:${instances[0].Service.Port}`;
};

app.post('/', async (req, res) => {
  try {
    // 1. Check inventory
    const productServiceUrl = await getServiceUrl('product-service');
    const stockCheck = await axios.post(`${productServiceUrl}/check-stock`, {
      items: req.body.items
    });

    if (!stockCheck.data.inStock) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // 2. Process payment
    const paymentServiceUrl = await getServiceUrl('payment-service');
    const paymentResult = await axios.post(`${paymentServiceUrl}/process`, {
      amount: req.body.total
    });

    if (!paymentResult.data.success) {
      return res.status(400).json({ error: 'Payment failed' });
    }

    // 3. Update inventory
    const updateInventoryPayload = req.body.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const inventoryUpdateResult = await axios.post(`${productServiceUrl}/update-inventory`, {
      items: updateInventoryPayload
    });

    if (!inventoryUpdateResult.data.success) {
      return res.status(400).json({ error: 'Inventory update failed' });
    }

    // 4. Send notification
    const notificationServiceUrl = await getServiceUrl('notification-service');
    await axios.post(`${notificationServiceUrl}/notify`, {
      userId: req.body.userId,
      message: 'Order placed successfully'
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Order processing failed' });
  }
});

// Service Registration
consul.agent.service.register({
  name: 'order-service',
  address: 'order-service',
  port: 3004,
  check: {
    http: 'http://order-service:3004/health',
    interval: '10s'
  }
});

app.get('/health', (req, res) => res.sendStatus(200));
app.listen(3004, () => console.log('Order Service running on port 3004'));