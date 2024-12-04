// utils/localize.js
const localizeData = (data, lang, fields) => {
  const localizedData = {};

  fields.forEach((field) => {
    if (data[field] && data[field][lang]) {
      localizedData[field] = data[field][lang];
    } else if (data[field] && data[field]["en"]) {
      // Fallback to English if the requested language is unavailable
      localizedData[field] = data[field]["en"];
    } else {
      localizedData[field] = null;
    }
  });

  return localizedData;
};

const transformProductData = (product, lang) => {
  const productData =
    typeof product.toObject === "function" ? product.toObject() : product;

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

module.exports = { transformProductData };
