var bodyParser = require('body-parser');
var app = require('express')();
var env = require('node-env-file');
var assert = require('assert');
var request = require('request');
var WebClient = require('@slack/client').WebClient;

env(__dirname + '/.env');

var slackEvents = require('slack-events-listener')(process.env.VER_TOKEN, onSlackEvent);

const baseURL = 'https://slack.com/api/chat.postMessage';

// Handles all incoming events subscribed to: messages to groups, DM, multi-DMs
function onSlackEvent(event, cb) {
  // if the user was the bot themselves, do not post.
  if (event.event.user === process.env.BOT_ID) {
    return; 
  }

  //console.log(event);
  //writeToDatabase(event, cb);
  var token = process.env.SLACK_API_TOKEN || '';

  assert.equal(event.token, process.env.VER_TOKEN, 'verification token failure');

  var message = event.event.text;
  var channel = event.event.channel;
  // for now, just write the same message back.

  var web = new WebClient(token);
  web.chat.postMessage(channel, message, function (err, res) {
    if (err) {
        console.log('Error:', err);
    } else {
        console.log('Message sent: ', res);
    }
  });
}

// /slack_events is the webhook set in Slack
app.use('/slack_events', bodyParser.json(), slackEvents);

app.listen(8080, function () {
  console.log('Listening on port 8080')
})
