FROM cypress/included:13.6.6

# Set working directory
WORKDIR /e2e

# Copy project files into container
COPY . .

# Install cypress-terminal-report for better logging
RUN npm install --save-dev cypress-terminal-report

# Optionally, make sure dependencies are installed (if you use package-lock.json)
RUN npm ci

# Default Cypress run with enhanced logging
CMD ["npx", "cypress", "--browser", "chrome", "run", "--spec", "cypress/e2e/reserva_padel.cy.js"]
