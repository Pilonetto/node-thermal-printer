const { SerialPort } = require('serialport');
const Interface = require('./interface');

class Serial extends Interface {
  constructor (path, options = {}) {
    super();

    this.debug = options.debug || false;
    this.timeout = options.timeout || 3000;

    this.path = path;

    this.baudRate = options.baudRate || 115200;
    this.dataBits = options.dataBits || 8;
    this.stopBits = options.stopBits || 1;
    this.parity = options.parity || 'none';

    this.port = null;
    this.isOpening = false;
  }

  async getPort () {
    if (this.port && this.port.isOpen) {
      return this.port;
    }

    if (this.isOpening) {
      await new Promise(r => setTimeout(r, 50));
      return this.getPort();
    }

    this.isOpening = true;

    this.port = new SerialPort({
      path: this.path,
      baudRate: this.baudRate,
      dataBits: this.dataBits,
      stopBits: this.stopBits,
      parity: this.parity,
      autoOpen: false,
    });

    return new Promise((resolve, reject) => {
      this.port.open(err => {
        this.isOpening = false;

        if (err) {
          this.port = null;
          return reject(err);
        }

        if (this.debug) {
          console.log(`[Serial] Port opened: ${this.path}`);
        }

        resolve(this.port);
      });
    });
  }

  async isPrinterConnected () {
    try {
      const port = await this.getPort();
      return !!port?.isOpen;
    } catch {
      return false;
    }
  }

  async execute (buffer, options = { waitForResponse: false }) {
    const port = await this.getPort();

    return new Promise((resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        reject(new Error('Serial timeout'));
      }, this.timeout);

      port.write(buffer, err => {
        if (err) {
          clearTimeout(timeoutHandler);
          return reject(err);
        }

        if (this.debug) {
          console.log(`[Serial] Data sent (${buffer.length} bytes)`);
        }

        if (!options.waitForResponse) {
          clearTimeout(timeoutHandler);
          return resolve();
        }
      });

      port.once('data', data => {
        if (options.waitForResponse) {
          clearTimeout(timeoutHandler);
          resolve(data);
        }
      });

      port.once('error', err => {
        clearTimeout(timeoutHandler);
        reject(err);
      });
    });
  }

  async close () {
    if (this.port && this.port.isOpen) {
      await new Promise(r => this.port.close(r));
      this.port = null;
    }
  }
}

module.exports = Serial;
