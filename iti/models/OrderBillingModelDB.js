const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderBillingSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phone1: {
    type: String,
    required: true,
  },
  phone2: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  flatNo: {
    type: Number,
    required: true,
  },
  floorNo: {
    type: Number,
    required: true,
  },
  buildingNo: {
    type: Number,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: false,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const OrderBilling = mongoose.model('OrderBilling', orderBillingSchema);
module.exports = OrderBilling;
