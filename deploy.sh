#!/bin/bash

set -ev

bash test.sh

print_errors() {
  aws cloudformation describe-stack-events --stack-name denoland1 \
    | grep -i status | head -20
  false
}

aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket deno.land  \
  --s3-prefix cloudformation_package \
  --output-template-file packaged.yaml

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name denoland1 \
  --tags stack=denoland1 \
  --capabilities CAPABILITY_IAM || print_errors

# aws cloudformation delete-stack --stack-name denoland1
# aws cloudformation cancel-update-stack --stack-name denoland1
