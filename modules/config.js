const convict = require('convict');

// Define a schema
const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  application_name: {
    doc: "The application name (used for telegram webhooks).",
    format: String,
    default: "",
    env: "APPLICATION_NAME"
  },
  db: {
    username: {
      doc: "username",
      format: String,
      default: "",
      env: "DATABASE_USERNAME"
    },
    password: {
      doc: "password",
      format: String,
      default: "",
      env: "DATABASE_PASSWORD"
    },
    database: {
      doc: "database",
      format: String,
      default: "",
      env: "DATABASE_DATABASE"
    },
    host: {
      doc: "host",
      format: String,
      default: "127.0.0.1",
      env: "DATABASE_HOST"
    },
    dialect: {
      doc: "dialect",
      format: String,
      default: "postgres",
      env: "DATABASE_DIALECT"
    },
    url: {
      doc: "url",
      format: String,
      default: "",
      env: "DATABASE_URL"
    }
  },
  credentials: {
    telegram_bot: {
      delay_between_requests: {
        doc: "Delay between consequent API calls (ms)",
        format: "int",
        default: "1",
        env: "CREDENTIALS_TELEGRAM_BOT_DELAY"
      },
      api_token: {
        doc: "Api token for bot",
        format: String,
        default: "",
        env: "CREDENTIALS_TELEGRAM_BOT_API_TOKEN"
      },
      chat_ids: {
        doc: "List of internal chat ids of bot recipients",
        format: Array,
        default: [],
        env: "CREDENTIALS_TELEGRAM_BOT_CHAT_IDS"
      }
    }
  },
  debug: {
    message_prepender: {
      doc: "Text to prepend every message with",
      format: String,
      default: "",
      env: "DEBUG_MESSAGE_PREPENDER"
    },
    sent_message_log_length: {
      doc: "Length of a sent message in a log (crop if exceeds)",
      format: "int",
      default: 50,
      env: "DEBUG_SENT_MESSAGE_LOG_LENGTH"
    },
    log_level: {
      doc: "Log level",
      format: function check(val) {
        regexp = /debug|info|warn|error|fatal/i;
        if(!regexp.test(val)) {
          throw new Error(`Unpermitted log level: ${val}`);
        }
      },
      default: 'info',
      env: "DEBUG_LOG_LEVEL"
    }
  }
});

// Load environment dependent configuration
let env = config.get('env');
config.loadFile('./config/' + env + '.json');

// Perform validation
config.validate({allowed: 'strict'});

// custom functions
config.isProductionEnv = function() {
  return this.get('env') === 'production';
};

config.isDevelopmentEnv = function() {
  return this.get('env') === 'development';
};

module.exports = config;