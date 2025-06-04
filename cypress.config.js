const { defineConfig } = require("cypress");
require("dotenv").config();
const installLogsPrinter = require("cypress-terminal-report/src/installLogsPrinter");

module.exports = defineConfig({
    reporter: "spec", // Ensures logs go to console
    e2e: {
        supportFile: "cypress/support/e2e.js",

        setupNodeEvents(on, config) {
            // Terminal reporter logs
            installLogsPrinter(on, {
                compactLogs: 1,
                printLogsToConsole: "always",
            });

            // Expose env vars from .env
            config.env = {
                ...config.env,
                WEB_USERNAME: process.env.WEB_USERNAME,
                WEB_PASSWORD: process.env.WEB_PASSWORD,
                LOCATION: process.env.LOCATION,
                DAY: process.env.DAY,
                HOUR: process.env.HOUR,
                COURT: process.env.COURT,
                PAY_METHOD: process.env.PAY_METHOD,
                PHONE: process.env.PHONE,
            };

            // Prevent Vulkan/Chrome GPU warnings
            on("before:browser:launch", (browser = {}, launchOptions) => {
                if (browser.name === "chrome" && browser.isHeadless) {
                    launchOptions.args.push("--disable-gpu");
                    launchOptions.args.push("--disable-software-rasterizer");
                    launchOptions.args.push("--disable-dev-shm-usage");
                    launchOptions.args.push("--disable-background-networking");
                    launchOptions.args.push("--disable-extensions");
                    launchOptions.args.push("--no-sandbox");
                }
                return launchOptions;
            });

            // Enable cy.task("log", ...)
            on("task", {
                log(message) {
                    console.log(message);
                    return null;
                },
            });

            return config;
        },
    },
});
