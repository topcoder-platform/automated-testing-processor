/**
 * The configuration file.
 */
const fs = require("fs");

function fileIfExists(path) {
  return fs.existsSync(path) ? path : null;
}

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING
    ? Boolean(process.env.DISABLE_LOGGING)
    : false,
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",
  PORT: process.env.PORT || 3000,

  // AWS options
  aws: {
    AWS_REGION: process.env.AWS_REGION, // AWS Region to be used by the application
    S3_BUCKET: process.env.S3_BUCKET, // S3 Bucket to which test results need to be uploaded
  },

  // Git options
  git: {
    GIT_USERNAME: process.env.GIT_USERNAME,
    GIT_TOKEN: process.env.GIT_TOKEN,
    GIT_REPOSITORY_URL: process.env.GIT_REPOSITORY_URL,
  },

  KAFKA_URL: process.env.KAFKA_URL || "localhost:9092",
  KAFKA_CLIENT_CERT:
    process.env.KAFKA_CLIENT_CERT || fileIfExists("./kafkadev.cert"),
  KAFKA_CLIENT_CERT_KEY:
    process.env.KAFKA_CLIENT_CERT_KEY || fileIfExists("./kafkadev.key"),
  GROUP_CONSUMER_NAME: process.env.GROUP_CONSUMER_NAME,

  // Kafka topics to listen to
  KAFKA_AGGREGATE_SUBMISSION_TOPIC:
    process.env.KAFKA_NEW_SUBMISSION_TOPIC ||
    "submission.notification.aggregate",
  KAFKA_NEW_SUBMISSION_TOPIC:
    process.env.KAFKA_NEW_SUBMISSION_TOPIC || "submission.notification.create",
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || "common.error.reporting",

  AV_SCAN_REVIEW_NAME: process.env.AV_SCAN_REVIEW_NAME || "Virus Scan",

  // OAUTH details
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  // API endpoints
  SUBMISSION_API_URL:
    process.env.SUBMISSION_API_URL || "https://api.topcoder-dev.com/v5",
  CHALLENGE_API_URL:
    process.env.CHALLENGE_API_URL || "https://api.topcoder-dev.com/v4",
  CHALLENGE_API_V5_URL:
    process.env.CHALLENGE_API_V5_URL || "https://api.topcoder-dev.com/v5",
  BUSAPI_URL:
    process.env.BUSAPI_URL || "https://api.topcoder-dev.com/v5/bus/events",

  // Review options
  // TODO - Update review type name for this tester app
  REVIEW_TYPE_NAME: process.env.REVIEW_TYPE_NAME || "MMScorer",
  // TODO - Update the scorecard id for this tester app
  REVIEW_SCORECARD_ID: process.env.REVIEW_SCORECARD_ID || "30001852",

  // Challenge tags to consider for scoring
  CHALLENGE_TAGS: process.env.CHALLENGE_TAGS
    ? process.env.CHALLENGE_TAGS.split(",")
    : ["Automated Testing"],

  PROVISIONAL_TESTING_TIMEOUT: process.env.PROVISIONAL_TESTING_TIMEOUT
    ? Number(process.env.PROVISIONAL_TESTING_TIMEOUT)
    : 60000, // 2 Hours
  FINAL_TESTING_TIMEOUT: process.env.FINAL_TESTING_TIMEOUT
    ? Number(process.env.FINAL_TESTING_TIMEOUT)
    : 2 * 60 * 60 * 1000, // 2 Hours

  DOCKER_SOLUTION_MOUNT_PATH: "`${submissionPath}/code/src:/src`",
  DOCKET_TEST_SPEC_MOUNT_PATH: "`${submissionPath}/artifacts/public:/hostlog`",
};
