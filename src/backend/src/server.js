require('dotenv').config();

const http = require('http');
const app = require('./app');
const { setupWebSocketServer } = require('./realtime/websocket.server');

const port = process.env.PORT || 4000;
const server = http.createServer(app);

setupWebSocketServer(server);

server.listen(port, () => {
  console.log(`Smart Edu Platform API is running on port ${port}`);
});
