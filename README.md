## 0x Orderbook Server

[![https://badges.frapsoft.com/os/mit/mit.svg?v=102](https://badges.frapsoft.com/os/mit/mit.svg?v=102)](https://opensource.org/licenses/MIT)

### Synopsis

Open-source 0x orderbook server, written for ForkDelta.

Three-tier: [Varnish](https://varnish-cache.org/) in front (not yet implemented), Node HTTP server, PostgreSQL backing datastore.

### Operation

Copy [config.example.js](config/config.example.js) to `config/config.js`, edit to suit your requirements, then simply run:

```bash
node index.js
```

### Development Information

#### Setup

[Node >= v6.9.1](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/en/) required.

Before any development, install the required NPM dependencies:

```bash
yarn
```

#### Contributing

Contributions welcome! Please use GitHub issues for suggestions/concerns - if you prefer to express your intentions in code, feel free to submit a pull request.
