FROM node:12-alpine as base

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json* .

RUN npm ci
COPY . .

# ---

FROM base as build

WORKDIR /usr/src/app

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]