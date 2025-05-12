"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const CicBoystownProject = require("../lib/cic-boystown-project-stack");
describe('CicBoystownProject Stack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new cdk.App();
        stack = new CicBoystownProject.CicBoystownProjectStack(app, 'MyTestStack');
        template = assertions_1.Template.fromStack(stack);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ljLWJveXN0b3duLXByb2plY3QudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNpYy1ib3lzdG93bi1wcm9qZWN0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFDbkMsdURBQWtEO0FBQ2xELHdFQUF3RTtBQUV4RSxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO0lBQ3hDLElBQUksR0FBWSxDQUFDO0lBQ2pCLElBQUksS0FBaUQsQ0FBQztJQUN0RCxJQUFJLFFBQWtCLENBQUM7SUFFdkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixLQUFLLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDM0UsUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUNsQyxpQ0FBaUM7UUFDakMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVwRCwyQkFBMkI7UUFDM0IsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixFQUFFO1lBQ3JELFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxhQUFhLEVBQUUsWUFBWTtvQkFDM0IsT0FBTyxFQUFFLE1BQU07aUJBQ2hCO2dCQUNEO29CQUNFLGFBQWEsRUFBRSxVQUFVO29CQUN6QixPQUFPLEVBQUUsT0FBTztpQkFDakI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUNsQyxRQUFRLENBQUMscUJBQXFCLENBQUMsc0JBQXNCLEVBQUU7WUFDckQsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLFNBQVMsRUFBRSxtQkFBbUI7aUJBQy9CO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsNEJBQTRCO1FBQzVCLFFBQVEsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFL0Msa0NBQWtDO1FBQ2xDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRTtZQUNoRCw4QkFBOEIsRUFBRTtnQkFDOUIsZUFBZSxFQUFFLElBQUk7YUFDdEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsd0NBQXdDO1FBQ3hDLFFBQVEsQ0FBQyxlQUFlLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0UsUUFBUSxDQUFDLGVBQWUsQ0FBQyw0Q0FBNEMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBDaWNCb3lzdG93blByb2plY3QgZnJvbSAnLi4vbGliL2NpYy1ib3lzdG93bi1wcm9qZWN0LXN0YWNrJztcblxuZGVzY3JpYmUoJ0NpY0JveXN0b3duUHJvamVjdCBTdGFjaycsICgpID0+IHtcbiAgbGV0IGFwcDogY2RrLkFwcDtcbiAgbGV0IHN0YWNrOiBDaWNCb3lzdG93blByb2plY3QuQ2ljQm95c3Rvd25Qcm9qZWN0U3RhY2s7XG4gIGxldCB0ZW1wbGF0ZTogVGVtcGxhdGU7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBzdGFjayA9IG5ldyBDaWNCb3lzdG93blByb2plY3QuQ2ljQm95c3Rvd25Qcm9qZWN0U3RhY2soYXBwLCAnTXlUZXN0U3RhY2snKTtcbiAgICB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gIH0pO1xuXG4gIHRlc3QoJ0R5bmFtb0RCIFRhYmxlIENyZWF0ZWQnLCAoKSA9PiB7XG4gICAgLy8gQ2hlY2sgaWYgRHluYW1vREIgdGFibGUgZXhpc3RzXG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkR5bmFtb0RCOjpUYWJsZScsIDEpO1xuICAgIFxuICAgIC8vIENoZWNrIGZvciBrZXkgcHJvcGVydGllc1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpEeW5hbW9EQjo6VGFibGUnLCB7XG4gICAgICBLZXlTY2hlbWE6IFtcbiAgICAgICAge1xuICAgICAgICAgIEF0dHJpYnV0ZU5hbWU6ICdyZXNvdXJjZUlkJyxcbiAgICAgICAgICBLZXlUeXBlOiAnSEFTSCdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIEF0dHJpYnV0ZU5hbWU6ICdsb2NhdGlvbicsXG4gICAgICAgICAgS2V5VHlwZTogJ1JBTkdFJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0R5bmFtb0RCIFRhYmxlIEhhcyBHU0knLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkR5bmFtb0RCOjpUYWJsZScsIHtcbiAgICAgIEdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIEluZGV4TmFtZTogJ1Jlc291cmNlVHlwZUluZGV4J1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ1MzIEJ1Y2tldCBDcmVhdGVkJywgKCkgPT4ge1xuICAgIC8vIENoZWNrIGlmIFMzIGJ1Y2tldCBleGlzdHNcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIDEpO1xuICAgIFxuICAgIC8vIENoZWNrIGZvciBwdWJsaWMgYWNjZXNzIGJsb2NrZWRcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgIFB1YmxpY0FjY2Vzc0Jsb2NrQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBCbG9ja1B1YmxpY0FjbHM6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnRHluYW1vREIgQXV0byBTY2FsaW5nIENvbmZpZ3VyZWQnLCAoKSA9PiB7XG4gICAgLy8gQ2hlY2sgaWYgYXV0byBzY2FsaW5nIHJlc291cmNlcyBleGlzdFxuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpBcHBsaWNhdGlvbkF1dG9TY2FsaW5nOjpTY2FsYWJsZVRhcmdldCcsIDIpO1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpBcHBsaWNhdGlvbkF1dG9TY2FsaW5nOjpTY2FsaW5nUG9saWN5JywgMik7XG4gIH0pO1xufSk7Il19