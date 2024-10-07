const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderProductsSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  }
}, {
  timestamps: false
});

// Define Many-to-Many relationship through OrderProducts
orderProductsSchema.index({ orderId: 1, productId: 1 }, { unique: true });

const OrderProducts = mongoose.model('OrderProducts', orderProductsSchema);
module.exports = OrderProducts;
