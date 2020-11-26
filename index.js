const aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB();
const ses = new aws.SES();

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
        FilterExpression: '(question_id = :question_id) AND (subject = :subject) AND (email = :email) AND (answer_text = :answer_text)',
        ExpressionAttributeValues: {
            ':question_id': {S: snsMessage.question_id},
            ':subject': {S: snsNotification.Subject},
            ':email': {S: snsMessage.answer_user_email},
            ':answer_text': {S: snsMessage.answer_text}
        }
    };
    
    const getItem = dynamodb.scan(getParams).promise();
    
    getItem.then(data => {
        if(data.Count == 0){
            console.log("Sending Email Notification");
            const sendEmail = ses.sendEmail({
                Destination: { ToAddresses: [snsMessage.question_user_email] },
                Message: {
                    Body: { Html: { Data: snsMessage.email_body } },
                    Subject: { Data: subjectMap.get(snsNotification.email_subject) }
                },
                Source: sender
            }).promise();
            
            sendEmail.then(data => {
                console.info("Send Mail Success");

                console.info("Storing DynamoDB Item");
                dynamodb.putItem({
                    TableName: tableName,
                    Item: {
                        id: {S: snsNotification.MessageId},
                        question_id: {S: snsMessage.question_id},
                        subject: {S: snsNotification.Subject},
                        email: {S: snsMessage.answer_user_email},
                        answer_text: {S: snsMessage.answer_text}
                    }
                }, function(err, data){
                    if(err){
                        console.error("Put Item Fail");
                        console.error(err);
                    } else {
                        console.info("Put Item Success");
                    }
                });
            }).catch(err => {
                console.error("Send Mail Fail");
                console.error(err);
            });
        }else{
            console.info("Item Already Exists");
        }
    }).catch(err => {
        console.error(err);
        context.done(err, "Get Item Fail");
    });
}