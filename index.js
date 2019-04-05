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
  // if (settings.get('env') === 'production') {
  if (settings.get('env')) {
    logger.warn('start_express_server');
    let app = express(),
      token = settings.get('credentials.telegram_bot.api_token');

    //Here we are configuring express to use body-parser as middle-ware.
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/', function (req, res) {
      res.json({ version: packageInfo.version });
    });

    app.post(`/${token}`, function (req, res) {
      logger.log(req.body);
      telegramApi.processUpdate(req.body);
      res.sendStatus(200);
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

async function testCommands() {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  // const resp = match[1]; // the captured "whatever"
  // send back the matched "whatever" to the chat
  await util.asyncForEach(telegramApi.startInstructions(), async (i, instruction) => {
    logger.log(instruction);
    await util.sleep(telegramApi.getDelayBetweenRequests());
  })
}

function run_test() {
  if (settings) {
    testCommands();
  }
}

run();

// run_test();