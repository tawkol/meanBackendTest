// models/Payment.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    amount: { type: Number, required: true },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
