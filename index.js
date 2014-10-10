module.exports = require('./lib/PM2Wrapper.js');

// backward compatibility
module.exports.__proto__ = require('./lib/CLI.js');
