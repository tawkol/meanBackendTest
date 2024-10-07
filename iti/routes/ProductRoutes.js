// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Import Models
const Product = require("../models/ProductsModelDB");
const Feedback = require("../models/FeedbackModelDB");
const User = require("../models/UserModelDB");

// Import Middleware
const upload = require("../middleware/upload");
const auth = require("../middleware/AuthMWPermission");
const languageMiddleware = require("../middleware/LanguageMW");


// Import Utility Function
const { localizeData } = require("../util/localize");

// Apply Language Middleware to All Routes in this Router
router.use(languageMiddleware);

// Utility Function to Transform Product Data
const transformProductData = (product, lang) => {
  const productData = product.toObject();

  // Localize name, description, and category
  const localizedFields = ["name", "description", "category"];
  const localizedData = localizeData(productData, lang, localizedFields);

  // Replace localized fields in productData
  localizedFields.forEach((field) => {
    productData[field] = localizedData[field];
  });

  // Transform img_url from a comma-separated string to an array
  productData.img_urls = productData.img_url
    ? productData.img_url.split(",")
    : [];

  // Optionally remove the original img_url field
  delete productData.img_url;

  return productData;
};

/**
 * @swagger
 * /api/product/categories:
 *   get:
 *     summary: Retrieve all product categories
 *     description: Retrieves a list of distinct product categories along with the count of products in each category.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of product categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   count:
 *                     type: integer
 *                 example:
 *                   - category: "Electronics"
 *                     count: 15
 *                   - category: "Books"
 *                     count: 10
 *       400:
 *         description: Error retrieving categories
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error retrieving categories"
 */
