const Blacklist = require("../models/Blacklist");
const { asyncWrapper } = require("../utils/async");

const blacklistToken = asyncWrapper(async (token) => {
  const newEntry = new Blacklist({ token });
  await newEntry.save();
  console.log("Token blacklisted successfully.");
});

// const isTokenBlacklisted = async (token) => {
//   try {
//     const tokenExists = await Blacklist.findOne({ token });
//     return !!tokenExists; // Returns true if the token exists in the blacklist
//   } catch (error) {
//     console.error("Error checking token blacklist:", error.message);
//     return false; // Assume token is not blacklisted if there's an error
//   }
// };

module.exports = { blacklistToken /*isTokenBlacklisted */ };
