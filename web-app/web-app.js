var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://0.tcp.ngrok.io:11548/test';
var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var ejs = require('ejs');
var fs = require('fs');



// app.get('/', function(req, res) {
//    res.sendFile(path.join(__dirname + '/index.html'));
// });

// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!')
// })

// var div = document.getElementById("inc").innerHTML = "hello";
var entries = {}

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

    findAllIncidents(db, function() {
                   http.createServer(function(req,res) {
              res.writeHead(200, {'Content-Type': 'text/html'});

              //since we are in a request handler function
              //we're using readFile instead of readFileSync
              fs.readFile('index.html', 'utf-8', function(err, content) {
                if (err) {
                  res.end('error occurred');
                  return;
                }
                var temp = texts;  //here you assign temp variable with needed value

                var renderedHtml = ejs.render(content, {temp: temp});  //get redered HTML code
                res.end(renderedHtml);
              });
            }).listen(3000);              
    	console.log("Entries printed to console.");
      db.close();
    });
});

  var findAllIncidents = function(db, callback) {
   var cursor = db.collection('incidents').find( 

    );
   cursor.toArray(function(err, doc) {
      assert.equal(err, null);
      assert.notEqual(doc, [], 'Found no entries.');

      texts = "hi";
      for (var i in doc) {
        if (doc.hasOwnProperty(i)) {
          thisText = doc[i].incidentText
          console.log(i + " -> " + thisText);
          texts = texts + '\n' + thisText;
        }
      }
      console.log(texts);


      // document.getElementById("inc").innerHTML = "hello";
      callback(doc[0]);
   });
  }



 