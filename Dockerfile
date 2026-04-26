# Use Node.js LTS version as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose the port for the backend
EXPOSE 5000

# Start the backend server
CMD ["node", "backend/server.js"]