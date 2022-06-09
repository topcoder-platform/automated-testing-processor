/**
 * Docker-related operations.
 */

const fs = require("fs");
const request = require("request-promise");
const path = require("path");
const tar = require("tar");

const logger = require("./logger");

const dockerUrl = "http://unix:/var/run/docker.sock:";

/**
 * Build Docker Image by Using the `Dockerfile` from Submission
 * @param {String} submissionPath
 * @param {String} submissionId
 * @param {String} imageTag The image tag
 */
module.exports.buildDockerImage = async (
  submissionId,
  cwdPath,
  dockerfilePath,
  imageTag,
  logPath
) => {
  try {
    // BUILD DOCKER IMAGE
    logger.info(`Docker Image Creation Started for ${submissionId}`);

    const files = fs.readdirSync(cwdPath);

    logger.info("Creating Tar ball of Dockerfile");

    tar.c(
      {
        gzip: true,
        cwd: cwdPath,
        file: dockerfilePath,
        sync: true,
      },
      files
    );

    const headerOptions = {
      headers: {
        "Content-Type": "application/tar",
        host: null,
      },
      body: fs.createReadStream(dockerfilePath),
      encoding: null,
    };

    logger.info("Calling Docker API for creating Image");
    await request
      .post(
        dockerUrl + "/build?t=" + imageTag + "&nocache=true&forcerm=true",
        headerOptions
      )
      .then(function (res) {
        const buffer = Buffer.from(res, "utf8");
        fs.writeFileSync(logPath, buffer);
        logger.info("Docker Image has been created successfully");
        return true;
      })
      .catch(function (err) {
        throw err;
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while building docker image ${error}`);
  }
};

/**
 * Delete Docker Image
 * @param {string} imageName
 */
module.exports.deleteDockerImage = async (imageName) => {
  try {
    // DELETE DOCKER IMAGE
    logger.info(`Delete Docker Image - ${imageName}`);

    const headerOptions = {
      headers: {
        "Content-Type": "application/json",
        host: null,
      },
    };

    await request
      .delete(dockerUrl + "/images/" + imageName, headerOptions)
      .then(function (res) {
        logger.info(`Docker Image (${imageName}) Deleted Successfully`);
        return true;
      })
      .catch(function (err) {
        throw err;
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while deleting docker image ${error}`);
  }
};

/**
 * Create container using Tester Image and mapping the `prediction` and `ground truth` data
 * @param {string} submissionPath Path for downloaded submission on host machine
 * @param {string} submissionId Submission ID
 * @returns {string} Container ID
 */
module.exports.createContainer = async (
  submissionId,
  imageName,
  submissionPath,
  mountPath,
  testCommand,
  runner, // solution or tester
  gpuFlag = "false",
  containerName,
  volumesFrom = [],
  links = []
) => {
  try {
    logger.info(
      `Docker Container Creation Started for ${submissionId} with name ${containerName}`
    );

    const binds = mountPath ? [eval(mountPath)] : undefined;

    const headerOptions = {
      headers: {
        "Content-Type": "application/json",
        host: null,
      },
      json: {
        Image: imageName,
        HostConfig: {
          Binds: binds,
          NetworkDisabled: true,
          ReadonlyRootfs: false,
          VolumesFrom: volumesFrom,
          Links: links,
        },
        Cmd: testCommand,
        Tty: true,
      },
    };

    return await request
      .post(
        `${dockerUrl}/containers/create?name=${containerName}`,
        headerOptions
      )
      .then(function (res) {
        logger.info(
          `Docker Container (${res.Id}) Creation Completed for ${submissionId} with name ${containerName}`
        );
        return res.Id;
      })
      .catch(function (err) {
        throw err;
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while creating docker container ${error}`);
  }
};

/**
 * Execute (Start + Run) testing process inside container to match `prediction` and `ground truth` data
 * @param {string} containerID
 * @param {[string]} testingCommand String array of testing command
 * @returns {number} Score of the submission
 */
module.exports.executeSubmission = async (
  containerID,
  blockUntilStop = true
) => {
  try {
    // START CONTAINER
    logger.info(`Starting Docker Container ${containerID}`);
    await request
      .post(dockerUrl + "/containers/" + containerID + "/start", {
        headers: {
          host: null,
        },
      })
      .then(function (res) {
        logger.info(`Docker Container Started ${containerID}`);
        return true;
      })
      .catch(function (err) {
        throw err;
      });

    if (blockUntilStop) {
      await request
        .post(dockerUrl + "/containers/" + containerID + "/wait", {
          headers: {
            host: null,
          },
        })
        .then(function (res) {
          const statusCode = JSON.parse(res).StatusCode;
          if (statusCode === 0) return true;
          else Error(`Execution completed with error code ${statusCode}`);
        })
        .catch(function (err) {
          throw err;
        });
    }
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while executing submission ${error}`);
  }
};

/**
 * Stop and Delete Container
 * @param {string} containerId
 */
module.exports.killContainer = async (containerId) => {
  try {
    const headerOptions = {
      headers: {
        host: null,
      },
    };

    // DELETE CONTAINER
    logger.info(`Deleting Container ${containerId}`);
    await request
      .delete(
        dockerUrl + "/containers/" + containerId + "?v=true&force=true",
        headerOptions
      )
      .then(function (res) {
        logger.info(`Container Deleted ${containerId}`);
        return true;
      })
      .catch(function (err) {
        logger.debug(`Logging error ${err}`);
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while killing docker container ${error}`);
  }
};

/**
 * Stop and Delete Container
 * @param {string} containerId
 */
module.exports.getContainerLog = async (
  submissionPath,
  containerId,
  logFileName
) => {
  try {
    const headerOptions = {
      headers: {
        host: null,
      },
    };

    // GET CONTAINER LOG
    logger.info(`Getting Logs for Container ${containerId}`);
    await request
      .get(
        dockerUrl +
          "/containers/" +
          containerId +
          "/logs?&stderr=true&stdout=true&timestamps=true",
        headerOptions
      )
      .then(function (res) {
        const buffer = Buffer.from(res, "utf8");
        fs.writeFileSync(
          path.join(`${submissionPath}/artifacts/private/`, logFileName),
          buffer
        );
        return true;
      })
      .catch(function (err) {
        throw err;
      });
  } catch (error) {
    logger.error(error);
    throw new Error(`Error while getting logs from docker container ${error}`);
  }
};
