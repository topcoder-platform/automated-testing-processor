module.exports = {
  apps: [
    {
      name: 'Automated Testing',
      script: 'src/app.js',
      instances: 1,
      env: {
        KAFKA_URL: '',
        GROUP_CONSUMER_NAME: 'automated-testing-gc',
        KAFKA_CLIENT_CERT: '',
        KAFKA_CLIENT_CERT_KEY: '',
        AUTH0_AUDIENCE: '',
        AUTH0_CLIENT_ID: '',
        AUTH0_CLIENT_SECRET: '',
        AUTH0_URL: '',
        AUTH0_PROXY_SERVER_URL: '',

        SUBMISSION_API_URL: 'https://api.topcoder.com/v5',
        CHALLENGE_API_URL: 'https://api.topcoder.com/v4',
        CHALLENGE_API_V5_URL: 'https://api.topcoder.com/v5',

        REVIEW_TYPE_NAME: 'Automated Testing Review',
        BUSAPI_URL: 'https://api.topcoder.com/v5/bus/events',

        S3_BUCKET: '',

        CHALLENGE_TAGS: 'comma,separated,values',
        TOKEN_CACHE_TIME: 86400000,

        DOCKER_SOLUTION_MOUNT_PATH: '`${submissionPath}/code/src:/src`',
        DOCKER_TEST_SPEC_MOUNT_PATH: '`${submissionPath}/artifacts/public:/hostlog`',

        GIT_USERNAME: '',
        GIT_PASSWORD: '',

        NODE_ENV: ''
      }
    }
  ]
}
