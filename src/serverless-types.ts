export type ServerlessLog = (str: string, ...args: any[]) => void;

export interface ServerlessInstance {
  cli: {
    log: ServerlessLog;
  };
  service: {
    resources: {
      Resources: {
        [name: string]: {
          Type: string;
          Properties: { [prop: string]: any };
        };
      };
    };
    custom?: {
      dynamodb?: ServerlessDynamoDbOptions;
    };
  };
}

export interface ServerlessDynamoDbOptions {
  host?: string;
  port?: number;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  migrate?: boolean;
  seeds?: ServerlessDynamoDbSeedSources[] | false;
}

export interface ServerlessDynamoDbSeedSources {
  table: string;
  sources: string[];
}
