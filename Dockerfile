FROM node:20-alpine

WORKDIR /app

# Only copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy rest of code and build
COPY . .
RUN npm run build

# Set production env
ENV NODE_ENV=production

# IMPORTANT: Do not hardcode PORT here. 
# Set it in the Railway Dashboard "Variables" tab instead.

# Use Shell form to ensure $PORT is picked up if used in scripts
CMD ["node", "dist/index.js"]
