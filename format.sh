#!/bin/bash
set -e
prettier --write src/*.json src/*.js

out=$(git status -uno --porcelain --ignore-submodules)
echo "$out"
if [[ $out != "" ]]; then 
  exit 1
fi
