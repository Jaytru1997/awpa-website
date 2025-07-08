const session = require("express-session");
require("dotenv").config();
let MongoStore;
if (process.env.NODE_ENV === "production") {
  MongoStore = require("connect-mongo");
}

// Default session configuration
const defaultSessionConfig = {
  secret:
    process.env.SESSION_SECRET || "YHadz6yXTBqanjD$4rBm6q?zgmq5CaQ4MbAsN8qR", // Use env var in prod
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
};

// Session management middleware
function sessionManager(customConfig = {}) {
  // Merge default and custom session configurations
  const sessionConfig = { ...defaultSessionConfig, ...customConfig };

  // Use connect-mongo for production
  if (process.env.NODE_ENV === "production" && MongoStore) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7, // 7 days
      autoRemove: "native",
    });
  }

  // Initialize express-session
  const sessionMiddleware = session(sessionConfig);

  // Middleware to attach session manager utilities
  const managerMiddleware = (req, res, next) => {
    req.sessionManager = {
      // Initialize a state (e.g., cart, wishlist) if it doesn't exist
      initState: (stateName, defaultValue = []) => {
        if (!req.session[stateName]) {
          req.session[stateName] = defaultValue;
        }
        return req.session[stateName];
      },
      // Get a state
      getState: (stateName) => {
        return req.session[stateName] || null;
      },
      // Add an item to a state (e.g., add product to cart)
      addToState: (stateName, item, key = "id") => {
        if (!req.session[stateName]) {
          req.session[stateName] = [];
        }
        const existingItem = req.session[stateName].find(
          (i) => i[key] === item[key]
        );
        if (existingItem) {
          Object.assign(existingItem, item);
        } else {
          req.session[stateName].push(item);
        }
        return req.session[stateName];
      },
      // Remove an item from a state (e.g., remove product from cart)
      removeFromState: (stateName, itemId, key = "id") => {
        if (req.session[stateName]) {
          req.session[stateName] = req.session[stateName].filter(
            (i) => i[key] !== itemId
          );
        }
        return req.session[stateName];
      },
      // Update a state entirely
      updateState: (stateName, newState) => {
        req.session[stateName] = newState;
        return req.session[stateName];
      },
      // Clear a specific state
      clearState: (stateName) => {
        if (req.session[stateName]) {
          req.session[stateName] = [];
        }
        return req.session[stateName];
      },
      // Destroy the entire session
      destroySession: () => {
        return new Promise((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      },
    };
    next();
  };

  // Return both session middleware and manager middleware
  return [sessionMiddleware, managerMiddleware];
}

module.exports = sessionManager;

/* 
Session Middleware: The sessionManager middleware initializes express-session and adds a req.sessionManager object with methods to:
    initState: Create or access a state (e.g., cart).
    getState: Retrieve a state.
    addToState: Add or update an item in a state, using a key (e.g., id) to check for duplicates.
    removeFromState: Remove an item by its key.
    updateState: Replace the entire state.
    clearState: Empty a state.
    destroySession: Destroy the entire session.
*/
