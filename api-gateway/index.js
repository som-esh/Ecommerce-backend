const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const winston = require('winston');

const app = express();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

app.use('/auth', createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/auth': '' }
}));
app.use('/products', createProxyMiddleware({
  target: 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/products': '' }
}));
app.use('/cart', createProxyMiddleware({
  target: 'http://cart-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/cart': '' }
}));
app.use('/order', createProxyMiddleware({
  target: 'http://order-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/order': '' }
}));
app.use('/payments', createProxyMiddleware({
  target: 'http://payment-service:3005',
  changeOrigin: true,
  pathRewrite: { '^/payments': '' }
}));

app.listen(3000, () => logger.info('API Gateway running on 3000'));




