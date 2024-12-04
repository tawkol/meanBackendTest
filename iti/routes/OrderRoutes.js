const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Cart = require("../models/CartModelDB"); // Adjust the path to your Cart model
const Order = require("../models/OrderModelDB"); // Adjust the path to your Cart model
const Payment = require("../models/PaymentModelDB");
const languageMiddleware = require("../middleware/LanguageMW");

const { transformProductData } = require("../util/localize");

router.use(languageMiddleware);

router.post("/", async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");
  const { paymentMethod, shippingAddress, shippingPrice } = req.body;
  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(404).send("Cart not found");
    }

    let totalAmount = shippingPrice;
    cart.items.forEach((item) => {
      totalAmount += item.product.price * item.quantity;
    });

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const order = await Order.create({
      user: userId,
      products: orderItems,
      totalAmount,
      shippingAddress,
    });

    // Create Payment record
    const paymentRecord = await Payment.create({
      order: order._id,
      amount: totalAmount,
      paymentMethod,
    });

    // Add payment reference to the order
    order.payment = paymentRecord._id;
    await order.save();

    // Clear the cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order, payment: paymentRecord },
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(400).send("Order creation failed");
  }
});

// 3. Get User's Latest Order
router.get("/", async (req, res) => {
  const token = req.header("x-auth-token");
  const lang = req.lang;

  if (!token) return res.status(401).send("Access Denied");
  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;

    let orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("products.product")
      .populate("payment", "paymentMethod paymentStatus -_id");

    if (!orders.length) return res.status(404).send("No orders found");

    const transformedOrders = orders.map((order) => {
      const transformedProducts = order.products.map((item) => ({
        quantity: item.quantity,
        price: item.price,
        ...transformProductData(item.product, lang),
      }));
      return {
        ...order._doc,
        products: transformedProducts,
      };
    });

    return res.status(200).json(transformedOrders);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(400).send(err);
  }
});

router.get("/:id", async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    let order = await Order.findById(req.params.id)
      .populate("products.product")
      .populate("payment");

    if (!order) {
      return res.status(404).send("Order not found");
    }
    const transformedProducts = order.products.map((item) => ({
      quantity: item.quantity,
      _price: item.price,
      ...transformProductData(item.product, lang),
    }));
    order = {
      ...order,
      products: transformedProducts,
    };

    return res.status(200).json(order);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(400).send("Error retrieving orders");
  }
});
module.exports = router;
