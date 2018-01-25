import * as AWS from "aws-sdk";

export interface Params {
  host?: string;
  port?: number;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface DbConnectors {
  doc: AWS.DynamoDB.DocumentClient;
  raw: AWS.DynamoDB;
}

export const buildDbConnectors = (config: Params) => {
  const dynamoOptions = {
    accessKeyId: config.accessKeyId || "MOCK_ACCESS_KEY_ID",
    endpoint: `http://${config.host || "localhost"}:${config.port || 8000}`,
    region: config.region || "localhost",
    secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
  };

  return {
    doc: new AWS.DynamoDB.DocumentClient(dynamoOptions),
    raw: new AWS.DynamoDB(dynamoOptions),
  };
};
