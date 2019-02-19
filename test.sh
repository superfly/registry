#!/bin/sh
set -ev
aws cloudformation validate-template --template-body "`cat template.yaml`"
