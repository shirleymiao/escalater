//var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//var ObjectId = require('mongodb').ObjectID;
//var url = 'mongodb://0.tcp.ngrok.io:11548';*/

module.exports = {
  // Use the insertOne method to create a new document when a new incident report is started
  createNewIncident : function(db, ops, callback) {
      db.collection('incidents').insertOne( {
        "teamID": ops.teamID,
        "timestamp": ops.ts,
        "userID": ops.userID,
        "incidentText": ops.incidentText,
        "ownerID": ops.ownerID
     }, function(err, result) {
      assert.equal(err, null);
      //console.log(result);
      callback();
    });
  },

};