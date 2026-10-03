FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY backend/ ./
COPY index.html /app/index.html
COPY docs/ /app/docs/
ENV NODE_ENV=production TZ=Asia/Kolkata PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