router.get("/categories", async (req, res) => {
  try {
    const lang = req.lang;

    // Aggregation to group products by category and count them
    const categories = await Product.aggregate([
      {
        $group: {
          _id: `$category.${lang}`, // Group by the localized category field
          count: { $sum: 1 }, // Count the number of products per category
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      {
        $sort: { count: -1 }, // Optional: Sort categories by count descending
      },
    ]);

    res.status(200).json(categories);
  } catch (err) {
    console.error("Error retrieving categories:", err);
    res.status(400).send("Error retrieving categories");
  }
});

// getProductByCategory
/**
 * @swagger
 * /api/product/category/{category}:
 *   get:
 *     summary: Retrieve products by category
 *     description: Retrieves a list of products that belong to the specified category. Transforms `img_url` into an array of image URLs.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         description: The category of products to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Sample Product"
 *                   category:
 *                     type: string
 *                     example: "Electronics"
 *                   price:
 *                     type: number
 *                     format: float
 *                     example: 99.99
 *                   img_urls:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["image1.jpg", "image2.jpg"]
 *                   description:
 *                     type: string
 *                     example: "A detailed description of the product."
 *               example:
 *                 - id: 1
 *                   name: "Sample Product"
 *                   category: "Electronics"
 *                   price: 99.99
 *                   img_urls: ["image1.jpg", "image2.jpg"]
 *                   description: "A detailed description of the product."
 *       400:
 *         description: Error retrieving products
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error retrieving product"
 */
router.get("/category/:category", async (req, res) => {
  try {
    const lang = req.lang;
    const requestedCategory = req.params.category;

    // Find the category in the specified language
    const categoryFilter = {};
    categoryFilter[`category.${lang}`] = requestedCategory;

    // Find products matching the localized category
    const products = await Product.find({ ...categoryFilter });

    if (!products.length) {
      return res.status(404).send("No products found in this category.");
    }

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json(transformedProducts);
  } catch (err) {
    console.error("Error retrieving products by category:", err);
    res.status(400).send("Error retrieving products");
  }
});

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Retrieve all products
 *     description: Retrieves a list of all products. Transforms `img_url` into an array of image URLs.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Sample Product"
 *                   category:
 *                     type: string
 *                     example: "Electronics"
 *                   price:
 *                     type: number
 *                     format: float
 *                     example: 99.99
 *                   img_urls:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["image1.jpg", "image2.jpg"]
 *                   description:
 *                     type: string
 *                     example: "A detailed description of the product."
 *               example:
 *                 - id: 1
 *                   name: "Sample Product"
 *                   category: "Electronics"
 *                   price: 99.99
 *                   img_urls: ["image1.jpg", "image2.jpg"]
 *                   description: "A detailed description of the product."
 *       400:
 *         description: Error retrieving products
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error retrieving products"
 */

router.get("/", async (req, res) => {
  try {
    const lang = req.lang;

    // Retrieve all products
    const products = await Product.find();

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json(transformedProducts);
  } catch (err) {
    console.error("Error retrieving products:", err);
    res.status(500).send("Error retrieving products");
  }
});

// to make product - only admin can add - MW
// auth
/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Add a new product
 *     description: Adds a new product to the database. Only admin users can add products. Requires file uploads for images.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Product"
 *               description:
 *                 type: string
 *                 example: "A detailed description of the new product."
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 49.99
 *               category:
 *                 type: string
 *                 example: "Books"
 *               prodimg:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An array of product image files
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product added successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Product added successfully"
 *       400:
 *         description: Product addition failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Product addition failed. Please check the request data."
 *       403:
 *         description: Unauthorized - Only admins can add products
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized - Only admins can add products"
 */
// router.post("/", upload.array("prodimg", 10), auth, async (req, res) => {
//   try {
//     const imgUrls = req.files.map(file => file.filename);
//     const prod = await Product.create({
//       name: req.body.name,
//       description: req.body.description,
//       price: req.body.price,
//       img_url: imgUrls.join(','), // Save as comma-separated string
//       // prodimg: req.body.path,
//       category: req.body.category,
//     });

//     res.status(200).send("Product added successfully");
//   } catch (err) {
//     console.error('Error:', err);  // Log the complete error for debugging
//     res.status(400).send("Product addition failed. Please check the request data.");
//   }
// });

/**to make product - anyone */
router.post("/", upload.array("prodimg", 10), async (req, res) => {
  try {
    // Extract image filenames from uploaded files
    const imgUrls = req.files.map((file) => file.filename);

    // Create a new product with localized fields
    const prod = new Product({
      name: { en: req.body.name_en, ar: req.body.name_ar }, // Expected to be an object with 'en' and 'ar' keys
      description: { en: req.body.description_en, ar: req.body.description_ar }, // Expected to be an object with 'en' and 'ar' keys
      price: Number(req.body.price), // Ensure price is a number
      img_url: imgUrls.join(","), // Store as comma-separated string
      category: { en: req.body.category_en, ar: req.body.category_ar }, // Expected to be an object with 'en' and 'ar' keys
      show:
        req.body.show !== undefined
          ? req.body.show === "true" || req.body.show === true
          : true, // Convert to boolean
    });

    // Save the new product to the database
    await prod.save();

    res.status(201).send("Product added successfully");
  } catch (err) {
    console.error("Error adding product:", err);
    res
      .status(500)
      .send("Product addition failed. Please check the request data.");
  }
});

// search = sort
/**
 * @swagger
 * /api/product/searchsort:
 *   get:
 *     summary: Search and sort products
 *     description: Searches for products based on a search query and sorts them according to the specified criteria. Supports optional category filtering.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query to filter products by name
 *         example: "laptop"
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum:
 *             - name_asc
 *             - name_desc
 *             - price_asc
 *             - price_desc
 *         description: Sorting criteria for the product list
 *         example: "price_desc"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *         example: "Electronics"
 *     responses:
 *       200:
 *         description: List of products that match the search query and sorting criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Sample Product"
 *                   category:
 *                     type: string
 *                     example: "Electronics"
 *                   price:
 *                     type: number
 *                     format: float
 *                     example: 99.99
 *                   img_urls:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["image1.jpg", "image2.jpg"]
 *                   description:
 *                     type: string
 *                     example: "A detailed description of the product."
 *               example:
 *                 - id: 1
 *                   name: "Sample Product"
 *                   category: "Electronics"
 *                   price: 99.99
 *                   img_urls: ["image1.jpg", "image2.jpg"]
 *                   description: "A detailed description of the product."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
router.get("/searchsort", async (req, res) => {
  const { search = "", sort_by = "", category = "" } = req.query;
  const lang = req.lang;

  // Determine sort order based on sort_by parameter
  let sort = {};
  if (sort_by === "name_asc") sort[`name.${lang}`] = 1;
  if (sort_by === "name_desc") sort[`name.${lang}`] = -1;
  if (sort_by === "price_asc") sort["price"] = 1;
  if (sort_by === "price_desc") sort["price"] = -1;

  try {
    // Build search and filter criteria
    const filter = {
      [`name.${lang}`]: { $regex: search, $options: "i" }, // Case-insensitive search
    };

    if (category) {
      filter[`category.${lang}`] = category;
    }

    // Find products matching the criteria and apply sorting
    const products = await Product.find(filter).sort(sort);

    if (!products.length) {
      return res.status(404).send("No products match the search criteria.");
    }

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error("Error in searchsort route:", error);
    res.status(500).json({ error: "Error retrieving products." });
  }
});

//feedback
/**
 * @swagger
 * /api/product/feedback:
 *   post:
 *     summary: Submit feedback for a product
 *     description: Allows an authenticated user to submit feedback and a rating for a specific product. Requires authentication via a JWT token.
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID of the product being reviewed
 *                 example: 1
 *               feedback:
 *                 type: string
 *                 description: The feedback text for the product
 *                 example: "Great product, highly recommend!"
 *               rate:
 *                 type: integer
 *                 description: Rating given to the product (1 to 5)
 *                 example: 4
 *             required:
 *               - productId
 *               - feedback
 *               - rate
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "feedback on product added successfully"
 *       400:
 *         description: Error adding feedback
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "feedback on product NOT added"
 *       401:
 *         description: Unauthorized - Access denied or invalid token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized - Access Denied"
 */
router.post("/feedback", async (req, res) => {
  const token = req.header("x-auth-token");

  if (!token) return res.status(401).send("Access Denied. No token provided.");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userid = decodedPayload.userid;

    const { productId, feedback, rate } = req.body;
    if (!productId || !feedback || !rate) {
      return res
        .status(400)
        .send("Missing required fields: productId, feedback, or rate.");
    }

    // Create feedback using Mongoose
    const newFeedback = new Feedback({
      userId: new mongoose.Types.ObjectId(userid), // Correctly instantiate ObjectId
      productId: new mongoose.Types.ObjectId(productId), // Correctly instantiate ObjectId
      feedback,
      rate,
    });

    await newFeedback.save();

    return res.status(200).send("Feedback on product added successfully.");
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(400).send("Failed to add feedback on product.");
  }
});

/**
 * @swagger
 * /api/product/feedbacks/{productId}:
 *   get:
 *     summary: Retrieve all feedbacks for a specific product
 *     description: Fetches all feedbacks and associated user names for a given product ID.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID of the product to retrieve feedbacks for
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of feedbacks for the specified product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Feedback ID
 *                     example: 1
 *                   feedback:
 *                     type: string
 *                     description: The feedback text
 *                     example: "Great product, will buy again!"
 *                   rate:
 *                     type: integer
 *                     description: Rating given (1 to 5)
 *                     example: 5
 *                   User:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Name of the user who provided the feedback
 *                         example: "John Doe"
 *               example:
 *                 - id: 1
 *                   feedback: "Great product, will buy again!"
 *                   rate: 5
 *                   User:
 *                     name: "John Doe"
 *       500:
 *         description: Error retrieving feedbacks
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error fetching feedbacks"
 */
router.get("/feedbacks/:productId", async (req, res) => {
  const { productId } = req.params;
  console.log("Received productId:", productId); // Log the received productId

  // Check if the productId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).send("Invalid productId format.");
  }

  try {
    const feedbacks = await Feedback.find({
      productId: new mongoose.Types.ObjectId(productId), // Use the valid ObjectId
    })
      .populate("userId", "name") // Ensure correct field for user
      .sort({ createdAt: -1 }); // Sort by creation date

    if (feedbacks.length === 0) {
      return res.status(404).send("No feedback found for this product.");
    }

    return res.status(200).json(feedbacks);
  } catch (err) {
    console.error("Error fetching feedbacks:", err.message);
    res.status(500).send("Error fetching feedbacks.");
  }
});

