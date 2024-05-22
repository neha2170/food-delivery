const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/user-service', { useNewUrlParser: true, useUnifiedTopology: true });

// Define schemas and models
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String, // In a real application, ensure this is hashed
  }));

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
  deliveryAgentId: String,
  rating: Number,
  comment: String
}));

// User routes
app.post('/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send(user);
  });
  
  app.get('/users', async (req, res) => {
    const users = await User.find();
    res.send(users);
  });

// Define routes
app.get('/restaurants', async (req, res) => {
  const { online, hour } = req.query;
  const status = online === 'true' ? 'online' : 'offline';
  const restaurants = await Restaurant.find({ status, availableHours: hour });
  res.send(restaurants);
});

app.post('/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.send(order);
});

app.post('/orders/:orderId/rating', async (req, res) => {
  const { rating, comment } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.orderId, { rating, comment }, { new: true });
  res.send(order);
});

app.listen(4000, () => {
  console.log('User Service listening on port 4000');
});
