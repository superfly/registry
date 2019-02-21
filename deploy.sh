#!/bin/bash

set -ev

#./test.sh

# If travis doesn't have awscli, install it.
if [[ ! `aws --version` ]]; then
  pip install awscli aws-sam-cli -q
fi

print_errors() {
  aws cloudformation describe-stack-events --stack-name denoland1 \
    | grep -i status | head -20
  false
}

aws cloudformation validate-template --template-body "`cat template.yaml`"

aws cloudformation package \
  --template-file template.yaml \
  --output-template-file packaged.yaml \
  --s3-bucket deno.land  \
  --s3-prefix cloudformation_package

aws cloudformation wait stack-update-complete || true

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name denoland1 \
  --capabilities CAPABILITY_IAM \
  || print_errors

aws cloudfront create-invalidation --distribution-id E2HNK8Z3X3JDVG  --paths "/*"

# aws cloudformation delete-stack --stack-name denoland1
# aws cloudformation cancel-update-stack --stack-name denoland1

#sam build
#sam package --s3-bucket deno.land  --output-template-file packaged.yaml

#sam deploy --stack-name denoland1 --template-file packaged.yaml \
#  || print_errors
#sam publish -t packaged.yaml --region us-east-1
