const mongoose = require("mongoose");
const { Schema } = mongoose;
const productSchema = new Schema(
  {
    name: {
      en: {
        type: String,
        required: true,
      },
      ar: {
        type: String,
        required: true,
      },
    },
    description: {
      en: {
        type: String,
        required: true,
      },
      ar: {
        type: String,
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    img_url: {
      type: String,
      required: true,
    },
    category: {
      en: {
        type: String,
        enum: [
          "Electronics",
          "Mobiles",
          "Clothes",
          "Books",
          "Home",
          "Grocery",
          "Health",
        ],
        required: true,
      },
      ar: {
        type: String,
        enum: ["إلكترونيات", "هواتف", "ملابس", "كتب", "منزل", "بقالة", "صحة"],
        required: true,
      },
    },
    show: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: false,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
