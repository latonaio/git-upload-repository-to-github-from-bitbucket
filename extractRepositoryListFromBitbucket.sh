#!/bin/bash

jq -r '[ .values[].full_name | split("/") | .[1] ]' json/extractRepositoryListFromBitbucket.json > output/export.json
