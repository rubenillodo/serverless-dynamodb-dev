# Serverless DynamoDB Dev

This is a fork of [serverless-dynamodb-local](https://github.com/99xt/serverless-dynamodb-local). It can create and seed tables in your local DynamoDB instance.

This plugin will **not** download, install or start a DynamoDB instance automatically. You can do that quite easily with Docker and Docker Compose. You may have a look at [a sample setup](https://github.com/rubenillodo/serverless-dynamodb-dev-sample) to see everything working together.

## Installation

1. Add the plugin to your project with `npm install --save-dev @rubenillodo/serverless-dynamodb-dev` or `yarn add --dev @rubenillodo/serverless-dynamodb-dev`.
2. In your `serverless.yml`, add the plugin to your plugin list:

```
plugins:
  - serverless-dynamodb-dev
```

3. Also in `serverless.yml`, add the configuration for the plugin:

```
custom:
  dynamodb:
    host: localhost
    port: 8000
    region: localhost
    accessKeyId: "MOCK_ACCESS_KEY_ID"
    secretAccessKey: "MOCK_SECRET_ACCESS_KEY"
    migrate: true
    seeds:
      - table: users
        sources: [./seeds/users.json]
```

## Configuration

| Option            | Default value            | Description                                                                                                   |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `host`            | `localhost`              | Host where your DynamoDB instance is running.                                                                 |
| `port`            | `8000`                   | Port where your DynamoDB instance is running.                                                                 |
| `region`          | `localhost`              | Region (fake) to use when connecting to your DynamoDB.                                                        |
| `accessKeyId`     | `MOCK_ACCESS_KEY_ID`     | Access key ID (fake) to use when connecting to DynamoDB.<br>**NOTE:** Your app needs to use the same one!     |
| `secretAccessKey` | `MOCK_SECRET_ACCESS_KEY` | Secret access key (fake) to use when connecting to DynamoDB.<br>**NOTE:** Your app needs to use the same one! |
| `migrate`         | `false`                  | Tables that do not exist already should be created.                                                           |
| `seeds`           | `false`                  | List of seed files per table name. If none are specified, then seeding will be skipped.                       |
