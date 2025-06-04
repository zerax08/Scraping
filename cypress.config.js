// cypress.config.js
const { defineConfig } = require("cypress");
require("dotenv").config(); // loads .env file
const installLogsPrinter = require("cypress-terminal-report/src/installLogsPrinter");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            installLogsPrinter(on, {
                compactLogs: 1, // Print compact logs
                printLogsToConsole: "always", // Print for all tests
            });
            config.env.WEB_USERNAME = process.env.WEB_USERNAME;
            config.env.WEB_PASSWORD = process.env.WEB_PASSWORD;
            config.env.LOCATION = process.env.LOCATION;
            config.env.DAY = process.env.DAY;
            config.env.HOUR = process.env.HOUR;
            config.env.COURT = process.env.COURT;
            config.env.PAY_METHOD = process.env.PAY_METHOD;
            config.env.PHONE = process.env.PHONE;
            return config;
        },
    },
});
