#!/usr/bin/env bash

eval $(minikube docker-env -p s66 -u)

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