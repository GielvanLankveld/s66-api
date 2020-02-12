#!/bin/bash

if type minikube 2> /dev/null; then
  eval $(minikube docker-env -p s66)
fi

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

helm upgrade --install api $ROOT_PATH/k8s/api -f $ROOT_PATH/k8s/values-dev.yaml