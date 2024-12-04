const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();
const Cart = require("../models/CartModelDB"); // Adjust the path to your Cart model
const languageMiddleware = require("../middleware/LanguageMW");

const { transformProductData } = require("../util/localize");

router.use(languageMiddleware);

router.get("/", async (req, res) => {
  const lang = req.lang;
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;

    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      // Create an empty cart if it doesn't exist
      cart = await Cart.create({ user: userId, items: [] });
    }
    const transformedProducts = cart.items.map((item) => ({
      quantity: item.quantity,
      ...transformProductData(item.product, lang),
      // product: transformProductData(item.product, lang),
    }));
    res.json(transformedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post("/", async (req, res) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");

  const cartItem = req.body;
  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: cartItem.product, quantity: cartItem.quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === cartItem.product
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = cartItem.quantity;
      } else {
        cart.items.push({
          product: cartItem.product,
          quantity: cartItem.quantity,
        });
      }
    }
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.delete("/:productId", async (req, res) => {
  const { productId } = req.params;
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
      await cart.save();
      res.json(cart);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.delete("/clear", async (res, req) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access Denied");
  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();
    res
      .status(201)
      .json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).send("Server error", error);
  }
});

module.exports = router;
