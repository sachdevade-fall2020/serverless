const aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();

const env = process.env;

exports.handler = function(event, context) {
    console.log(event.Records[0].Sns.Message);
    
    var snsMessage = JSON.parse(event.Records[0].Sns.Message);
    
    const tableName = env.table_name;
    const sender = env.sender;
    
    var getParams = {
        TableName: tableName,
        FilterExpression: '(email = :email)',
        ExpressionAttributeValues: {
          ':email': {S: snsMessage.email},
        }
    };
    
    const getItem = dynamodb.scan(getParams).promise();
    
    getItem.then(data => {
        console.log(data);
    }).catch(err => {
        console.log(err);
        context.done(err, "Get Item Fail");
    });
}