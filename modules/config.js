const convict = require('convict');

// Define a schema
const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
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
    bot: {
      api_token: {
        doc: "Api token for bot",
        format: String,
        default: "",
        env: "CREDENTIALS_BOT_API_TOKEN"
      }
    }
  },
  debug: {
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