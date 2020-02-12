#!/bin/bash

# Get root path
ROOT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )/..

DB_USERNAME=$(kubectl get secret mysql-auth -o jsonpath='{.data.\username}' | base64 -d)
DB_PASSWORD=$(kubectl get secret mysql-auth -o jsonpath='{.data.\password}' | base64 -d)

kubectl exec -it mysql-0 mysql -- -u$DB_USERNAME -p$DB_PASSWORD