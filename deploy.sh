#!/bin/bash

set -ev

aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket deno.land  \
  --s3-prefix cloudformation_package/  \
  --output-template-file packaged.yaml

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name denoland6
