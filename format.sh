#!/bin/bash
set -e
prettier --write src/*.json src/*.js

# Error if git working dir is dirty after format.
out=$(git status -uno --porcelain --ignore-submodules)
if [[ $out != "" ]]; then 
  echo "$out"
  exit 1
fi
