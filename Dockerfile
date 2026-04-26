FROM node:20

WORKDIR /app

# Install frontend dependencies
COPY package*.json ./
RUN npm install

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy project files
COPY . .

# Build frontend
RUN npm run build

EXPOSE 5000

CMD ["node", "backend/server.js"]