const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { AddressSchema, OrderItemSchema } = require("./schemas");

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [OrderItemSchema],
    
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "canceled"],
      default: "pending",
    },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    shippingAddress: AddressSchema,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
