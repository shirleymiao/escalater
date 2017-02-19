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
        "ownerID": ops.ownerID,
        "channelOrig": ops.channelOrig
     }, function(err, result) {
      assert.equal(err, null);
      //console.log(result);
      callback();
    });
  },

  updateIncident: function(db, ops, callback) {
   db.collection('incidents').updateOne(
      { 
        "timestamp" : ops.timestamp,
        "channelOrig": ops.channelOrig
       },
      {
        $set: { "respondThread": ops.respondThread }
      }, function(err, results) {
      callback();
     });
  },

  findIncidents : function(db, ops, callback) {
   var cursor = db.collection('incidents').find( 
      {
        "timestamp": ops.timestamp,
        "channelOrig": ops.channelOrig
      }
    );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
}

};