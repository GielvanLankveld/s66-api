#!/bin/bash

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

COMMAND=$@

kubectl port-forward $(kubectl get pods | grep -o "^mysql[a-z0-9\-]\+") 3306 &
PORT_FORWARD_PID=$!

npm run typeorm --prefix $ROOT_PATH -- $COMMAND

kill $PORT_FORWARD_PID