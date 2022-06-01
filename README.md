[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://gitlab.com/callmekatootie/tc-automated-tester)

# Topcoder Automated Tester

Currently, the tester supports testing javascript code

You need to set the following environment variables:

```bash
# Auth0 details
AUTH0_URL
AUTH0_AUDIENCE
TOKEN_CACHE_TIME
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
VALID_ISSUERS

# The git repository from which we copy the tests
GIT_REPOSITORY_URL
# The volume to mount in the solution container (which is used eventually by test spec container)
DOCKER_SOLUTION_MOUNT_PATH
# The volume to mount in the test spec container (into which we store the test result json)
DOCKER_TEST_SPEC_MOUNT_PATH

# The git repository access credentials. Leave empty if repository is publicly available
GIT_USERNAME
GIT_TOKEN

# Only challenges under this track will be considered. Default value is 'Automated Testing'
CHALLENGE_SUB_TRACK

# AWS details to store assets (artifacts, logs etc)
AWS_REGION
S3_BUCKET
```

Other values used are defaults

## Assumptions / Workflow

- For below statements, the submission path refers to the `./submissions/{submissionId}/submission` folder
- The submission is downloaded to `code` folder under submission path
  - This folder is expected to contain a Dockerfile and a `src` folder
  - The `src` folder is mounted as a volume to the container created from the image that is built
- Using the `GIT_REPOSITORY_URL` environment variable, the tests are downloaded in to the `tests` folder under submission path
  - This folder is expected to contain a Dockerfile and a `project` folder
  - The Dockerfile will set up Gauge CLI and mount the volumes of the submission container. It also runs a bash script that copies over the contents in the volume `src` (obtained through the submission container) into a `src` folder, that is created inside the `project` folder. Additionally, it also sets up [json-report](https://github.com/getgauge-contrib/json-report) to store the results of the test execution in json
  - The project folder is expected to be created through the `gauge init {template}` command. It sets up the necessary files. You only need to provide your specs and tests, and then commit and store it in gitlab / github
  - The container is created along with a folder in the host filesystem mounted as a volumne. This will be the location where the test results will be stored (the public artifacts folder in the submission path). The tests are then run through `gauge run specs` command
  - The results, located at `reports/json-report/result.json` are then copied back to the host volume

## Test Specification Templates

- For Javascript: [Sample](https://gitlab.com/callmekatootie/gauge-sample-spec-js)