// // updateProductByID
// router.put("/:id", auth, ProductsController.updateProductByID);

// // deleteProductByID
// router.delete("/:id", auth, ProductsController.deleteProductByID);

// getProductByID
/**
 * @swagger
 * /api/product/prod/{id}:
 *   get:
 *     summary: Retrieve a product by ID
 *     description: Retrieves a product based on its ID. Transforms `img_url` into an array of image URLs.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product to retrieve
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Sample Product"
 *                 category:
 *                   type: string
 *                   example: "Electronics"
 *                 price:
 *                   type: number
 *                   format: float
 *                   example: 99.99
 *                 img_urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["image1.jpg", "image2.jpg"]
 *                 description:
 *                   type: string
 *                   example: "A detailed description of the product."
 *               example:
 *                 id: 1
 *                 name: "Sample Product"
 *                 category: "Electronics"
 *                 price: 99.99
 *                 img_urls: ["image1.jpg", "image2.jpg"]
 *                 description: "A detailed description of the product."
 *       404:
 *         description: Product not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Product with this id not found"
 *       400:
 *         description: Error retrieving product
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error retrieving product"
 */

router.get("/:id", async (req, res) => {
  try {
    const lang = req.lang;
    const productId = req.params.id;

    // Find product by ID
    const product = await Product.findById(productId);

    // Check if product exists
    if (!product) {
      return res.status(404).send("Product with this ID not found.");
    }

    // Transform product data to include localized fields and img_urls array
    const transformedProduct = transformProductData(product, lang);

    res.status(200).json(transformedProduct);
  } catch (err) {
    console.error("Error retrieving product:", err);
    res.status(500).send("Error retrieving product.");
  }
});

module.exports = router;