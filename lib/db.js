var assert = require('assert');

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
   db.collection('incidents').updateMany(
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
   cursor.toArray(function(err, doc) {
      assert.equal(err, null);
      assert.notEqual(doc, [], 'Found no entries.');
      if (typeof doc[0] != 'undefined' && doc[0] != null) {
        callback(doc[0]);
      }
   });
  },

  findIncidentsResponder : function(db, ops, callback) {
    console.dir(ops);
   var cursor = db.collection('incidents').find( 
      {
        "ownerID": ops.owner,
        "respondThread": ops.respondThread,
      }
    );
   cursor.toArray(function(err, doc) {
      assert.equal(err, null);
      assert.notEqual(doc, [], 'Found no entries.');
      if (typeof doc[0] != 'undefined' && doc[0] != null) {
        callback(doc[0]);
      }
   });
  }

};