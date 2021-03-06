
//
// Modifying these values break tests
//

var p = require('path');

DEFAULT_FILE_PATH = p.resolve(process.env.HOME, '.pm2');

module.exports = {
  VERSION           : '1.0.3',
  DEFAULT_FILE_PATH : DEFAULT_FILE_PATH,
  PM2_LOG_FILE_PATH : p.join(p.resolve(process.env.HOME, '.pm2'), 'pm2.log'),
  DEFAULT_PID_PATH  : p.join(DEFAULT_FILE_PATH, 'pids'),
  DEFAULT_LOG_PATH  : p.join(DEFAULT_FILE_PATH, 'logs'),
  DUMP_FILE_PATH    : p.join(DEFAULT_FILE_PATH, 'dump.pm2'),
  DAEMON_BIND_ADDR  : 'localhost:66666',
  DEBUG             : false,
  WEB_INTERFACE     : 9615,
  MS_TO_STOP_SCRIPT : 1000
};
