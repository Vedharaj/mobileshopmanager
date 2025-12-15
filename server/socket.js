const { Server } = require('socket.io');

let io;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });
  io.on('connection', (socket) => {
    socket.on('join-shops', (shopIds = []) => {
      try {
        shopIds.forEach((id) => {
          if (id) socket.join(`shop:${id}`);
        });
      } catch {}
    });
  });
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { init, getIO };
