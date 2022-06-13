const uuid = require("uuid/v4");
const helper = require("../common/helper");
const logger = require("../common/logger");

/**
 * Creates a new review record based on the score from Scorer
 */
class ReviewProducerService {
  /**
   * Constructs new review producer service.
   * @param {Object} config Takes config object with the following properties:
   * - SUBMISSION_API_URL - The submission API endpoint
   * - REVIEW_TYPE_NAME - The name of the review type to use, e.g. "TCO2018-F2FScorer"
   * - REVIEW_SCORECARD_ID: The review scorecard id to use, e.g. 30001850
   * - REVIEWER_ID_NAMESPACE: The GUID defining namespace for generating reviewerId as GUID based on the 'sub' value from JWT
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Calls the 'generateReview' method of the API.
   * @param {String} token M2M token value
   * @param {String} submissionId Submission Id, GUID
   * @param {String} reviewerId Reviewer Id, GUID
   * @param {String} reviewTypeId Review type Id, GUID
   * @param {Number} score Score value in percent from 0 to 100
   * @param {String} status One of 'completed' or 'queued'
   * @param {Object} metadata Test meta-data
   * @returns Response object returned from 'createReview' API
   */
  async generateReview(
    token,
    submissionId,
    reviewerId,
    reviewTypeId,
    score,
    status,
    metadata
  ) {
    return (
      await helper.getApi(token).post("/reviews").send({
        submissionId,
        scoreCardId: this.config.REVIEW_SCORECARD_ID,
        reviewerId,
        metadata,
        typeId: reviewTypeId,
        score,
        status,
      })
    ).body;
  }

  async generateUpdate(
    token,
    submissionId,
    reviewId,
    reviewerId,
    typeId,
    scoreCardId,
    score,
    status,
    metadata
  ) {
    return (
      await helper.getApi(token).put(`/reviews/${reviewId}`).send({
        submissionId,
        scoreCardId,
        reviewerId,
        metadata,
        typeId,
        score,
        status,
      })
    ).body;
  }

  /**
   * Main function of the service. Creates review from the score provided by Scorer
   * and creates new review record.
   * @param {String} submissionId Submission Id, GUID
   * @param {Number} score Score from the scorer
   * @param {Object} reviewObject Review Object
   * @param {String} status One of 'completed' or 'queued'
   * @param {Object} metadata Any metadata to be stored along with the review
   * @param {Object} reviewObject An existing review, which would result in the review getting updated
   * instead of a new review being created
   */
  async createReview(submissionId, score, status, metadata, reviewObject) {
    const token = await helper.getM2Mtoken();
    const reviewTypeId = await helper.getReviewTypeId(
      this.config.REVIEW_TYPE_NAME
    );
    const reviewerId = uuid();

    if (reviewObject) {
      logger.info(
        `Updating Review for submission ${submissionId} with score ${score}`
      );
      await this.generateUpdate(
        token,
        submissionId,
        reviewObject.id,
        reviewObject.reviewerId,
        reviewObject.typeId,
        reviewObject.scoreCardId,
        score,
        status,
        metadata
      );
      logger.info(
        `Review updated for submission ${submissionId} with score ${score}`
      );
    } else {
      logger.info(
        `Creating Review for submission ${submissionId} with score ${score}`
      );
      const review = await this.generateReview(
        token,
        submissionId,
        reviewerId,
        reviewTypeId,
        score,
        status,
        metadata
      );
      logger.info(
        `Created Review for submission ${submissionId} with score ${score}`
      );
      return review;
    }
  }
}
module.exports = ReviewProducerService;
