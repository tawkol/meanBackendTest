const mongoose = require('mongoose');

// User and Product models should be defined separately, assuming they exist.
const  User  = require("./UserModelDB");
const  Product  = require("./ProductsModelDB");

// Define the Feedback schema
const feedbackSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId, // References the Product model
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // References the User model
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// One-to-Many relationship between User and Feedback
// We don't need to define explicit relationships like Sequelize. 
// Mongoose resolves these relationships at query time using references (ref).

// Export the Feedback model
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback ;
