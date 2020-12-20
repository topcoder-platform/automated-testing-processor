/**
 * The test cases for the saturators
 */

const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const { getSubmission } = require('../../src/services/SubmissionService')
const helper = require('../../src/common/helper')

chai.use(sinonChai)

const testSubmission = {
  'id': '5b56a28a-e457-4d55-8cf9-a547d6bfe9b4',
  'review': [
    {
      'typeId': 'AV_SCAN',
      'score': 100
    }
  ]
}

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore()
})

describe('Submission service', () => {
  it('makes an auth GET for submission', async () => {
    sinon.stub(helper, 'getM2Mtoken').resolves('token')
    sinon.stub(helper, 'reqSubmission').resolves({ body: testSubmission })
    const submission = await getSubmission(testSubmission.id)
    expect(submission).to.equal(testSubmission)
  })
})
