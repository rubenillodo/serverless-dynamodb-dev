import * as AWS from "aws-sdk";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { DbConnectors } from "./buildDbConnectors";
import { ServerlessDynamoDbSeedSources, ServerlessLog } from "./serverless-types";

export class Seeder {
  // DynamoDB has a 25 item limit in batch requests
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
  private static MAX_MIGRATION_CHUNK = 25;

  private db: DbConnectors;
  private serverlessLog: ServerlessLog;

  constructor(db: DbConnectors, serverlessLog: ServerlessLog) {
    this.db = db;
    this.serverlessLog = serverlessLog;
  }

  public seed = async (seedsConfig: ServerlessDynamoDbSeedSources[]) => {
    return Promise.all(
      seedsConfig.map(async (seedsConfigForTable) => {
        if (!seedsConfigForTable.table) {
          throw new Error('"table" property is missing somewhere in the seeding settings');
        }

        const seeds = await this.loadSeeds(seedsConfigForTable.sources || []);
        return await this.writeSeeds(seedsConfigForTable.table, seeds);
      }),
    );
  };

  private loadSeeds = async (sources: string[], cwd = process.cwd()): Promise<any[]> => {
    const locations = sources.map((source) => path.join(cwd, source));
    const seedArrays = await Promise.all(
      locations.map(async (location) => {
        if (!await fs.pathExists(location)) {
          throw new Error("File " + location + " does not exist");
        }

        const seeds = await JSON.parse(await fs.readFile(location, { encoding: "utf-8" }));
        this.serverlessLog(`DynamoDB - Loaded seeds from ${location}`);
        return seeds;
      }),
    );

    return _.flatten(seedArrays);
  };

  private writeSeeds = async (tableName: string, seeds: any[]) => {
    if (seeds.length <= 0) return;
    const seedChunks = _.chunk(seeds, Seeder.MAX_MIGRATION_CHUNK);
    return Promise.all(
      seedChunks.map(async (chunk) => {
        await this.writeSeedBatchWithRetry(tableName, chunk);
        this.serverlessLog(`DynamoDB - Wrote seeds for ${tableName}`);
      }),
    );
  };

  private writeSeedBatchWithRetry = async (
    tableName,
    seeds,
  ): Promise<AWS.DynamoDB.DocumentClient.BatchWriteItemOutput> => {
    const execute = async (interval) => {
      return new Promise<AWS.DynamoDB.DocumentClient.BatchWriteItemOutput>((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(this.writeSeedBatch(tableName, seeds));
          } catch (err) {
            if (err.code === "ResourceNotFoundException" && interval <= 5000) {
              resolve(execute(interval + 1000));
            } else {
              reject(err);
            }
          }
        }, interval);
      });
    };

    return await execute(0);
  };

  private writeSeedBatch = async (tableName, seeds): Promise<AWS.DynamoDB.DocumentClient.BatchWriteItemOutput> => {
    return this.db.doc
      .batchWrite({
        RequestItems: {
          [tableName]: seeds.map((seed) => ({
            PutRequest: {
              Item: seed,
            },
          })),
        },
      })
      .promise();
  };
}
