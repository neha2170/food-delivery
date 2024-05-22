const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/restaurant-service', { useNewUrlParser: true, useUnifiedTopology: true });

// Define schemas and models
const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
  name: String,
  menu: Array,
  availableHours: Array,
  status: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  userId: String,
  restaurantId: String,
  items: Array,
  status: String,
  deliveryAgentId: String
}));

// Define routes
app.post('/restaurants', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.send(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.put('/restaurants/:restaurantId/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.restaurantId, { menu: req.body.menu }, { new: true });
    res.send(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.put('/restaurants/:restaurantId/status', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.restaurantId, { status: req.body.status }, { new: true });
    res.send(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.post('/restaurants/:restaurantId/orders', async (req, res) => {
  try {
    const order = new Order({
      userId: req.body.userId,
      restaurantId: req.params.restaurantId,
      items: req.body.items,
      status: 'pending'
    });
    await order.save();
    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.put('/restaurants/:restaurantId/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }

    if (status === 'accepted' && order.status !== 'pending') {
      return res.status(400).send({ error: 'Order status cannot be changed to accepted' });
    }

    order.status = status;
    await order.save();

    if (status === 'accepted') {
      // Auto-assign delivery agent
      const response = await axios.get('http://localhost:4002/deliveryAgents');
      const deliveryAgents = response.data;
      const availableAgent = deliveryAgents.find(agent => agent.status === 'available');
      if (availableAgent) {
        order.deliveryAgentId = availableAgent._id;
        await order.save();
        await axios.put(`http://localhost:4002/deliveryAgents/${availableAgent._id}/status`, { status: 'busy' });
      }
    }

    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.post('/restaurants/:restaurantId/orders/:orderId/reject', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status: 'rejected' }, { new: true });
    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }
    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.listen(4001, () => {
  console.log('Restaurant Service listening on port 4001');
});
