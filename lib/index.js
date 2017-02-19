var bodyParser = require('body-parser');
var app = require('express')();
var env = require('node-env-file');
var assert = require('assert');
var request = require('request');
var WebClient = require('@slack/client').WebClient;
var dbHelper = require('./db.js');

// DB connection stuff
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://0.tcp.ngrok.io:11548/test';

env(__dirname + '/.env');

var slackEvents = require('slack-events-listener')(process.env.VER_TOKEN, onSlackEvent);
const baseURL = 'https://slack.com/api/chat.postMessage';
const botChannel = '';
var hasLoadedFromDB = true;

// Handles all incoming events subscribed to: messages to groups, DM, multi-DMs
function onSlackEvent(event, cb) {
  console.log(event);
  // if the user was the bot themself, do not act.
  if (event.event.subtype === 'bot_message') {
    return; 
  }

  //var token = process.env.SLACK_API_TOKEN || '';
  var token = process.env.BOT_TOKEN || '';
  var web = new WebClient(token);

  assert.equal(event.token, process.env.VER_TOKEN, 'verification token failure');

  var message = event.event.text;
  var channel = event.event.channel;

  // Ensure check fields have been populated. Else, error message and leave.
  if (!hasLoadedFromDB) {
    web.chat.postMessage(channel, 'DB not yet initialized. Please resend.', function (err, res) {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    });
    return;
  }
  
  // check if DM to escalater bot, and if new thread. 
  if (event.event.type === 'message') {
    if (getFirstChar(event.event.channel) === 'D') {
      if (event.event.thread_ts == null) {
        // This is a new message from some reporter to the bot. 
        web.groups.list(function(err, info) {
          var channelID = '';
          if (err) {
            console.log('Error:', err);
          } else {
            for (var i in info.channels) {
              console.log(info.channels[i].name + ' and ' + stripFirst(getFirst(event.event.text)));
              if (info.channels[i].name === stripFirst(getFirst(event.event.text))) {
                channelID = info.channels[i].id;
              }
            }
          }

          MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var opts = {
              teamID: event.team_id,
              ts: event.event.ts,
              userID: event.event.user,
              incidentText: event.event.text,
              ownerID: channelID,
            };
            console.log(opts);
            console.log("connected to mongo");

            dbHelper.createNewIncident(db, opts, function() {
              console.log('successfully created new incident');
              db.close();
            });
          });
        });
      } else {
        // This is a reply from reporter to bot

      }
    } else if (getFirstChar(event.event.channel) === 'G') {
      // This is a definitely response from an owner to bot.

    }
  }

  /*
  if (event.event.type === 'message') {
    // always post as a reply
    var parentThread = event.event.thread_ts || event.event.ts;

    web.chat.postMessage(channel, message, {thread_ts: parentThread}, function (err, res) {
      if (err) {
          console.log('Error:', err);
      } else {
          console.log('Message sent: ', res);
      }
    });
  }*/
}

function getFirstChar(message) {
  return message.charAt(0);
}

function getFirst(message) {
  return message.split(' ')[0];
}

function stripFirst(message) {
  return message.substring(1);
}

// /slack_events is the webhook set in Slack
app.use('/slack_events', bodyParser.json(), slackEvents);

app.listen(8080, function () {
  console.log('Listening on port 8080')
})
