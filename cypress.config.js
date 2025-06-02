// cypress.config.js
const { defineConfig } = require("cypress");
require("dotenv").config(); // loads .env file

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // Inject env vars
            config.env.WEB_USERNAME = process.env.WEB_USERNAME;
            config.env.WEB_PASSWORD = process.env.WEB_PASSWORD;
            config.env.LOCATION = process.env.LOCATION;
            config.env.DAY = process.env.DAY;
            config.env.HOUR = process.env.HOUR;
            config.env.COURT = process.env.COURT;
            config.env.PAY_METHOD = process.env.PAY_METHOD;
            return config;
        },
    },
});
