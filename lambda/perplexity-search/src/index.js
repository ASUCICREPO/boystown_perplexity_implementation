// lambda/perplexity-search/src/index.js
const AWS = require('aws-sdk');
const axios = require('axios');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

/**
 * Lambda function to search for external resources using Perplexity API
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const { resourceType, location } = queryParams;

    if (!resourceType || !location) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Both resourceType and location parameters are required'
        })
      };
    }

    // Get API key from Parameter Store
    const apiKeyParam = await ssm.getParameter({
      Name: process.env.PERPLEXITY_API_KEY_PARAM,
      WithDecryption: true
    }).promise();

    const apiKey = apiKeyParam.Parameter.Value;

    // Build the query for Perplexity
    const userQuery = `Find ${resourceType} resources in ${location}. Include name, address, phone number, hours, and website if available. Format as a JSON array with separate fields.`;

    console.log(`Searching with Perplexity: ${userQuery}`);

    // Call Perplexity Chat Completions API instead of search API
    const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: "sonar", // Using Sonar model which has web search capability
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that finds local support resources. Always format results as a valid JSON array of objects with fields: name, address, phoneNumber, hours, website, and description. Each object should represent one resource."
        },
        {
          role: "user",
          content: userQuery
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Perplexity API response received');

    // Parse the results
    let resources = [];
    try {
      // Extract content from the assistant's response
      const responseContent = perplexityResponse.data.choices[0].message.content;
      console.log('Response content:', responseContent);

      // Look for JSON array in code blocks (```json [...] ```)
      const jsonMatch = responseContent.match(/```json\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        // Extract the JSON content from inside the code block
        resources = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find any JSON array if not in code blocks
        const arrayMatch = responseContent.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          resources = JSON.parse(arrayMatch[0]);
        } else {
          // If no JSON array is found, create a simple object with the full response
          resources = [{
            name: "API response (not JSON formatted)",
            description: responseContent
          }];
        }
      }
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      resources = [{
        name: "Error parsing API response",
        description: perplexityResponse.data?.choices?.[0]?.message?.content || "No content returned"
      }];
    }

    console.log(`Found ${resources.length} resources`);

    // Save each resource to DynamoDB
    const savedResources = [];
    for (const resource of resources) {
      // Skip if the resource doesn't have a name
      if (!resource.name) continue;

      const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const item = {
        resourceId: resourceId,
        resourceType: resourceType,
        location: location,
        name: resource.name,
        address: resource.address || '',
        phoneNumber: resource.phone || resource.phoneNumber || '',
        hours: resource.hours || '',
        website: resource.website || '',
        description: resource.description || '',
        source: 'perplexity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Set TTL to 30 days by default for external resources
        ttl: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
      };

      const params = {
        TableName: process.env.RESOURCES_TABLE,
        Item: item
      };

      await dynamodb.put(params).promise();
      savedResources.push(item);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Found and saved ${savedResources.length} resources`,
        resources: savedResources
      })
    };
  } catch (error) {
    console.error('Error in perplexity search:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error searching for external resources',
        error: error.message
      })
    };
  }
};