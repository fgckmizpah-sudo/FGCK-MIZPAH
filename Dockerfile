FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install --workspaces

COPY . .

RUN npm run build

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "--workspace", "server", "run", "start"]
