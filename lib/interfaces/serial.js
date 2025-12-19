const { SerialPort } = require('serialport');
const Interface = require('./interface');

class Serial extends Interface {
  constructor (path, options) {
    super();
    options = options || {};

    this.debug = options.debug || false;
    this.timeout = options.timeout || 3000;

    this.path = path; // COM4
    this.baudRate = options.baudRate || 9600;
    this.dataBits = options.dataBits || 8;
    this.stopBits = options.stopBits || 1;
    this.parity = options.parity || 'none';
  }

  async isPrinterConnected () {
    return new Promise((resolve) => {
      const port = new SerialPort({
        path: this.path,
        baudRate: this.baudRate,
        autoOpen: false,
      });

      port.open((err) => {
        if (err) {
          if (this.debug) console.error('Serial open error:', err.message);
          resolve(false);
          return;
        }

        port.close(() => resolve(true));
      });
    });
  }

  async execute (buffer, options = { waitForResponse: false }) {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({
        path: this.path,
        baudRate: this.baudRate,
        dataBits: this.dataBits,
        stopBits: this.stopBits,
        parity: this.parity,
        autoOpen: false,
      });

      const timeoutHandler = setTimeout(() => {
        reject(new Error('Serial timeout'));
        port.close();
      }, this.timeout);

      port.open((err) => {
        if (err) {
          clearTimeout(timeoutHandler);
          return reject(err);
        }

        port.write(buffer, (err) => {
          if (err) {
            clearTimeout(timeoutHandler);
            port.close();
            return reject(err);
          }

          if (this.debug) {
            console.log(`Data sent to serial printer: ${this.path}`, buffer);
          }

          if (!options.waitForResponse) {
            clearTimeout(timeoutHandler);
            port.close();
            resolve();
          }
        });
      });

      port.on('data', (data) => {
        if (options.waitForResponse) {
          clearTimeout(timeoutHandler);
          if (this.debug) console.log('Received serial data:', data.toString('hex'));
          resolve(data);
          port.close();
        }
      });

      port.on('error', (error) => {
        clearTimeout(timeoutHandler);
        reject(error);
        port.close();
      });
    });
  }
}

module.exports = Serial;
