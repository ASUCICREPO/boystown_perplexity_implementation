
/**
 * Lambda function to search resources in the Boys Town database
 * 
 * Query parameters:
 * - resourceType: Type of resource (e.g., "alcohol_support")
 * - location: Location of the resource (e.g., "Chandler, AZ")
 * - availableNow: If "true", filter resources that are currently open
 */

// lambda/search-resources/src/index.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Lambda function to search resources in the Boys Town database
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const queryParams = event.queryStringParameters || {};
    const { resourceType, location, availableNow } = queryParams;
    
    if (!resourceType && !location) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'Please provide at least resourceType or location parameter' 
        })
      };
    }
    
    let params = {
      TableName: process.env.RESOURCES_TABLE
    };
    
    // If resourceType is provided, use the GSI
    if (resourceType) {
      params.IndexName = process.env.RESOURCE_TYPE_INDEX;
      params.KeyConditionExpression = 'resourceType = :resourceType';
      params.ExpressionAttributeValues = {
        ':resourceType': resourceType
      };
      
      // If location is also provided, add it to the query
      if (location) {
        params.KeyConditionExpression += ' AND begins_with(location, :location)';
        params.ExpressionAttributeValues[':location'] = location;
      }
      
      console.log('Executing query with params:', JSON.stringify(params, null, 2));
      const data = await dynamodb.query(params).promise();
      
      let results = data.Items;
      
      // Filter for available resources if requested
      if (availableNow === 'true' && results.length > 0) {
        results = filterAvailableResources(results);
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(results)
      };
    } 
    // If only location is provided
    else if (location) {
      // Need to scan with a filter since location is a sort key
      params.FilterExpression = 'begins_with(location, :location)';
      params.ExpressionAttributeValues = {
        ':location': location
      };
      
      console.log('Executing scan with params:', JSON.stringify(params, null, 2));
      const data = await dynamodb.scan(params).promise();
      
      let results = data.Items;
      
      // Filter for available resources if requested
      if (availableNow === 'true' && results.length > 0) {
        results = filterAvailableResources(results);
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(results)
      };
    }
  } catch (error) {
    console.error('Error searching resources:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Error searching resources',
        error: error.message 
      })
    };
  }
};

/**
 * Filter resources that are currently available based on hours
 * @param {Array} resources - List of resources
 * @returns {Array} - Filtered list of currently available resources
 */
function filterAvailableResources(resources) {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const time = now.getHours() * 100 + now.getMinutes();
  
  return resources.filter(resource => {
    if (!resource.hours) return true;
    
    // Simple hours parsing, can be enhanced for complex hour formats
    const hoursString = resource.hours.toLowerCase();
    if (hoursString.includes('24/7') || hoursString.includes('all day')) {
      return true;
    }
    
    // Parse hours for current day
    const dayMatch = hoursString.match(new RegExp(`${day}[^\\d]*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\s*-\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?`, 'i'));
    
    if (dayMatch) {
      const [_, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = dayMatch;
      
      // Convert to 24-hour format
      let startTime = parseInt(startHour) * 100 + (startMin ? parseInt(startMin) : 0);
      if (startAmPm && startAmPm.toLowerCase() === 'pm' && startHour !== '12') {
        startTime += 1200;
      } else if (startAmPm && startAmPm.toLowerCase() === 'am' && startHour === '12') {
        startTime -= 1200;
      }
      
      let endTime = parseInt(endHour) * 100 + (endMin ? parseInt(endMin) : 0);
      if (endAmPm && endAmPm.toLowerCase() === 'pm' && endHour !== '12') {
        endTime += 1200;
      } else if (endAmPm && endAmPm.toLowerCase() === 'am' && endHour === '12') {
        endTime -= 1200;
      }
      
      return time >= startTime && time <= endTime;
    }
    
    // If we can't parse the hours format, include it by default
    return true;
  });
}