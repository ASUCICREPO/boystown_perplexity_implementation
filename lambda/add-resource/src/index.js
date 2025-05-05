

/**
 * Lambda function to add a resource to the Boys Town database
 * 
 * Expected request format:
 * {
 *   "resourceId": "optional-will-be-generated-if-not-provided",
 *   "resourceType": "alcohol_support", // Required
 *   "location": "Chandler, AZ", // Required
 *   "name": "Resource Name", // Required
 *   "description": "Description of the resource",
 *   "address": "123 Main St, Chandler, AZ",
 *   "phoneNumber": "555-123-4567",
 *   "email": "contact@resource.org",
 *   "website": "https://www.resource.org",
 *   "hours": "Monday-Friday 9am-5pm",
 *   "ttlDays": 365 // Optional - days until this resource expires
 * }
 */
// lambda/add-resource/src/index.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to add a resource to the Boys Town database
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body);
    
    // Required fields validation
    if (!body.resourceType || !body.location || !body.name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Missing required fields: resourceType, location, and name are required' 
        })
      };
    }
    
    // Create a unique ID if not provided
    if (!body.resourceId) {
      body.resourceId = `resource_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Add metadata
    body.createdAt = new Date().toISOString();
    body.updatedAt = body.createdAt;
    
    // If TTL is specified, convert to epoch time
    if (body.ttlDays) {
      const ttlDate = new Date();
      ttlDate.setDate(ttlDate.getDate() + parseInt(body.ttlDays));
      body.ttl = Math.floor(ttlDate.getTime() / 1000);
      delete body.ttlDays;
    }
    
    // Save to DynamoDB
    const params = {
      TableName: process.env.RESOURCES_TABLE,
      Item: body
    };
    
    console.log('Saving item to DynamoDB:', JSON.stringify(params, null, 2));
    await dynamodb.put(params).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Resource saved successfully',
        resourceId: body.resourceId 
      })
    };
  } catch (error) {
    console.error('Error saving resource:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Error saving resource',
        error: error.message 
      })
    };
  }
};