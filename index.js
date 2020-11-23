const _ = require('lodash');
const aws = require('aws-sdk');

const env = process.env;

exports.handler = function(event, context) {
    console.log("Event");
    console.log(event);

    console.log("Context");
    console.log(context);

    console.log("Environment Variables");
    console.log(_.get(env, 'sender'));
    console.log(_.get(env, 'table_name'));
}