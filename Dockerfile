FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g typeorm

EXPOSE 3000

CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]
