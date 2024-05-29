# git-upload-repository-to-github--from-bitbucket

## 事前準備
- jsonディレクトリにある各.sampleファイルからjsonファイルを作成する
- .envにgithub tokenを設定する

## githubのリポジトリを作成
```
bash createGithubRepository.sh
```

## bitbucketとgithubのリポジトリを同期
```
npm run execute
```

## githubへコミット
```
bash continuousExecutionCommitAndPushToGithubRepository.sh
```
