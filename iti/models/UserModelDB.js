const mongoose = require('mongoose');
const { Schema } = mongoose;

const Cart = require('./CartModelDB');

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// One-to-one relationship between User and Cart
userSchema.pre('remove', async function(next) {
  await Cart.deleteOne({ userId: this._id });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
