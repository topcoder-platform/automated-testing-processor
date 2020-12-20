/**
 * The test cases for the saturators
 */
const sinon = require('sinon')
const { handle } = require('../../src/services/KafkaHandlerService')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const DockerNewmanService = require('../../src/services/DockerNewmanService')
const SubmissionService = require('../../src/services/SubmissionService')
const ReviewProducerService = require('../../src/services/ReviewProducerService')
const helper = require('../../src/common/helper')

chai.use(sinonChai)

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore()
})

const validPayload = { 'payload': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'topic': 'submission.notification.create', 'originator': 'me', 'timestamp': '2018-10-10', 'mime-type': 'text' }
const testSubmission = {
  'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4',
  'review': [
    {
      'typeId': 'AV_SCAN',
      'score': 100
    }
  ]
}

describe('Kafka handler', () => {
  it('processes a valid message', async () => {
    sinon.stub(helper, 'getChallenge').resolves({ groupIds: [20000083] })
    sinon.stub(helper, 'getReviewTypeId').resolves('AV_SCAN')
    sinon.stub(SubmissionService, 'getSubmission').resolves(testSubmission)
    const stub2 = sinon.stub(DockerNewmanService, 'process').resolves({})
    const stub3 = sinon.stub(ReviewProducerService.prototype, 'calcScoreAndCreateReview').resolves({})
    await handle(validPayload)
    expect(stub2).to.have.been.calledOnceWith(testSubmission)
    sinon.assert.calledOnce(stub3)
  }).timeout(10000)

  it('expects a topic', async () => {
    const result = await handle({ 'payload': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'originator': 'me', 'timestamp': '2018-10-10', 'mime-type': 'text' }).catch(err => err.details[0].message)
    expect(result).to.equal('"topic" is required')
  })

  it('expects a originator', async () => {
    const result = await handle({ 'payload': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'topic': 'submission.notification.create', 'timestamp': '2018-10-10', 'mime-type': 'text' }).catch(err => err.details[0].message)
    expect(result).to.equal('"originator" is required')
  })

  it('expects a timestamp', async () => {
    const result = await handle({ 'payload': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'topic': 'submission.notification.create', 'originator': 'me', 'mime-type': 'text' }).catch(err => err.details[0].message)
    expect(result).to.equal('"timestamp" is required')
  })

  it('expects a mimetype', async () => {
    const result = await handle({ 'payload': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'topic': 'submission.notification.create', 'originator': 'me', 'timestamp': '2018-10-10' }).catch(err => err.details[0].message)
    expect(result).to.equal('"mime-type" is required')
  })

  it('expects a payload', async () => {
    const result = await handle({ 'payload2': { 'resource': 'submission', 'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4', 'type': 'Contest Submission', 'url': 'https://s3-eu-west-1.amazonaws.com/rw-tc/telemetry.zip', 'memberId': 23124329, 'challengeId': 30072543, 'created': '2018-10-02T02:57:55.131Z', 'updated': '2018-10-02T02:57:55.131Z', 'createdBy': 'Amith', 'updatedBy': 'Amith', 'submissionPhaseId': 961198, 'fileType': 'zip', 'isFileSubmission': false }, 'topic': 'submission.notification.create', 'originator': 'me', 'timestamp': '2018-10-10', 'mime-type': 'text' }).catch(err => err.details[0].message)
    expect(result).to.equal('"payload" is required')
  })
})
