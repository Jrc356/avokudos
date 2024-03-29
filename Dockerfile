FROM node:19.9.0-alpine3.16
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci --omit=dev
COPY index.js /app/
COPY lib /app/lib
CMD ["npm", "start"]