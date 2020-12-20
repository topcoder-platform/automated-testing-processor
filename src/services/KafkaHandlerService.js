/**
 * Service for Kafka handler.
 */
const _ = require('lodash')
const config = require('config')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const helper = require('../common/helper')
const logger = require('../common/logger')

const { performCodeTest } = require('./CodeTesterService')
const ReviewProducerService = require('./ReviewProducerService')
const Const = require('../constants')
const reviewProducer = new ReviewProducerService(config)

const testConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/phase-config.json')))

/**
 * Handle Kafka message.
 * @param {Object} message the Kafka message in JSON format
 */
async function handle (message) {
  let reviewObject
  let result
  let solutionLanguage
  let resultFilePath

  logger.info(`Kafka message: ${JSON.stringify(message, null, 2)}`)

  const avScanReviewTypeId = await helper.getReviewTypeId(config.AV_SCAN_REVIEW_NAME)

  const resource = _.get(message, 'payload.resource', '')
  const typeId = _.get(message, 'payload.typeId', '')
  const reviewScore = _.get(message, 'payload.score', '')
  const testPhase = _.get(message, 'testType', 'provisional')

  if (!(resource === 'review' && typeId === avScanReviewTypeId)) {
    logger.info(
      `Message is not an anti virus scan review. Message is thus ignored: ${resource} / ${typeId}`
    )
    return
  }

  const submissionId = _.get(message, 'payload.submissionId', '')
  if (!submissionId) {
    throw new Error('No submission id present in event. Cannot proceed.')
  }

  // Check if AV scan successful
  if (reviewScore !== 100) {
    logger.info(
      `Review indicates that submission failed anti virus checks. Message is thus ignored: ${submissionId} / ${reviewScore}`
    )
    return
  }

  // Get the submission by submission id
  logger.info(`Fetch submission using ${submissionId}`)
  const submission = await helper.getSubmission(submissionId)

  // Extract `challengeId from the submission object
  const challengeId = _.get(submission, 'challengeId')

  // Check if the contest associated with the submission is relevant
  const challengeDetails = await helper.getChallenge(challengeId)

  const tags = _.get(challengeDetails, 'tags', [])
  let codeRepo = _.find(_.get(challengeDetails, 'metadata', {}), { name: 'codeRepo' })
  codeRepo = _.get(codeRepo, 'value', '')

  if (_.intersection(tags, config.CHALLENGE_TAGS).length === 0) {
    logger.info(`Ignoring message as challenge with id - ${challengeId} does not contain any relevant tags. Challenge's tags: ${tags.join(',')} whereas tags needed: ${config.CHALLENGE_TAGS}`)
    return
  }

  // Clone the test specifications
  await helper.cloneSpecAndTests(submissionId, codeRepo)

  try {
    const testFramework = helper.getTestFrameworkFromChallengeConfig(submissionId)

    // Create `review` with `status = queued` for the submission
    reviewObject = await reviewProducer.createReview(submissionId, null, 'queued', { testType: testPhase })

    // Download submission
    const submissionPath = await helper.downloadAndUnzipFile(submissionId)

    if (!helper.isUiTesting(testFramework)) {
      // Detect which language the submission is in
      solutionLanguage = helper.detectSolutionLanguage(`${submissionPath}/submission/code/src`)
      logger.info(`Detected solution language: ${solutionLanguage}`)
    } else {
      solutionLanguage = ''
    }

    if (!fs.existsSync(`${submissionPath}/submission/artifacts/private`)) {
      logger.info('creating private artifact dir')
      await fs.mkdirSync(`${submissionPath}/submission/artifacts/private`, { recursive: true })
    }

    if (!fs.existsSync(`${submissionPath}/submission/artifacts/public`)) {
      logger.info('creating public artifact dir')
      await fs.mkdirSync(`${submissionPath}/submission/artifacts/public`, { recursive: true })
    }

    // Initiate `execution` and `error` logs
    logger.addFileTransports(path.join(__dirname, '../../submissions/', submissionId, 'submission/artifacts/public'), submissionId)

    const testType = testConfig[testPhase].testType
    logger.info(`Processing the submission ${submissionId} / phase: ${testPhase} / type: ${testType}`)

    const customCodeRun = testConfig[testPhase].customCodeRun
    const gpuFlag = testConfig[testPhase].gpuFlag

    if (!fs.existsSync(`${submissionPath}/submission/code`)) {
      logger.error(`Wrong folder structure detected, missing "code" folder for ${submissionId}.`)
      throw new Error(`Wrong folder structure detected, missing "code" folder for ${submissionId}.`)
    }

    logger.info(`Started executing CODE type of submission for ${submissionId} | ${submissionPath}`)
    await performCodeTest(
      challengeId,
      submissionId,
      submissionPath,
      customCodeRun,
      testPhase,
      gpuFlag,
      solutionLanguage,
      testFramework
    )

    if ([Const.testingFrameworks.taiko, Const.testingFrameworks.gauge].includes(testFramework)) {
      resultFilePath = path.join(`${submissionPath}/submission/artifacts/public/json-report`, 'result.json')
    } else {
      // for selenium based testing
      resultFilePath = path.join(`${submissionPath}/submission/artifacts/public`, 'results.json')
    }

    if (!fs.existsSync(resultFilePath)) {
      throw new Error('No result file available. Cannot determine score')
    }

    const resultFile = fs.readFileSync(resultFilePath, 'utf-8')
    result = JSON.parse(resultFile)
    let { score, tests } = helper.getTestMetadata(result, testFramework)

    reviewObject.metadata = _.assign(reviewObject.metadata, { tests })

    // TODO - Use helper once we decide about the private metadata
    // TODO - for now, we set it directly in the next statement
    // const metadata = await helper.prepareMetaData(submissionPath, testPhase)
    // Commented out below since review api would not get updated if metadata was changed. Why? Reasons unknown...
    // const metadata = {
    //   testType: testPhase,
    //   public: JSON.stringify(result),
    //   private: 'this is a private message'
    // }

    logger.info(`Create Review for ${submissionId} with Score = ${score}`)
    await reviewProducer.createReview(submissionId, score, 'completed', reviewObject.metadata, reviewObject)
  } catch (error) {
    logger.logFullError(error)
    logger.info('Create Review with Negative Score')
    await reviewProducer.createReview(submissionId, -1, 'completed', { testType: testPhase }, reviewObject)
  } finally {
    const filePath = path.join(__dirname, '../../submissions', submissionId)

    logger.info(`Uploading artifacts for ${submissionId}`)
    await helper.zipAndUploadArtifact(filePath, submissionId, testPhase)

    rimraf.sync(`${filePath}/submission`)
    logger.info(`Process complete for submission: ${submissionId}`)
    logger.resetTransports()
  }
}

// Exports
module.exports = {
  handle
}

logger.buildService(module.exports)
