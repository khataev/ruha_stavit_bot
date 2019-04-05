const requestGlobal = require('request');
const express = require('express');
const bodyParser = require('body-parser');

// local files
const constants = require('./modules/constants');
const logger = require('./modules/logger');
const settings = require('./modules/config');
const telegram = require('./modules/telegram');
const util = require('./modules/util');
const packageInfo = require('./package.json');

const telegramApi = new telegram(settings, logger, true);

function start_express_server() {
  if (settings.get('env') === 'production') {
    logger.warn('start_express_server');
    let app = express(),
      token = settings.get('credentials.telegram_bot.api_token');

    //Here we are configuring express to use body-parser as middle-ware.
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/', function (req, res) {
      res.json({ version: packageInfo.version });
    });

    logger.log(`token: ${token}`);
    app.post(`/${token}`, function (req, res) {
      logger.log(req.body);
      res.json({ result: `ruha bot handler!` });
    });

    let port = settings.isProductionEnv() ? process.env.PORT : 8000;

    let server = app.listen(port, function () {
      let host = server.address().address;
      let port = server.address().port;

      console.log(`Server started at http://${host}:${port}`);
    });
  }
}

function run() {
  if (settings) {
    start_express_server();
    // start_simple_server();

    logger.fatal(`started with '${logger.currentLogLevel()}' log level`);

    // historyManager
    //   .initOrdersHistory()
    //   .then(orders => { logger.warn('INIT ORDERS HISTORY COMPLETE'); })
    //   .then(result => {
    //     // logger.log(settings.get('orders.statuses'));
    //     logIn(settings, startUpdatesPolling);
    //   });
  }
}

run();