const supportedLanguages = ["en", "ar"];

module.exports = (req, res, next) => {
  const langHeader = req.headers["accept-language"];
  let lang = "en";

  if (langHeader) {
    const requestedLang = langHeader.split(",")[0].split("-")[0];
    if (supportedLanguages.includes(requestedLang)) {
      lang = requestedLang;
    }
  }

  req.lang = lang;
  next();
};
