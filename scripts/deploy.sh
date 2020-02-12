#!/bin/bash

if type minikube 2> /dev/null; then
  eval $(minikube docker-env -p s66)
fi

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

# Build libraries and create mount string
source ${ROOT_PATH}/scripts/build.sh

docker_name="api"
LATEST_IMAGE_NAME=$docker_name:latest
LATEST_DOCKER_ID=$(docker images --no-trunc -q ${LATEST_IMAGE_NAME})

helm upgrade --install api $ROOT_PATH/k8s/api -f $ROOT_PATH/k8s/values-dev.yaml --set image.tag=${LATEST_DOCKER_ID:7:16}

if type minikube 2> /dev/null; then
  eval $(minikube docker-env -p s66 -u)
fi