const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { CartItemSchema } = require("./schemas");

const CartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: false,
  }
);

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
