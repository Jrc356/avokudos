FROM node:19-alpine3.16
COPY . .
RUN npm ci
CMD ["npm", "start"]