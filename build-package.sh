#!/bin/bash

ENV=$1

if [ -z $ENV ];
then
    echo "error: no version specified.\nusage: build-package.sh ENV"
    exit 1
fi

VER=`date "+%Y%m%d%H%M"`

automated_testing_processor_cdpackage() {
    AWS_CD_PACKAGE_NAME="${APP_NAME}-${VER}.zip"
    PACKAGE_LOCATION="${APP_NAME}"

    rm -rf $PACKAGE_LOCATION
    mkdir $PACKAGE_LOCATION

    cp .env $PACKAGE_LOCATION/
    cp -r scripts $PACKAGE_LOCATION/
    cp -r src node_modules config $PACKAGE_LOCATION/

    zip -r $AWS_CD_PACKAGE_NAME $PACKAGE_LOCATION/
}

automated_testing_processor_cdpackage
VER1=$VER
echo export VER="$VER1" >> "$BASH_ENV"