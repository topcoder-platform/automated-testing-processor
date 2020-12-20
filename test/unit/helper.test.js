/**
 * The test cases for the saturators
 */
const sinon = require('sinon')
const request = require('superagent')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const { downloadAndUnzipFile } = require('../../src/common/helper')
const rimraf = require('rimraf')

chai.use(sinonChai)

afterEach((done) => {
  // Restore the default sandbox here
  sinon.restore()
  rimraf('submissions', () => {
    done()
  })
})

describe('Helper', () => {
  beforeEach(() => {
    sinon.restore()
    sinon.stub(request, 'get').returns({
      pipe: sinon.stub().returnsThis(),
      on: sinon.stub().yields({})
    })
  })
  it('attempts to download', async () => {
    await downloadAndUnzipFile('url')
  })
})
