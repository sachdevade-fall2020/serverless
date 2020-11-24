const aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();

const env = process.env;

exports.handler = function(event, context) {
    const tableName = env.table_name;
    const sender = env.sender;

    const snsNotification = event.Records[0].Sns;
    const snsMessage = JSON.parse(snsNotification.Message);

    console.log("SNS Message");
    console.log(snsMessage);
    
    var getParams = {
        TableName: tableName,
        FilterExpression: '(question_id = :question_id) AND (answer_id = :answer_id) AND (subject = :subject) AND (email = :email) AND (text = :text)',
        ExpressionAttributeValues: {
            ':question_id': {S: snsMessage.question_id},
            ':answer_id': {S: snsMessage.answer_id},
            ':subject': {S: snsNotification.Subject},
            ':email': {S: snsMessage.question_user_email},
            ':text': {S: snsMessage.text}
        }
    };
    
    const getItem = dynamodb.scan(getParams).promise();
    
    getItem.then(data => {
        if(data.Count == 0){
            dynamodb.putItem({
                TableName: tableName,
                Item: {
                    id: {S: snsNotification.MessageId},
                    question_id: {S: snsMessage.question_id},
                    answer_id: {S: snsMessage.answer_id},
                    email: {S: snsMessage.question_user_email},
                    subject: {S: snsNotification.Subject},
                    text: {S: snsMessage.text}
                }
            }, function(err, data){
                if(err){
                    console.error("Put Item Fail");
                    console.error(err);
                } else {
                    console.info("Put Item Success");
                }
            });
        }
    }).catch(err => {
        console.error(err);
        context.done(err, "Get Item Fail");
    });
}