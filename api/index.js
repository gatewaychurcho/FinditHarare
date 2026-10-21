const server = require('../server.js');

module.exports = (req, res) => {
  // Delegate HTTP request and response to server.js
  server.emit('request', req, res);
};
