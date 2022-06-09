/**
 * Tester Service for `Code` type of Marathon Matches
 */

const path = require("path");
const config = require("config");
const logger = require("../common/logger");
const helper = require("../common/helper");

const {
  buildDockerImage,
  deleteDockerImage,
  createContainer,
  executeSubmission,
  getContainerLog,
  killContainer,
} = require("../common/docker");

let submissionDirectory;
let solutionContainerId;
let testSpecContainerId;
let solutionImageName;
let testSpecImageName;

module.exports.performCodeTest = async (
  challengeId,
  submissionId,
  submissionPath,
  customRun,
  testPhase,
  gpuFlag,
  solutionLanguage,
  testFramework
) => {
  try {
    submissionDirectory = path.resolve(`${submissionPath}/submission`);
    let cwdPath = `${submissionDirectory}/code`;
    let dockerfilePath = `${submissionDirectory}/SolutionDockerfile.tar.gz`;
    let logPath = `${submissionDirectory}/artifacts/public/solution-docker-image-build.log`;
    solutionImageName = `${submissionId}-solution-image`;
    let solutionContainerName = `${submissionId}-solution-container`;
    let volumesFrom = null;
    let links = null;

    // Build image from user solution
    await Promise.race([
      buildDockerImage(
        submissionId,
        cwdPath,
        dockerfilePath,
        solutionImageName,
        logPath
      ),
      new Promise((resolve, reject) => {
        setTimeout(
          () => reject(new Error("Timeout :: Docker solution image build")),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    let testCommand = [];

    // Create container from user solution image
    solutionContainerId = await Promise.race([
      createContainer(
        submissionId,
        solutionImageName,
        submissionDirectory,
        config.DOCKER_SOLUTION_MOUNT_PATH, // `/src`
        testCommand,
        "solution",
        gpuFlag,
        solutionContainerName
      ),
      new Promise((resolve, reject) => {
        setTimeout(
          () =>
            reject(new Error("Timeout :: Docker solution container creation")),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    // Start user solution container
    await Promise.race([
      executeSubmission(
        solutionContainerId,
        !helper.isUiTesting(testFramework)
      ),
      new Promise((resolve, reject) => {
        setTimeout(
          () =>
            reject(new Error("Timeout :: Docker solution container execution")),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    cwdPath = `${submissionDirectory}/tests`;
    dockerfilePath = `${submissionDirectory}/TestSpecDockerfile.tar.gz`;
    logPath = `${submissionDirectory}/artifacts/public/test-spec-docker-image-build.log`;
    testSpecImageName = `${submissionId}-test-spec-image`;

    // Build image from test specification
    await Promise.race([
      buildDockerImage(
        submissionId,
        cwdPath,
        dockerfilePath,
        testSpecImageName,
        logPath
      ),
      new Promise((resolve, reject) => {
        setTimeout(
          () => reject(new Error("Timeout :: Docker test specs image build")),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    if (!helper.isUiTesting(testFramework)) {
      testCommand = [`${solutionLanguage}`];
      volumesFrom = [`${solutionContainerName}:ro`];
    } else {
      links = [`${solutionContainerName}:solution-container`];
    }

    // Create container from test spec image
    testSpecContainerId = await Promise.race([
      createContainer(
        submissionId,
        testSpecImageName,
        submissionDirectory,
        config.DOCKER_TEST_SPEC_MOUNT_PATH,
        testCommand,
        "solution",
        gpuFlag,
        `${submissionId}-test-spec-container`,
        volumesFrom,
        links
      ),
      new Promise((resolve, reject) => {
        setTimeout(
          () =>
            reject(new Error("Timeout :: Docker test spec container creation")),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    // Start test spec container
    await Promise.race([
      executeSubmission(testSpecContainerId),
      new Promise((resolve, reject) => {
        setTimeout(
          () =>
            reject(
              new Error("Timeout :: Docker test spec container execution")
            ),
          testPhase === "system"
            ? config.FINAL_TESTING_TIMEOUT
            : config.PROVISIONAL_TESTING_TIMEOUT
        );
      }),
    ]);

    logger.info("CODE part of execution is completed");
  } catch (error) {
    logger.logFullError(error);
    throw new Error(error);
  } finally {
    await getContainerLog(
      submissionDirectory,
      solutionContainerId,
      "solution-container.log"
    );
    await getContainerLog(
      submissionDirectory,
      testSpecContainerId,
      "test-spec-container.log"
    );
    await killContainer(testSpecContainerId);
    await killContainer(solutionContainerId);
    await deleteDockerImage(testSpecImageName);
    await deleteDockerImage(solutionImageName);
    logger.info("CODE Testing cycle completed");
  }
};
