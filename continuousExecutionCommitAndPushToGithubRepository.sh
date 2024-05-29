#!/bin/bash

EXCLUDE=($(jq -r '.[]' json/excludeRepositories.json))

REPO_NAMES=($(jq -r '.[]' json/continuousExecutionCommitAndPushToGithubRepository.json))

for repositoryName in "${REPO_NAMES[@]}"; do
  if [[ " ${EXCLUDE[*]} " =~ ${repositoryName} ]]; then
    echo "リポジトリ ${repositoryName} は除外されました。"
    continue
  fi

  if [ ! -d "github/${repositoryName}" ]; then
    echo "ディレクトリ github/${repositoryName} が存在しません。スキップします。"
    continue
  fi

  if cd "github/${repositoryName}"; then
    git add . &&
      git commit -m "no message" &&
      git push

    cd ../..
  else
    echo "ディレクトリ github/${repositoryName} に移動できませんでした。"
  fi
done
