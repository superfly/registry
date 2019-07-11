#!/bin/bash
set -e
cd src

npx prettier --write *.json *.js

# Error if git working dir is dirty after format.
out=$(git status -uno --porcelain --ignore-submodules)
if [[ $out != "" ]]; then
  echo "$out"
  exit 1
fi
