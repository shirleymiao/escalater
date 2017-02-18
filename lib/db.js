var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  findIncidents(db, function() {
      db.close();
  });
});

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
    console.log("Created a new incident in the incidents collection.");
    callback();
  });
},

// Use the find method to query incidents in the database
findIncidents : function(db, callback) {
   var cursor =db.collection('incidents').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
},

// Use the updateOne method to update an incident document that has already been created
 updateIncidents : function(db, callback) {
   db.collection('incidents').updateOne(
      { "codename" : "first incident ever" },
      {
        $set: { "status": "pending" },
        $currentDate: { "lastModified": true }
      }, function(err, results) {
      console.log(results);
      callback();
   });
},

};