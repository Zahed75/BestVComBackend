const app = require('./app');
const server = require('http').createServer(app);
const socket = require('socket.io');
const PORT = process.env.PORT || 8080;

// const client = io('http://localhost:8080');
const socketServer = socket(server, { cors: { origin: '*' } });

server.listen(PORT, function () {
  console.log('Server running on port => ' + PORT);

});