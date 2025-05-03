// lib/cic-boystown-project-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

export class CicBoystownProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table
    const resourcesTable = new dynamodb.Table(this, 'ResourcesTable', {
      partitionKey: { name: 'resourceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'location', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Auto-scaling for read and write capacity in DynamoDB
    const readScaling = resourcesTable.autoScaleReadCapacity({
      minCapacity: 5,
      maxCapacity: 100
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = resourcesTable.autoScaleWriteCapacity({
      minCapacity: 5,
      maxCapacity: 100
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    //add GSI for resourceType
    resourcesTable.addGlobalSecondaryIndex({
      indexName: 'ResourceTypeIndex',
      partitionKey: { name: 'resourceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'location', type: dynamodb.AttributeType.STRING },
    });

    //S3 BUCKET
    const resourceMetadataBucket = new s3.Bucket(this, 'ResourceMetadataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Parameter for Perplexity API key
    const perplexityApiKeyParamName = '/cic/perplexity-api-key';


    // Add Resource Lambda
    const addResourceLambda = new lambda.Function(this, 'AddResourceFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/add-resource')),
      environment: {
        RESOURCES_TABLE: resourcesTable.tableName,
        METADATA_BUCKET: resourceMetadataBucket.bucketName
      },
      timeout: cdk.Duration.seconds(10)
    });

    // Search Resources Lambda
    const searchResourcesLambda = new lambda.Function(this, 'SearchResourcesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/search-resources')),
      environment: {
        RESOURCES_TABLE: resourcesTable.tableName,
        RESOURCE_TYPE_INDEX: 'ResourceTypeIndex'
      },
      timeout: cdk.Duration.seconds(10)
    });

    // Get Resource by ID Lambda
    const getResourceByIdLambda = new lambda.Function(this, 'GetResourceByIdFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/get-resource-by-id')),
      environment: {
        RESOURCES_TABLE: resourcesTable.tableName
      },
      timeout: cdk.Duration.seconds(10)
    });

    // Perplexity Search Lambda
    const perplexitySearchLambda = new lambda.Function(this, 'PerplexitySearchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/perplexity-search')),
      environment: {
        RESOURCES_TABLE: resourcesTable.tableName,
        PERPLEXITY_API_KEY_PARAM: perplexityApiKeyParamName // Just use the name string
      },
      timeout: cdk.Duration.seconds(30)
    });

    // Give the Lambda function permission to read the parameter
    perplexitySearchLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${perplexityApiKeyParamName}`],
      effect: iam.Effect.ALLOW
    }));
    // Grant permissions
    resourcesTable.grantReadWriteData(addResourceLambda);
    resourceMetadataBucket.grantReadWrite(addResourceLambda);
    resourcesTable.grantReadData(searchResourcesLambda);
    resourcesTable.grantReadData(getResourceByIdLambda);
    resourcesTable.grantReadWriteData(perplexitySearchLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ResourcesApi', {
      restApiName: 'Boys Town Resources Service',
      description: 'API for managing Boys Town support resources',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    // Create resources
    const resources = api.root.addResource('resources');
    const singleResource = resources.addResource('{resourceId}');
    const externalSearch = api.root.addResource('external-search');

    // Add methods
    resources.addMethod('POST', new apigateway.LambdaIntegration(addResourceLambda));
    resources.addMethod('GET', new apigateway.LambdaIntegration(searchResourcesLambda));
    singleResource.addMethod('GET', new apigateway.LambdaIntegration(getResourceByIdLambda));
    externalSearch.addMethod('GET', new apigateway.LambdaIntegration(perplexitySearchLambda));

    // Output the resource names for reference
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: resourcesTable.tableName,
      description: 'The name of the DynamoDB table for resources',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: resourceMetadataBucket.bucketName,
      description: 'The name of the S3 bucket for resource metadata',
    });

    // Add outputs for the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway'
    });
  }
}