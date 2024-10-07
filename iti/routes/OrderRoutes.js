const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const express = require("express");
const router = express.Router();

const Cart = require("../models/CartModelDB"); // Adjust the path to your Cart model
const CartProducts = require("../models/CartProductsModelDB"); // Adjust the path to your CartProducts model
const Order = require("../models/OrderModelDB"); // Adjust the path to your Cart model
const OrderProducts = require("../models/OrderProductsModelDB"); // Adjust the path to your CartProducts model
const OrderBilling = require("../models/OrderBillingModelDB"); // Adjust the path to your CartProducts model
const Product = require("../models/ProductsModelDB"); // Adjust the path to your Product model


// 1. Create Order Bill
router.post("/bill", async (req, res) => {
    try {
        const token = req.header("x-auth-token");
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        const bill = new OrderBilling({
            UserId: userId,
            OrderId: req.body.OrderId,
            name: req.body.name,
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            flatNo: req.body.flatNo,
            floorNo: req.body.floorNo,
            buildingNo: req.body.buildingNo,
            street: req.body.street,
            city: req.body.city,
            details: req.body.details,
            totalCost: req.body.totalCost,
            paymentMethod: req.body.paymentMethod
        });

        await bill.save();
        res.status(200).send("Order bill created successfully");
    } catch (err) {
        console.error('Error:', err);  // Log the complete error for debugging
        res.status(400).send("Order bill failed. Please check the request data.");
    }
});

// 2. Create Order from Cart
router.post("/", async (req, res) => {
    const token = req.header("x-auth-token");

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        // Find the user's cart
        const cart = await Cart.findOne({ UserId: userId });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        // Create a new order for the user
        const order = new Order({ userId: userId, order_status: "Waiting for Confirmation" });
        await order.save();

        // Find all cart products for the user's cart
        const cartProducts = await CartProducts.find({ CartId: cart.id });

        if (cartProducts.length === 0) {
            return res.status(400).send("No products in cart");
        }

        // Map cart products to order products and create them in bulk
        const orderProductsData = cartProducts.map(item => ({
            OrderId: order.id,
            ProductId: item.ProductId,
            quantity: item.quantity
        }));

        await OrderProducts.insertMany(orderProductsData);

        // Optionally, you can clear the cart products after moving them to order products
        await CartProducts.deleteMany({ CartId: cart.id });

        return res.status(200).send("Order created and cart products moved successfully");
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Order creation failed");
    }
});

// 3. Get User's Latest Order
router.get("/", async (req, res) => {
    const token = req.header("x-auth-token");

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        const order = await Order.findOne({ userId: userId }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const orderProducts = await OrderProducts.find({ OrderId: order.id }).populate({
            path: 'Product',
            model: Product
        });

        // Process order products to transform img_url fields
        const orderProductsData = orderProducts.map(orderProduct => {
            const orderProductJSON = orderProduct.toObject();
            orderProductJSON.Product.img_urls = orderProductJSON.Product.img_url ? orderProductJSON.Product.img_url.split(',') : [];
            return orderProductJSON;
        });

        return res.status(200).json(orderProductsData);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send("Order items NOT retrieved");
    }
});

// 4. Get All Orders Billing for User
router.get('/all', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        const ordersBilling = await OrderBilling.find({ UserId: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'order',
                populate: {
                    path: 'orderProducts',
                    populate: {
                        path: 'Product'
                    }
                }
            });

        // Process the orders to transform img_url fields
        const ordersData = ordersBilling.map(orderBilling => {
            const orderBillingJSON = orderBilling.toObject();
            orderBillingJSON.order.orderProducts = orderBillingJSON.order.orderProducts.map(orderProduct => {
                orderProduct.Product.img_urls = orderProduct.Product.img_url ? orderProduct.Product.img_url.split(',') : [];
                return orderProduct;
            });
            return orderBillingJSON;
        });

        return res.status(200).json(ordersData);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send('Error retrieving orders');
    }
});

// 5. Get Order Billing Details by ID
router.get('/:id', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.userid;

        // Fetch order details including associated models
        const ordersBilling = await OrderBilling.findOne({
            OrderId: req.params.id,
            UserId: userId
        })
        .populate({
            path: 'order',
            populate: {
                path: 'orderProducts',
                populate: {
                    path: 'Product'
                }
            }
        });

        // If no order found, return 404
        if (!ordersBilling) {
            return res.status(404).send('No order found for this ID');
        }

        // Process orders to transform img_url fields
        const ordersData = ordersBilling.toObject();
        ordersData.order.orderProducts = ordersData.order.orderProducts.map(orderProduct => {
            orderProduct.Product.img_urls = orderProduct.Product.img_url ? orderProduct.Product.img_url.split(',') : [];
            return orderProduct;
        });

        // Return processed order data
        return res.status(200).json(ordersData);
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).send('Error retrieving orders');
    }
});
module.exports = router;