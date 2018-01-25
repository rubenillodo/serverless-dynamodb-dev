export default {
  "dynamodb-dev": {
    commands: {
      migrate: {
        lifecycleEvents: ["migrateHandler"],
        usage: "Creates local DynamoDB tables from the current Serverless configuration",
      },
      seed: {
        lifecycleEvents: ["seedHandler"],
        usage: "Seeds local DynamoDB tables with data",
      },
    },
  },
};
