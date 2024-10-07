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

module.exports = { localizeData };
