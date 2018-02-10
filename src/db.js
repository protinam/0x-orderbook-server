const Sequelize = require('sequelize')
const { ZeroEx } = require('0x.js')

module.exports = (config) => {
  const sequelize = new Sequelize(config.database, config.username, config.password, config)

  sequelize.query('CREATE OR REPLACE FUNCTION add(text, text) RETURNS integer AS \'select ($1::integer) + ($2::integer);\' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT')
  sequelize.query('CREATE OR REPLACE FUNCTION sub(text, text) RETURNS integer AS \'select ($1::integer) - ($2::integer);\' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT')
  sequelize.query('CREATE OR REPLACE FUNCTION div(text, text) RETURNS integer AS \'select ($1::integer) / ($2::integer);\' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT')
  sequelize.query('CREATE OR REPLACE FUNCTION mul(text, text) RETURNS integer AS \'select ($1::integer) * ($2::integer);\' LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT')

  const Order = sequelize.define('order', {
    hash: {type: Sequelize.TEXT, allowNull: false, primaryKey: true},
    exchangeContractAddress: {type: Sequelize.TEXT, allowNull: false},
    maker: {type: Sequelize.TEXT, allowNull: false},
    taker: {type: Sequelize.TEXT, allowNull: false},
    makerTokenAddress: {type: Sequelize.TEXT, allowNull: false},
    takerTokenAddress: {type: Sequelize.TEXT, allowNull: false},
    feeRecipient: {type: Sequelize.TEXT, allowNull: false},
    makerTokenAmount: {type: Sequelize.TEXT, allowNull: false},
    takerTokenAmount: {type: Sequelize.TEXT, allowNull: false},
    makerFee: {type: Sequelize.TEXT, allowNull: false},
    takerFee: {type: Sequelize.TEXT, allowNull: false},
    expirationUnixTimestampSec: {type: Sequelize.TEXT, allowNull: false},
    salt: {type: Sequelize.TEXT, allowNull: false},
    v: {type: Sequelize.TEXT, allowNull: false},
    r: {type: Sequelize.TEXT, allowNull: false},
    s: {type: Sequelize.TEXT, allowNull: false}
  })

  const orderFromJSON = (order) => {
    const hash = ZeroEx.getOrderHashHex(order)
    return {
      hash: hash,
      exchangeContractAddress: order.exchangeContractAddress,
      maker: order.maker,
      taker: order.taker,
      makerTokenAddress: order.makerTokenAddress,
      takerTokenAddress: order.takerTokenAddress,
      feeRecipient: order.feeRecipient,
      makerTokenAmount: order.makerTokenAmount,
      takerTokenAmount: order.takerTokenAmount,
      makerFee: order.makerFee,
      takerFee: order.takerFee,
      expirationUnixTimestampSec: order.expirationUnixTimestampSec,
      salt: order.salt,
      v: order.ecSignature.v,
      r: order.ecSignature.r,
      s: order.ecSignature.s
    }
  }

  const orderToJSON = (order) => ({
    exchangeContractAddress: order.exchangeContractAddress,
    maker: order.maker,
    taker: order.taker,
    makerTokenAddress: order.makerTokenAddress,
    takerTokenAddress: order.takerTokenAddress,
    feeRecipient: order.feeRecipient,
    makerTokenAmount: order.makerTokenAmount,
    takerTokenAmount: order.takerTokenAmount,
    makerFee: order.makerFee,
    takerFee: order.takerFee,
    expirationUnixTimestampSec: order.expirationUnixTimestampSec,
    salt: order.salt,
    ecSignature: {
      v: order.v,
      r: order.r,
      s: order.s
    }
  })

  return {
    sequelize,
    Op: Sequelize.Op,
    Order,
    orderFromJSON,
    orderToJSON
  }
}
