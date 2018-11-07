#!/bin/bash

sam package --template-file template.yaml \
  --output-template-file packaged.yaml --s3-bucket deno.land

#aws cloudformation deploy \
#  --template-file /Users/rld/src/registry/packaged.yaml \
#  --stack-name denoland3

sam deploy --template-file packaged.yaml \
  --stack-name denoland4  --capabilities CAPABILITY_IAM

aws s3 sync build/website s3://deno.land 
