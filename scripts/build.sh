#!/bin/bash

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

docker_name="api"

LATEST_IMAGE_NAME=$docker_name:latest
NEW_IMAGE_NAME=$docker_name:temp

echo "Building image..."

docker build $ROOT_PATH -t $NEW_IMAGE_NAME

LATEST_DOCKER_ID=$(docker images --no-trunc -q ${LATEST_IMAGE_NAME})
NEW_DOCKER_ID=$(docker inspect --format {{.Id}} ${NEW_IMAGE_NAME})

if [ "$LATEST_DOCKER_ID" != "$NEW_DOCKER_ID" ]; then
    docker tag $NEW_IMAGE_NAME $docker_name:${NEW_DOCKER_ID:7:16}
    docker tag $NEW_IMAGE_NAME $docker_name:latest
    echo "Image changed, tagged: " ${NEW_DOCKER_ID:7:16}
else
    docker tag $NEW_IMAGE_NAME $docker_name:${NEW_DOCKER_ID:7:16}
    docker tag $NEW_IMAGE_NAME $docker_name:latest
    echo "Nothing changed, tagged: " ${NEW_DOCKER_ID:7:16}
fi