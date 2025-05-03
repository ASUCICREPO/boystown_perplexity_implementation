import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CicBoystownProject from '../lib/cic-boystown-project-stack';

describe('CicBoystownProject Stack', () => {
  let app: cdk.App;
  let stack: CicBoystownProject.CicBoystownProjectStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CicBoystownProject.CicBoystownProjectStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('DynamoDB Table Created', () => {
    // Check if DynamoDB table exists
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    
    // Check for key properties
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'resourceId',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'location',
          KeyType: 'RANGE'
        }
      ]
    });
  });

  test('DynamoDB Table Has GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ResourceTypeIndex'
        }
      ]
    });
  });

  test('S3 Bucket Created', () => {
    // Check if S3 bucket exists
    template.resourceCountIs('AWS::S3::Bucket', 1);
    
    // Check for public access blocked
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true
      }
    });
  });

  test('DynamoDB Auto Scaling Configured', () => {
    // Check if auto scaling resources exist
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
  });
});