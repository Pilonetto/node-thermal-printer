function getInterface (uri, options, driver) {
  const networkRegex = /^tcp:\/\/([^/:]+)(?::(\d+))?\/?$/i;
  const printerRegex = /^printer:([^/]+)(?:\/([\w-]*))?$/i;
  const serialRegex = /^COM\d+$/i; //

  const net = networkRegex.exec(uri);
  const printer = printerRegex.exec(uri);
  const serial = typeof uri === 'string' && serialRegex.test(uri);

  if (typeof uri === 'object') {
    return uri;
  }

  if (net) {
    const Network = require('./network');
    return new Network(net[1], net[2], options);
  }

  if (printer) {
    const Printer = require('./printer');
    return new Printer(printer[1], driver);
  }

  if (serial) {
    const Serial = require('./serial');
    return new Serial(uri, options);
  }

  const File = require('./file');
  return new File(uri);
}

module.exports = getInterface;


module.exports = getInterface;
