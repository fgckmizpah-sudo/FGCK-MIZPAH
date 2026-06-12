let io = null;

function setIo(server, opts = {}) {
  try {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: opts.origin || '*'
      }
    });
    io.on('connection', (socket) => {
      // simple heartbeat
      socket.on('ping', () => socket.emit('pong'));
    });
    console.log('Realtime socket.io initialized');
  } catch (e) {
    console.warn('socket.io not available', e.message);
  }
}

function getIo() {
  return io;
}

module.exports = { setIo, getIo };
