const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/delivery-agent-service', { useNewUrlParser: true, useUnifiedTopology: true });

// Define schemas and models
const DeliveryAgent = mongoose.model('DeliveryAgent', new mongoose.Schema({
  name: String,
  status: { type: String, default: 'available' },
  location: String,
  updatedAt: Date
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  userId: String,
  restaurantId: String,
  items: Array,
  status: String,
  deliveryAgentId: String
}));

// Define routes
app.post('/deliveryAgents', async (req, res) => {
  const deliveryAgent = new DeliveryAgent(req.body);
  await deliveryAgent.save();
  res.send(deliveryAgent);
});

app.get('/deliveryAgents', async (req, res) => {
  const deliveryAgents = await DeliveryAgent.find();
  res.send(deliveryAgents);
});

app.put('/deliveryAgents/:agentId/status', async (req, res) => {
  const { status } = req.body;
  const deliveryAgent = await DeliveryAgent.findByIdAndUpdate(req.params.agentId, { status, updatedAt: new Date() }, { new: true });
  res.send(deliveryAgent);
});

app.put('/orders/:orderId/deliveryStatus', async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.orderId, { status, updatedAt: new Date() }, { new: true });
  if (status === 'delivered') {
    const deliveryAgent = await DeliveryAgent.findById(order.deliveryAgentId);
    if (deliveryAgent) {
      deliveryAgent.status = 'available';
      deliveryAgent.save();
    }
  }
  res.send(order);
});

app.listen(4002, () => {
  console.log('Delivery Agent Service listening on port 4002');
});
