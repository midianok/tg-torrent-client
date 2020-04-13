FROM alpine/git as git
WORKDIR /app
RUN git clone https://github.com/midianok/tg-torrent-client.git

FROM node:latest as node
WORKDIR /app
COPY --from=git /app/tg-torrent-client .
RUN npm install

CMD ["node", "index.js"]