

/**
 * Lambda function to get a specific resource by ID
 * 
 * Path parameters:
 * - resourceId: ID of the resource to retrieve
 * 
 * Query parameters:
 * - location: Location of the resource (required because it's part of the composite key)
 */
// lambda/get-resource-by-id/src/index.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to get a specific resource by ID
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const resourceId = event.pathParameters?.resourceId;
    const location = event.queryStringParameters?.location;
    
    if (!resourceId || !location) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Both resourceId path parameter and location query parameter are required' 
        })
      };
    }
    
    const params = {
      TableName: process.env.RESOURCES_TABLE,
      Key: {
        resourceId: resourceId,
        location: location
      }
    };
    
    console.log('Getting item from DynamoDB:', JSON.stringify(params, null, 2));
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Resource not found' 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error getting resource:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Error getting resource',
        error: error.message 
      })
    };
  }
};