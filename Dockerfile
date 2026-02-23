# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy backend package.json and package-lock.json (if available)
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy the backend source code
COPY backend/ ./

# Create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S lenslink -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R lenslink:nodejs /app
USER lenslink

# Expose the port that the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "server.js"]
