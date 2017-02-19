'use strict'

var bodyParser = require('body-parser');
var app = require('express')();
var env = require('node-env-file');
var assert = require('assert');
var WebClient = require('@slack/client').WebClient;
var dbHelper = require('./db.js');

// DB connection stuff
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var dedupHash = {};

env(__dirname + '/.env');

var slackEvents = require('slack-events-listener')(process.env.VER_TOKEN, onSlackEvent);
const baseURL = 'https://slack.com/api/chat.postMessage';

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PW;
const host = process.env.MONGO_HOST;
const port = process.env.MONGO_PORT;

// Set up mongo client.
let url = `mongodb://${user}:${pass}@${host}:${port}`;
if (process.env.MONGO_DB) {
  url = `${url}/${process.env.MONGO_DB}`;
}
console.log('url is ' + url);

// Handles all incoming events subscribed to: messages to groups, DM, multi-DMs
function onSlackEvent(event, cb) {
  // if the user was the bot themself, do not act.
  if (event.event.subtype === 'bot_message') {
    return; 
  }
  console.log(event);

  var token = process.env.BOT_TOKEN || '';
  var web = new WebClient(token);

  assert.equal(event.token, process.env.VER_TOKEN, 'verification token failure');

  var message = event.event.text;
  var channel = event.event.channel;

  // check if DM to escalater bot, and if new thread. 
  if (event.event.type === 'message') {
    if (getFirstChar(event.event.channel) === 'D') {
      if (event.event.thread_ts == null) {
        var channelID = '';

        // This is a new message from some reporter to the bot. 
        if (dedupHash[event.event.ts] == null) {
          dedupHash[event.event.ts] = 1;
          web.groups.list(function(err, info) {
            if (err) {
              console.log('Error:', err);
            } else {
              console.log('Searching for channel');
              for (var i in info.groups) {
                console.log(info.groups[i].name + ' and ' + stripFirst(getFirst(event.event.text)));
                if (info.groups[i].name === stripFirst(getFirst(event.event.text))) {
                  channelID = info.groups[i].id;
                  break;
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
                channelOrig: event.event.channel,
              };

              dbHelper.createNewIncident(db, opts, function() {
                db.close();
              });
            });

            if (channelID !== '') {
              var cleaned = stripFirstWord(event.event.text);
              web.chat.postMessage(channelID, cleaned, function (err, res) {
                if (err) {
                    console.log('Error:', err);
                } else {
                    console.log('Message sent: ', res);
                    writeRemoteTs(res, event.event.ts, event.event.channel);
                }
              });
            } else {
              web.chat.postMessage(event.event.channel, 'Channel does not exist. Use #<channel-name> pls.', function (err, res) {
                if (err) {
                    console.log('Error:', err);
                } else {
                    console.log('Message sent: ', res);
                }
              });
            }
          });
        } else {
          console.log("Duplicate message avoided.");
        }
      } else {
        // This is a reply from reporter to bot, because we have a thread_ts.
        
        // First check that this isn't a duplicate message
        if (dedupHash[event.event.ts] == null) {
          dedupHash[event.event.ts] = 1;

          MongoClient.connect(url, function(err, db) {
            assert.equal(null, err);
            var opts = {
              timestamp: event.event.thread_ts,
              channelOrig: event.event.channel,
            };

            dbHelper.findIncidents(db, opts, function(incident) {
              var toChannel = incident.ownerID;
              var toMessage = event.event.text;

              web.chat.postMessage(toChannel, toMessage, {thread_ts: incident.respondThread}, function (err, res) {
                if (err) {
                  console.log('Error:', err);
                } else {
                  console.log('Message sent: ', res);
                }
              });

              db.close();
            });
          });

        } else {
          console.log("Duplicate message avoided.");
        }
      }
    } else if (getFirstChar(event.event.channel) === 'G') {
      if (event.event.thread_ts == null) {
        // do not handle meta talking within groups.
        return;
      }

      // This is definitely a response from an owner to bot.
      if (dedupHash[event.event.ts] == null) {
        dedupHash[event.event.ts] = 1;

        MongoClient.connect(url, function(err, db) {
          assert.equal(null, err);
          var opts = {
            owner: event.event.channel,
            respondThread: event.event.thread_ts,
          };

          dbHelper.findIncidentsResponder(db, opts, function(incident) {
            var toChannel = incident.channelOrig;
            var toMessage = event.event.text;

            web.chat.postMessage(toChannel, toMessage, {thread_ts: incident.timestamp}, function (err, res) {
              if (err) {
                console.log('Error:', err);
              } else {
                console.log('Message sent: ', res);
              }
            });

            db.close();
          });
        });
      } else {
        console.log("Duplicate message avoided.");
      }
    }
  }
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

function stripFirstWord(message) {
  return message.substr(message.indexOf(" ") + 1);
}

function writeRemoteTs(sent, originalTs, originalChannel) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    
    var opts = {
      timestamp: originalTs,
      channelOrig: originalChannel,
      respondThread: sent.ts,
    };
    dbHelper.updateIncident(db, opts, function() {
      console.log("Updated db");
      db.close();
    });
  });
}

// /slack_events is the webhook set in Slack
app.use('/slack_events', bodyParser.json(), slackEvents);

app.listen(8080, function () {
  console.log('Listening on port 8080')
})
