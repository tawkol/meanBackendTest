const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order_status: {
    type: String,
    enum: ["Shipped", "Waiting for Confirmation"],
    required: true,
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// One-to-many relationship between User and Orders
orderSchema.index({ userId: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
