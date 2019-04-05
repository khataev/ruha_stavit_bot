const request = require('request');
const util = require('./util');

const Bot = require('node-telegram-bot-api');

let bot_today, sent_message_log_length;

function cropSentMessage(message) {
  return `${message.substr(0, sent_message_log_length)}...`;
}

// function answerCallbackQueryToday(query_id, text) {
//   bot.answerCallbackQuery(query_id, { text: text, show_alert: true } );
// };

let telegram = function(settings, logger, set_webhooks = false) {
  let today_token = settings.get('credentials.telegram_bot.api_token'),
    message_prepender = settings.get('debug.message_prepender'),
    application_name = settings.get('application_name'),
    is_production_env = settings.isProductionEnv();

  // bot_today = new Bot(today_token, { polling: false });

  bot_today = new Bot(today_token);

  bot_today.id = 'bot_today';
  sent_message_log_length = settings.get('debug.sent_message_log_length');

  if (application_name && is_production_env && set_webhooks) {
    // TODO: move webhooks initialization to explicit routine to be run consequently
    // before login
    const parent = this;
    logger.warn('Setting bot webhook');
    bot_today
      .setWebHook(`https://${application_name}.herokuapp.com/${today_token}`)
      .then(() => logger.warn('Setting bot webhook - DONE'))
      .then(() => logger.warn('Telegram webhooks initialization passed'))
      .then(() => this.setCommands())
      .catch(error => logger.error(error.message));
  }
  if (!application_name)
    logger.error('Параметр application_name не установлен');

  this.setCommands = function () {
    let parent = this;
    // Matches "/echo [whatever]"
    bot_today.onText(/\/start (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message

      const chatId = msg.chat.id;
      bot_today.sendMessage(chatId, 'on start');
      bot_today.sendMessage(chatId, this.startInstructions()[0])
        .then(() => bot_today.sendMessage(chatId, this.startInstructions()[1]))
        .catch(error => logger.error(error.message));

      // // const resp = match[1]; // the captured "whatever"
      // // send back the matched "whatever" to the chat
      // await util.asyncForEach(this.startInstructions(), async (i, instruction) => {
      //   logger.log(instruction);
      //   bot_today.sendMessage(chatId, instruction);
      //   await util.sleep(parent.getDelayBetweenRequests());
      // })
    });

    bot_today.on('message', msg => {
      bot_today.sendMessage(msg.chat.id, '⚙️Если у вас возникли трудности с оплатой, обратитесь в нашу тех-поддержку @ruha_stavit_manager и мы вам поможем');
    });

  };

  this.startInstructions = function() {
    return [
      'https://www.youtube.com/watch?v=olztRgAZmDA&t=6s',
      '🔥 Litvin Stavit\n' +
      'Месячная подписка \n' +
      'После оплаты у тебя будет:\n' +
      '\n' +
      '1⃣ Личный кабинет в телеграм-боте с обучением по ставкам. (Как ставить? Где ставить? Доп. техники. И тд)\n' +
      '2⃣ 130-150 прогнозов в месяц со средней доходностью 280% в месяц. 4-6 ставок в день с проходимостью 85% \n' +
      '3⃣ Полное сопровождение по всем ставкам + помощь по любым вопросам в течении всего месяца\n' +
      '4⃣ Дополнительный бонус от Litvin Stavit после оплаты\n' +
      '\n' +
      '✅ В среднем вложенные деньги отбиваются за 3 дня\n' +
      '\n' +
      '💳 Стоимость: 3500 рублей\n' +
      '⬇️Если готов начать, Жми'
    ];
  };

  this.mapGetUpdatesElement = function (elem) {
    logger.debug('mapGetUpdatesElement', elem);
    return elem['message']['chat']['id'];
  };

  // this.answerCallbackQuery = function(query_id, text, bot = 'today') {
  //   if (bot === 'today') {
  //     answerCallbackQueryToday(query_id, text);
  //   }
  //   else {
  //     answerCallbackQueryTomorrow(query_id, text);
  //   }
  // };

  this.processUpdate = function(message){
    bot_today.processUpdate(message);
  };

  // TODO
  this.getChatIds = function (){
    return settings
      .get('credentials.telegram_bot.chat_ids')
      .map(chat_id => chat_id.toString().trim());
  };

  // TODO: rollback save to history if send failed
  this.sendMessageToSubscriber = function (chat_id, text, reply_markup_options) {
    let sanitized_chat_id = parseInt(chat_id, 10);
    if (isNaN(sanitized_chat_id)) {
      logger.error('chat_id is empty');
    }
    let sanitized_text = util.sanitizeText(`${message_prepender}${text}`.trim());
    // let delay = this.getDelayBetweenRequests();
    // let url = `https://api.telegram.org/bot${api_token}/sendMessage?chat_id=${chat_id}&text=${encoded_text}`;
    logger.info(`sendMessageToSubscriber. chat_id: ${sanitized_chat_id}, text: ${sanitized_text}`);

    return bot_today
      .sendMessage(sanitized_chat_id, sanitized_text, reply_markup_options)
      .then(message => {
        logger.warn(
          `sendMessageToSubscriber. SEND! chat_id: ${sanitized_chat_id}, text: ${cropSentMessage(sanitized_text)}`
        );
        logger.debug(message);
        return message;
    });
  };

  this.editSubscriberMessageForBot = function (chat_id, message_id, reply_markup, bot) {
    let sanitized_chat_id = parseInt(chat_id, 10);
    if (isNaN(sanitized_chat_id)) {
      logger.error('chat_id is empty');
    }

    let options = {
      chat_id: chat_id,
      message_id: message_id
    };
    logger.warn(`editSubscriberMessageForBot. bot_id: ${bot.id}, chat_id: ${sanitized_chat_id}, message_id: ${message_id}`);
    return bot.editMessageReplyMarkup(reply_markup, options);
  };

  this.editSubscriberMessage = function (chat_id, message_id, reply_markup_options) {
    return this.editSubscriberMessageForBot(chat_id, message_id, reply_markup_options, bot_today);
  };

  this.sendToTelegram = async function (text, reply_markup_options) {
    let chat_ids = this.getChatIds();
    let sent_messages = {};
    if (chat_ids && chat_ids.length > 0) {
      logger.warn(`sendToTelegram. destination chat_ids: ${chat_ids}`);
      // TODO: how to avoid this context hoisting?
      let parent = this;
      await util.asyncForEach(chat_ids, async function (i, chat_id) {
        await parent
          .sendMessageToSubscriber(chat_id, text, reply_markup_options)
          .then(message => sent_messages[chat_id] = message.message_id);
        await util.sleep(parent.getDelayBetweenRequests());
      });
    }
    return sent_messages;
  };

  // TODO: rename 'Telegram' functions
  this.editMessagesInTelegramForBot = async function (sent_messages, reply_markup, bot) {
    const chat_ids = Object.getOwnPropertyNames(sent_messages);
    if (chat_ids && chat_ids.length > 0) {
      logger.info(`editMessagesInTelegramForBot. destination chat_ids: ${chat_ids}`);
      let parent = this;
      await util.asyncForEach(chat_ids, async (i, chat_id) => {
          let message_id = sent_messages[chat_id];
          parent
            .editSubscriberMessageForBot(chat_id, message_id, reply_markup, bot)
            .catch(error => {
              logger
                .warn(
                  `editMessagesInTelegramForBot. chat_id: ${chat_id}, message_id: ${message_id}, ERROR: ${error.message}`
                );
            });
          await util.sleep(parent.getDelayBetweenRequests());
      });
    }
  };

  this.editMessagesInTelegram = function (sent_messages, reply_markup) {
    return this.editMessagesInTelegramForBot(sent_messages, reply_markup, bot_today);
  };


  this.getApiToken = function (settings) {
    return settings.get('credentials.telegram_bot.today.api_token');
  };

  this.getDelayBetweenRequests = function (){
    return settings.get('credentials.telegram_bot.delay_between_requests');
  };

  this.getReplyMarkupBotApiOptions = function (orderNumber) {
    return {
      "reply_markup": this.getReplyMarkup(orderNumber)
    };
  };

  this.getEmptyReplyMarkupBotOptions = function () {
    return {};
  };

  this.getReplyMarkup = function (orderNumber) {
    return {
        "inline_keyboard": [
          [{ "text": 'Забрать заказ', "callback_data": `seizeOrder_${orderNumber}` }]
        ]
      };
  };

  this.getTodayBot = function() {
    return bot_today;
  };
};

module.exports = telegram;









