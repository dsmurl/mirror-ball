import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { REGION } from "./config.ts";

export const s3 = new S3Client({ region: REGION });
export const ddb = new DynamoDBClient({ region: REGION });
export const doc = DynamoDBDocumentClient.from(ddb);
