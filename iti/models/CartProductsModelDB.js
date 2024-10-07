const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartProductsSchema = new Schema({
  cartId: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
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

// Define Many-to-Many relationship through CartProducts
CartProductsSchema.index({ cartId: 1, productId: 1 }, { unique: true });

const CartProducts = mongoose.model('CartProducts', CartProductsSchema);
module.exports = CartProducts;
