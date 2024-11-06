# Use Node.js LTS version for better stability
FROM node:lts 

# Set the working directory in the container
WORKDIR /app 

# Copy only the package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application files
COPY . .

# Compile TypeScript files
RUN npx tsc

# Expose port 3000
EXPOSE 3000

# Start the application using ts-node-dev
CMD ["npx", "ts-node-dev", "src/index.ts"]
