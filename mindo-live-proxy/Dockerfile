FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose the correct port (Cloud Run defaults to 8080)
EXPOSE 8080

# Command to run the proxy server
CMD ["node", "server.js"]
