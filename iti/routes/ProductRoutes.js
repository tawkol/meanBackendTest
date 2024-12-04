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
const { transformProductData } = require("../util/localize");

// Apply Language Middleware to All Routes in this Router
router.use(languageMiddleware);

router.get("/categories", async (req, res) => {
  try {
    // const lang = req.lang;

    // Aggregation to group products by category and count them
    const categories = await Product.aggregate([
      {
        $group: {
          _id: `$category`, // Group by the localized category field
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

router.get("/category/:category", async (req, res) => {
  try {
    const lang = req.lang;
    const requestedCategory = req.params.category;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10
    const skip = (page - 1) * limit; // Calculate how many items to skip

    // Find the category in the specified language
    const categoryFilter = {};
    categoryFilter[`category.en`] = requestedCategory;

    // Find products matching the localized category with pagination
    const products = await Product.find({ ...categoryFilter })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(categoryFilter); // Get total number of products
    const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages

    if (!products.length) {
      return res.status(404).send("No products found in this category.");
    }

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json({
      products: transformedProducts,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error retrieving products by category:", err);
    res.status(400).send("Error retrieving products");
  }
});

router.get("/", async (req, res) => {
  try {
    const lang = req.lang;

    // Extract pagination parameters from the query
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const skip = (page - 1) * limit;

    // Retrieve products with pagination
    const products = await Product.find().skip(skip).limit(limit);

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    // Get total count of products
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      products: transformedProducts,
    });
  } catch (err) {
    console.error("Error retrieving products:", err);
    res.status(500).send("Error retrieving products");
  }
});

router.get("/randomProducts", async (req, res) => {
  try {
    const lang = req.lang;

    // Retrieve 8 random products using MongoDB's $sample aggregation
    const products = await Product.aggregate([{ $sample: { size: 8 } }]);

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json(transformedProducts);
  } catch (err) {
    console.error("Error retrieving random products:", err);
    res.status(500).send("Error retrieving random products");
  }
});

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

router.get("/searchsort", async (req, res) => {
  const {
    search = "",
    sort_by = "",
    category = "",
    page = 1,
    limit = 10,
  } = req.query;
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

    // Convert page and limit to numbers and calculate skip
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find products matching the criteria and apply sorting
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    if (!products.length) {
      return res.status(404).send("No products match the search criteria.");
    }

    // Get the total number of products matching the filter (for pagination)
    const totalProducts = await Product.countDocuments(filter);

    // Transform products to include localized fields and img_urls array
    const transformedProducts = products.map((product) =>
      transformProductData(product, lang)
    );

    res.status(200).json({
      products: transformedProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
    });
  } catch (error) {
    console.error("Error in searchsort route:", error);
    res.status(500).json({ error: "Error retrieving products." });
  }
});

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

router.get("/feedbacks/:productId", async (req, res) => {
  const { productId } = req.params;

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
