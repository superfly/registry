#!/bin/bash

set -ev

./test.sh

aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket deno.land  \
  --s3-prefix cloudformation_package \
  --output-template-file packaged.yaml

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name denoland0 \
  --tags stack=denoland0 \
  --capabilities CAPABILITY_IAM

# aws cloudformation describe-stack-events --stack-name denoland0 | grep Err
# aws cloudformation delete-stack --stack-name denoland0
# aws cloudformation cancel-update-stack --stack-name denoland0
