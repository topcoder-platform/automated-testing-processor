/**
 * The application entry point
 */
require("dotenv").config();

const config = require("config");
const healthcheck = require("topcoder-healthcheck-dropin");
const logger = require("./common/logger");
const Kafka = require("no-kafka");
const KafkaHandlerService = require("./services/KafkaHandlerService");

global.Promise = require("bluebird");

// start Kafka consumer
logger.info("Start Kafka consumer.");
// create consumer
const options = {
  connectionString: config.KAFKA_URL,
  handlerConcurrency: 1,
  groupId: config.GROUP_CONSUMER_NAME,
};

if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  options.ssl = {
    cert: config.KAFKA_CLIENT_CERT,
    key: config.KAFKA_CLIENT_CERT_KEY,
  };
}

const consumer = new Kafka.GroupConsumer(options);
// data handler
const dataHandler = (messageSet, topic, partition) =>
  Promise.each(messageSet, (m) => {
    const message = m.message.value.toString("utf8");

    logger.info(
      `Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${m.offset}; Message: ${message}.`
    );

    let messageJSON;

    try {
      messageJSON = JSON.parse(message);
    } catch (e) {
      logger.error("Invalid message JSON.");
      logger.error(e);
      return;
    }

    if (messageJSON.topic !== topic) {
      logger.info(
        `The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`
      );
      return;
    }

    if (
      messageJSON.payload.originalTopic !== config.KAFKA_NEW_SUBMISSION_TOPIC
    ) {
      logger.info(`Skip message ${message} as the message is of no interest.`);
      return;
    }

    return KafkaHandlerService.handle(messageJSON)
      .then(() => {})
      .catch((err) => {
        logger.error("Logging Full Error");
        logger.logFullError(err);
      })
      .finally(() => {
        logger.info("Committing offset");
        consumer.commitOffset({ topic, partition, offset: m.offset });
      });
  });

// check if there is kafka connection alive
function check() {
  if (
    !consumer.client.initialBrokers &&
    !consumer.client.initialBrokers.length
  ) {
    return false;
  }
  let connected = true;
  consumer.client.initialBrokers.forEach((conn) => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`);
    connected = conn.connected & connected;
  });
  return connected;
}

const strategies = [
  {
    subscriptions: [config.KAFKA_AGGREGATE_SUBMISSION_TOPIC],
    handler: dataHandler,
  },
];

consumer
  .init(strategies)
  // consume configured topics
  .then(() => {
    healthcheck.init([check]);
    logger.debug("Consumer initialized successfully");
  })
  .catch(logger.logFullError);

module.exports = {
  kafkaConsumer: consumer,
};
