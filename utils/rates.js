const logger = require("../services/logger");

// @desc    Convert an amount from one currency to another
// @param   {number} amount - The amount to convert
// @param   {string} base - The base currency to convert from
// @param   {string} target - The target currency to convert to
// @returns {number, number} {amount, rate} - The converted amount and the rate of exchange
const currencyConverter = async (amount, base, target) => {
  const getRate = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`;

  try {
    const response = await fetch(getRate); // Fetch data from the API

    if (!response.ok) {
      logger.error(`Error fetching data: ${response.status}`);
      throw new Error(`Error fetching data: ${response.status}`);
    }

    const data = await response.json(); // Parse response as JSON
    let exchangeRate = data[base.toLowerCase()]?.[target.toLowerCase()]; // Access the nested exchange rate

    if (base === target) exchangeRate = 1; // If base and target are the same, set rate to 1

    if (!exchangeRate) {
      logger.error(`Invalid exchange rate for ${base} to ${target}`);
      throw new Error(`Invalid exchange rate for ${base} to ${target}`);
    }

    const convertedAmount = amount * exchangeRate; // Perform conversion
    logger.info(
      `Converted ${amount} ${base} to ${convertedAmount.toFixed(2)} ${target}`
    );

    return { amount: convertedAmount, rate: exchangeRate };
  } catch (error) {
    logger.error("Error during conversion:", error);
    throw error; // Rethrow error to propagate it
  }
};

module.exports = { currencyConverter };
