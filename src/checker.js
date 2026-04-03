const net = require('net');

function checkIP(ip, port = 80, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: ip, port });

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ alive: true, reason: 'connected' });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ alive: false, reason: 'timeout' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ alive: false, reason: err.code || err.message });
    });
  });
}

module.exports = { checkIP };
