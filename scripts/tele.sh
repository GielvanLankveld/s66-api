#!/usr/bin/env bash

if type minikube 2> /dev/null; then
  eval $(minikube docker-env -p s66 -u)
fi

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

# Build libraries and create mount string
source ${ROOT_PATH}/scripts/build.sh

# Inject project in local cluster
telepresence \
  --swap-deployment api \
  --docker-run \
    -v $ROOT_PATH/src:/usr/src/app/src \
    api:latest \
    npm run start:dev