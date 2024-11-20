# Use Node.js 18 as the base image
FROM node:18

# Install system dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxkbcommon0 \
    libgbm-dev \
    libasound2 \
    fonts-liberation \
    lsb-release \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the app source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Define Puppeteer's executable path for production environments
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the application
CMD ["npm", "start"]
