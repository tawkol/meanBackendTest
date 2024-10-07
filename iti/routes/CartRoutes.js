const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();
const Cart = require("../models/CartModelDB"); // Adjust the path to your Cart model
const CartProducts = require("../models/CartProductsModelDB"); // Adjust the path to your CartProducts model
const Product = require("../models/ProductsModelDB"); // Adjust the path to your Product model

// POST /cart
router.post("/", async (req, res) => {
    const token = req.header("x-auth-token");
    // if (!token) return res.status(401).send("Access Denied");
    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userid = decodedPayload.userid;

        // Find the cart by user ID
        const cart = await Cart.findOne({ userId: userid });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        const { productId, quantity } = req.body;

        // Debugging: Log received data
        console.log('ProductId:', productId);
        console.log('Quantity:', quantity);

        // Create a new CartProducts entry
        const cartProduct = new CartProducts({
            cartId: cart._id,
            productId: productId,
            quantity: quantity
        });

        await cartProduct.save();

        return res.status(200).send("Products added to your cart successfully");
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Products NOT added to your cart");
    }
});

// PATCH /cart/:prodId
router.patch("/:prodId", async (req, res) => {
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).send("Access Denied");

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        // Update the cart product entry
        const updatedCartProduct = await CartProducts.findOneAndUpdate(
            { cartId: cart._id, productId: req.params.prodId },
            { quantity: req.body.quantity },
            { new: true } // Return the updated document
        );

        if (!updatedCartProduct) {
            return res.status(404).send("Cart product not found");
        }

        return res.status(200).send("Product quantity updated successfully");
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Error updating product quantity");
    }
});

// GET /cart
router.get("/", async (req, res) => {
    const token = req.header("x-auth-token");
    // if (!token) return res.status(401).send("Access Denied");
    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userid = decodedPayload.userid;

        const cart = await Cart.findOne({ userId: userid });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        const cartProducts = await CartProducts.find({ cartId: cart._id }).populate("productId");

        // Convert the array of instances to plain JavaScript objects
        const cartProductsData = cartProducts.map(cartProduct => {
            const cartProductJSON = cartProduct.toObject();
            // Transform the img_url field from a string to an array
            cartProductJSON.productId.img_urls = cartProductJSON.productId.img_url ? cartProductJSON.productId.img_url.split(',') : [];
            return cartProductJSON;
        });

        return res.status(200).json(cartProductsData);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Cart items NOT retrieved");
    }
});

// DELETE /cart/:prodId
router.delete("/:prodId", async (req, res) => {
    const token = req.header("x-auth-token");
    // if (!token) return res.status(401).send("Access Denied");
    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userid = decodedPayload.userid;

        const cart = await Cart.findOne({ userId: userid });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        await CartProducts.findOneAndDelete({
            cartId: cart._id,
            productId: req.params.prodId
        });

        return res.status(200).send("Item deleted successfully");
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Item NOT deleted");
    }
});

// DELETE /cart
router.delete("/", async (req, res) => {
    const token = req.header("x-auth-token");
    // if (!token) return res.status(401).send("Access Denied");
    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userid = decodedPayload.userid;

        const cart = await Cart.findOne({ userId: userid });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        await CartProducts.deleteMany({ cartId: cart._id });

        return res.status(200).send("The cart has been emptied");
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Cart NOT emptied");
    }
});

module.exports = router;
