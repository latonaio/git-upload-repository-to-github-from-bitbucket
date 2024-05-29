#!/bin/bash

source .env

githubUserName=$GITHUB_USERNAME
githubToken=$GITHUB_TOKEN

EXCLUDE=($(jq -r '.[]' json/excludeRepositories.json))

REPO_NAMES=($(jq -r '.[]' json/createGithubRepository.json))

for repositoryName in "${REPO_NAMES[@]}"; do
  if [[ " ${EXCLUDE[*]} " =~ ${repositoryName} ]]; then
    echo "リポジトリ ${repositoryName} は除外されました。"
    continue
  fi

  response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/$githubUserName/$repositoryName")

  if [ "$response" = "404" ]; then
    echo "リポジトリ $repositoryName が存在しません。作成します..."

    readme_content="Project: $repositoryName\n\nThis is the README for $repositoryName."

    license_content=$(curl -s https://api.github.com/licenses/mit | jq -r '.body')

    curl -s -H "Authorization: token $githubToken" -d "{\"name\":\"$repositoryName\", \"description\":\"\", \"private\":false, \"auto_init\":true, \"license_template\":\"mit\", \"readme_template\":\"default\", \"license_template_data\":{\"name\":\"$repositoryName\"}, \"readme_template_data\":{\"name\":\"$repositoryName\"}}" "https://api.github.com/orgs/$githubUserName/repos"

    curl -s -H "Authorization: token $githubToken" -d "{\"message\":\"Initial commit\", \"content\":\"$(echo -n "$readme_content" | base64)\"}" "https://api.github.com/repos/$githubUserName/$repositoryName/contents/README.md"

    echo "リポジトリ $repositoryName が作成されました。"
  else
    echo "リポジトリ $repositoryName はすでに存在します。"
  fi
done
