const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");

const translate = new Translate({
  keyFilename: path.join(__dirname, "../config/awpa-dialogflow-key.json"),
});

/**
 * Detect language from user input
 * @param {string} text - User message
 */
const detectLanguage = async (text) => {
  try {
    const [detection] = await translate.detect(text);
    return detection.language;
  } catch (error) {
    console.error("Language Detection Error:", error);
    return "en"; // Default to English
  }
};

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'fr' for French)
 */
const translateText = async (text, targetLanguage) => {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error("Translation Error:", error);
    return text; // Return original text if translation fails
  }
};

module.exports = { detectLanguage, translateText };
