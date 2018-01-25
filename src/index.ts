import * as AWS from "aws-sdk";
import { buildDbConnectors, DbConnectors } from "./buildDbConnectors";
import commands from "./commands";
import { Seeder } from "./seeder";
import { ServerlessDynamoDbOptions, ServerlessInstance, ServerlessLog } from "./serverless-types";

export default class ServerlessDynamodbLocal {
  public commands = commands;
  public hooks: { [key: string]: () => void };

  private serverless: ServerlessInstance;
  private serverlessLog: ServerlessLog;
  private config: ServerlessDynamoDbOptions;
  private db: DbConnectors;

  constructor(serverless: ServerlessInstance) {
    this.serverless = serverless;
    this.serverlessLog = serverless.cli.log.bind(serverless.cli);
    this.config = (this.serverless.service.custom && this.serverless.service.custom.dynamodb) || {};
    this.db = buildDbConnectors(this.config);
    this.hooks = {
      "before:offline:start:init": this.setUpHandler,
      "dynamodb:migrate:migrateHandler": this.migrateHandler,
      "dynamodb:seed:seedHandler": this.seedHandler,
      "dynamodb:start:setUpHandler": this.setUpHandler,
    };
  }

  public setUpHandler = async () => {
    await this.migrateHandler();
    await this.seedHandler();
  };

  public migrateHandler = async () => {
    if (!this.config.migrate) {
      this.serverlessLog("DynamoDB - Migrations are not enabled. Won't create any tables.");
      return;
    }

    return Promise.all(this.getTables().map(async (table) => await this.createTable(table)));
  };

  public seedHandler = async () => {
    if (!this.config.seeds) {
      this.serverlessLog("DynamoDB - No seeding defined. Skipping data seeding.");
      return;
    }

    return new Seeder(this.db, this.serverlessLog).seed(this.config.seeds);
  };

  private getTables(): AWS.DynamoDB.CreateTableInput[] {
    const { Resources: resources } = this.serverless.service.resources;
    return Object.keys(resources)
      .map((resourceName) => resources[resourceName])
      .filter((resource) => resource.Type === "AWS::DynamoDB::Table")
      .map((resource) => resource.Properties as AWS.DynamoDB.CreateTableInput);
  }

  private async createTable(migration: AWS.DynamoDB.CreateTableInput) {
    if (migration.StreamSpecification && migration.StreamSpecification.StreamViewType) {
      migration.StreamSpecification.StreamEnabled = true;
    }

    try {
      await this.db.raw.createTable(migration).promise();
      this.serverlessLog(`DynamoDB - Created table ${migration.TableName}`);
    } catch (err) {
      if (err.name === "ResourceInUseException") {
        this.serverlessLog(`DynamoDB - Warn - Table ${migration.TableName} already exists`);
        return;
      }

      this.serverlessLog("DynamoDB - Error - ", err);
      throw err;
    }
  }
}

module.exports = ServerlessDynamodbLocal;
