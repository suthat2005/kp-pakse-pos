# Step 1: Base image
FROM node:20-alpine

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the codebase
COPY . .

# Step 5: Build the Vite production bundle
RUN npm run build

# Step 6: Expose port 5173
EXPOSE 5173

# Step 7: Define startup command
CMD ["node", "server.js"]
