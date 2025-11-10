# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# This step is optimized to leverage Docker cache.
# If only dependencies change, this layer is rebuilt, not the whole app.
COPY package.json ./
COPY package-lock.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend. This typically outputs to a 'build' folder.
# Adjust this command if your frontend build script is different.
RUN npm run build:frontend

# Stage 2: Build the Node.js backend (compile TypeScript and install native module build tools)
FROM node:20-alpine as backend-builder

WORKDIR /app

# Install build dependencies for native modules like 'aerospike' on Alpine
# These are typically needed if pre-built binaries are not available for the specific Node/Alpine version
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation and native module build)
RUN npm install

# Copy backend source code and its tsconfig
COPY server ./server

# Compile the TypeScript backend
# This assumes server/tsconfig.json exists and outputs server.js to the server directory
RUN npx tsc --project server/tsconfig.json

# Stage 3: Final production image
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --only=production

# Copy the built frontend assets from the frontend-builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy the compiled backend JavaScript from the backend-builder stage
COPY --from=backend-builder /app/dist/server/server.js ./dist/server/server.js

# Expose the port the server listens on
EXPOSE 8080

# Command to run the application
# This assumes your package.json has a "docker:start" script like "node server/server.js"
CMD ["npm", "run", "docker:start"]
