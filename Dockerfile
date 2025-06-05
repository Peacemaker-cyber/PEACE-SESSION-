# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy all remaining files
COPY . .

# Expose port and start the server
EXPOSE 3000
CMD ["npm", "start"]
