#!/bin/sh
set -ev
node src/test.js
aws cloudformation validate-template --template-body "`cat template.yaml`"
