const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const { schemas, SchemaValidator } = require('@0xproject/json-schemas')

const db = require('./db')
const { scan } = require('./scan')

const withPayload = (schema, func) => {
  return (req, res) => {
    const payload = req.body
    const schemaValidator = new SchemaValidator()
    const valid = schemaValidator.validate(payload, schema)
    console.log(valid)
    if (valid) {
      func(req, res)
    } else {
      res.status(100)
      res.json({
        code: 100,
        reason: 'Schema validation failed',
        validationErrors: []
      })
    }
  }
}

const paged = (func) => {
  return (req, res) => {
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 1
    const perPage = Math.min(req.query.per_page !== undefined ? parseInt(req.query.per_page) : 20, 100)
    const limit = perPage
    const offset = perPage * (page - 1)
    func(limit, offset, req, res)
  }
}

const go = (config) => {
  const { sequelize, Op, Order, orderToJSON, orderFromJSON } = db(config.sequelize)

  const app = express()
  app.use(bodyParser.json())
  if (config.production) {
    app.use(helmet())
  }

  const router = express.Router()

  router.get('/token_pairs', (req, res) => {
    res.status(501)
    res.json({
      code: 501,
      reason: 'Endpoint not supported, all token pairs will be accepted'
    })
  })

  router.get('/orders', paged((limit, offset, req, res) => {
    var query = {limit, offset, where: {}}
    if (req.query.makerTokenAddress) {
      query.where.makerTokenAddress = req.query.makerTokenAddress
    }
    if (req.query.takerTokenAddress) {
      query.where.takerTokenAddress = req.query.takerTokenAddress
    }
    if (req.query.makerTokenAddress && req.query.takerTokenAddress) {
      query.order = sequelize.literal('(takerTokenAmount / makerTokenAmount) ASC (makerFee + takerFee) ASC expirationUnixTimestampSec ASC')
    }
    if (req.query.tokenAddress) {
      query.where[Op.or] = [{makerTokenAddress: req.query.tokenAddress, takerTokenAddress: req.query.tokenAddress}]
    }
    if (req.query.maker) {
      query.where.maker = req.query.maker
    }
    if (req.query.taker) {
      query.where.taker = req.query.taker
    }
    if (req.query.trader) {
      query.where[Op.or] = [{maker: req.query.trader, taker: req.query.trader}]
    }
    if (req.query.feeRecipient) {
      query.where.feeRecipient = req.query.feeRecipient
    }
    Order.findAll(query).then(orders => {
      res.json(orders.map(orderToJSON))
    })
  }))

  router.get('/order/:hash', (req, res) => {
    Order.findOne({where: {hash: req.params.hash}}).then(order => {
      res.json(orderToJSON(order))
    }).catch(() => {
      res.status(404)
    })
  })

  router.get('/orderbook', paged((limit, offset, req, res) => {
    const baseTokenAddress = req.query.baseTokenAddress
    const quoteTokenAddress = req.query.quoteTokenAddress
    const bidQuery = {
      where: {makerTokenAddress: baseTokenAddress, takerTokenAddress: quoteTokenAddress},
      order: sequelize.literal('(takerTokenAmount / makerTokenAmount) DESC (makerFee + takerFee) ASC expirationUnixTimestampSec ASC'),
      limit,
      offset
    }
    const askQuery = {
      where: {makerTokenAddress: quoteTokenAddress, takerTokenAddress: baseTokenAddress},
      order: sequelize.literal('(takerTokenAmount / makerTokenAmount) ASC (makerFee + takerFee) ASC expirationUnixTimestampSec ASC'),
      limit,
      offset
    }
    Order.findAll(bidQuery).then(bids => {
      Order.findAll(askQuery).then(asks => {
        bids = bids.map(orderToJSON)
        asks = asks.map(orderToJSON)
        res.json({bids, asks})
      })
    })
  }))

  router.post('/order', withPayload(schemas.signedOrderSchema, (req, res) => {
    Order.create(orderFromJSON(req.body)).then(() => {
      res.status(201)
    })
  }))

  router.post('/fees', withPayload(schemas.relayerApiFeesPayloadSchema, (req, res) => {
    res.json({
      feeRecipient: config.feeRecipient,
      makerFee: config.calculateMakerFee(req.body),
      takerFee: config.calculateTakerFee(req.body)
    })
  }))

  app.use('v0', router)

  sequelize
    .sync()
    .then(() => {
      scan({ sequelize, Order }, config)
      app.listen(config.port, () => {
        config.log('info', 'Server listening on port ' + config.port)
      })
    })
}

module.exports = {
  go: go
}
