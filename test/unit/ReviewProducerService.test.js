/**
 * The test cases for the saturators
 */
const config = require('config')
const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const ReviewProducerService = require('../../src/services/ReviewProducerService')
const helper = require('../../src/common/helper')
const uuidv5 = require('uuid/v5')

chai.use(sinonChai)

afterEach(() => {
  // Restore the default sandbox here
  sinon.restore()
})

const testToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoiOFFvdkRoMjdTckR1MVhTczY4bTIxQTFOQlA4aXN2T3RAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxNTQxMTgxNTE3LCJleHAiOjE1NDEyNjc5MTcsImF6cCI6IjhRb3ZEaDI3U3JEdTFYU3M2OG0yMUExTkJQOGlzdk90Iiwic2NvcGUiOiJyZWFkOmNoYWxsZW5nZXMgcmVhZDpncm91cHMgcmVhZDpzdWJtaXNzaW9uIHJlYWQ6cmV2aWV3X3R5cGUgcmVhZDpyZXZpZXdfc3VtbWF0aW9uIHJlYWQ6cmV2aWV3IHJlYWQ6cHJvamVjdCByZWFkOnVzZXJfcHJvZmlsZXMgcmVhZDpyb2xlcyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.aRD-SOnCwZ7VmmZPfVEBtknzg9i0bMZhKg1Vdy9k3bcJzKUCMRzDquagFtX67YzvLetqOEuqnlpzgZ17a4PDSWDzA8UIwupMz2Mc-0qg-lgwzLRyK9_7-HIjX6RznvR8WOCP6UVWpFUyd05YT4yvc3LnSVZ-K-B9DzLgmgt5lg2pMTkqgAHh_yMLKd74dxVVPbIsgEmiSj4hE_MTTbhtb8B6mheH4tfDkN8XEI-6VS-QbQYsU4ecFAgMrx-ElFYYuUtc85u_2gT5-lonP-afnlwu5iH1GPrE-vMZouEqg8iywm7GSY9O1lpVsl-wD3fFevWYIJu9DXJxvTI_gJ8y0A'

const newmanJsonScore100 = {
  run: {
    stats: {
      tests: {
        total: 20,
        failed: 0
      }
    }
  }
}

const newmanJsonScore80 = {
  run: {
    stats: {
      tests: {
        total: 20,
        failed: 4
      }
    }
  }
}

const expectedReviewRecord = {
  submissionId: 'submission1',
  scoreCardId: config.REVIEW_SCORECARD_ID,
  reviewerId: uuidv5('8QovDh27SrDu1XSs68m21A1NBP8isvOt@clients', config.REVIEWER_ID_NAMESPACE),
  typeId: 'reviewType1'
}

describe('ReviewProducer service', () => {
  let reviewProducer

  beforeEach(() => {
    reviewProducer = new ReviewProducerService(config)
  })
  it('creates review with score 100 for all-succeeded Newman tests', async () => {
    const getTokenStub = sinon.stub(helper, 'getM2Mtoken').resolves(testToken)
    sinon.stub(helper, 'getReviewTypeId').resolves('reviewType1')
    const createReviewStub = sinon.stub(reviewProducer, 'createReview').resolves('reviewResp1')

    await reviewProducer.calcScoreAndCreateReview('submission1', newmanJsonScore100)

    sinon.assert.calledOnce(getTokenStub)
    expect(createReviewStub).to.have.been.calledOnceWith(testToken,
      expectedReviewRecord.submissionId,
      expectedReviewRecord.reviewerId,
      expectedReviewRecord.typeId,
      100
    )
  }).timeout(30000)
  it('creates review with score 80 for partially-succeeded Newman tests', async () => {
    const getTokenStub = sinon.stub(helper, 'getM2Mtoken').resolves(testToken)
    sinon.stub(helper, 'getReviewTypeId').resolves('reviewType1')
    const createReviewStub = sinon.stub(reviewProducer, 'createReview').resolves('reviewResp1')

    await reviewProducer.calcScoreAndCreateReview('submission1', newmanJsonScore80)

    sinon.assert.calledOnce(getTokenStub)
    expect(createReviewStub).to.have.been.calledOnceWith(testToken,
      expectedReviewRecord.submissionId,
      expectedReviewRecord.reviewerId,
      expectedReviewRecord.typeId,
      80
    )
  }).timeout(30000)
})
