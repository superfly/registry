#!/bin/sh
set -ev
node src/test.js
#travis lint -x
aws cloudformation validate-template --template-body "`cat template.yaml`"
#sam validate

