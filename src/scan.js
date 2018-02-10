const scan = ({ sequelize, Order }, config) => {
  const func = () => {
    const start = Date.now() / 1000
    Order.findAll().then(orders => {
      const end = Date.now() / 1000
      const diff = end - start
      config.log('debug', 'Scan complete in ' + Math.round(diff * 1000) / 1000 + 's')
    })
  }

  setInterval(func, config.scanInterval)
}

module.exports = {
  scan: scan
}
