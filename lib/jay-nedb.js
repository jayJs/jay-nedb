
var multiparty = require('multiparty')
  , sanitizeHtml = require('sanitize-html')
  , fs = require('fs')
  , Datastore = require('nedb')
  , readChunk = require('read-chunk')
  , fileType = require('file-type')
  , path = require('path')
  , rootPath = require('app-root-path');

var tokens = {};
var db = {};

var Jay = function () {

  "use strict";

  var self = this;

  self.get = function (req, res, callback) {

    var table = sanitizeUrl("table", req);
    var id = sanitizeUrl("id", req);
    var limit = sanitizeUrl("limit", req);
    limit = Number(limit);

    var thisDb = getDB(table);

    // Prepeare the query
    var params;
    if (id !== "undefined" && limit === 1) { // objectId is set, this should send only one entry
      params = {
        objectId: id
      };
    } else if (limit > 1 && id === "undefined") { // objectId is not set, this should be a query for multiple elements
      params = {};
    } else {
      protectedCallback(res, callback, { error: "Query is confused" });
    }

    thisDb.loadDatabase(function (err) {
      if (err) {
        protectedCallback(res, callback, { error: err });
      } else {
        thisDb.find(params).limit(limit).sort({createdAt: -1}).exec(function (err, results) {
          if (err) {
            protectedCallback(res, callback, { error: err });
          } else {
            if (results.length > 0) {
              protectedCallback(res, callback, results);
            } else {
              protectedCallback(res, callback, { error: "No such post" });
            }
          }
        });
      }
    });
  };

  self.post = function (req, resp, callback) {

    var table = sanitizeUrl("table", req);
    var form = new multiparty.Form();

    var thisDb = getDB(table);

    // handle the FormData
    form.parse(req, function (err, allFields, files) {

      var fields = sanityzeAndRemoveEmpty(allFields);
      // Create a random objectId
      fields.objectId = hash();

      thisDb.loadDatabase(function (err) {
        if (err) {
          protectedCallback(resp, callback, { error: err });
        } else {

          thisDb.insert(fields, function (err, newDoc) {
            if (err) {
              protectedCallback(resp, callback, { error: err });
            } else {

              var first = null;
              var firstKey = null;
              for (var firstKey in files) {
                first = files[firstKey];
                if(typeof(first) !== 'function') {
                    break;
                }
              }
              if (files && files[firstKey]) {
                // If there's a file, upload it
                saveFiles(table, fields.objectId, files, callback);
              } else {
                // no uploading neccessary
                protectedCallback(resp, callback, { objectId: fields.objectId });
              }
            }
          });
        }
      });
    });
  }


  self.put = function(req, res, callback) {

    var table = sanitizeUrl("table", req);
    var id = sanitizeUrl("id", req);
    var data = sanitizeUrl("data", req);
    var form = new multiparty.Form();

    var thisDb = getDB(table);

    // handle the FormData
    form.parse(req, function(err, allFields, files) {

      var fields = sanityzeAndRemoveEmpty(allFields);

      thisDb.loadDatabase(function (err) {
        if (err) {
          protectedCallback(res, callback, { error: err });
        } else {
          // Set an existing field's value
          thisDb.update({ objectId: id }, { $set: fields }, function (err, numReplaced) {
            if (err) {
              protectedCallback(res, callback, { error: err });
            } else {

              var first = null;
              var firstKey = null;
              for (var firstKey in files) {
                first = files[firstKey];
                if(typeof(first) !== 'function') {
                    break;
                }
              }

              if(files && files[firstKey]) {
                // If there's a file, upload it
                saveFiles(table, id, files, callback) // TODO how to keep the files?
              } else {
                // no uploading neccessary
                protectedCallback(res, callback, { objectId: id })
              }
            }
          });
        }
      });
    });
  }

  self.delete = function(req, res, callback) {
    var table = sanitizeUrl("table", req);
    var id = sanitizeUrl("id", req);

    var thisDb = getDB(table);

    thisDb.loadDatabase(function (err) {
      if(err) {
        protectedCallback(res, callback, { error: err })
      } else {
        thisDb.remove({ objectId: id }, {}, function (err, numRemoved) {
          if (err) {
            protectedCallback(res, callback, { error: err });
          } else {
            protectedCallback(res, callback, {objectId: id, numRemoved: numRemoved});
          }
        });
      }
    });
  };

  self.query = function (req, res, callback) {
    var table = sanitizeUrl("table", req);
    var limit = sanitizeUrl("limit", req);
    var key = sanitizeUrl("key", req);
    var value = sanitizeUrl("value", req);
    var order = sanitizeUrl("order", req);

    table = String(table);
    limit = Number(limit);
    order = String(order);
    key = String(key);
    value = String(value);

    var thisDb = getDB(table);

    if (table && limit && key && value) {

      var params = {};
      params[key] = value;

      thisDb.loadDatabase(function (err) {
        if (err) {
          protectedCallback(res, callback, { error: err })
        } else {
          thisDb.find(params).limit(limit).sort({order: 1}).exec(function (err, results){
            if (err) {
              protectedCallback(res, callback, { error: err })
            } else {
              if(results.length > 0) {
                protectedCallback(res, callback, results);
              } else {
                protectedCallback(res, callback, { error: "No such post" });
              }
            }
          });
        }
      });
    } else {
      protectedCallback(res, callback, { error: "Query is missing something" });
    }
  };
};

function saveFiles(table, id, files, callback) {

  var lastKey = Object.keys(files).length;
  var counter = 1;

  var thisDb = getDB(table);

  var allowedMime = ["image/jpeg", "image/png", "image/gif", "application/pdf", "application/x-pdf", "application/x-bzpdf", "application/x-gzpdf", "text/rtf", "application/rtf"];

  Object.keys(files).forEach(function(key) { // iterate over all files.

    var buffer = readChunk.sync(files[key][0].path, 0, 262);
    var type = fileType(buffer);
    var mime = type.mime;

    if (files[key][0].size < 40000000) {
      if (allowedMime.indexOf(mime) > -1) {

        fs.readFile(files[key][0].path, function (err, data) {

          var fileName = hash() + String(files[key][0].originalFilename);
          var newLocation = "/uploads/" + fileName;
          var newPath = rootPath + "/public/uploads/" + fileName;

          fs.writeFile(newPath, data, function (err) {
            if (err) {
              console.log(err);
              callback({ error: err });
            } else {

              var post = {};
              var fieldname = String(files[key][0].fieldName);
              post[fieldname] = {
                name: fileName,
                url: newLocation,
                __type: 'File'
              }

              thisDb.loadDatabase(function (err) {
                if(err) {
                  callback({ error: err });
                } else {
                  thisDb.update({ objectId: id }, { $set: post }, function (err, numReplaced) {
                    if(err) {
                      callback({ error: err });
                    } else {
                      if (counter === lastKey) {
                        callback({ objectId: id })
                      }
                      counter++;
                    }
                  });
                }
              });
            }
          });
        });
      } else {
        callback({ error: "Only jpg, png, gif, pdf, rtf allowed" });
      }
    } else {
      callback({ error: "The file you are trying to upload is too big, it should be under 40 MB." });
    }
  });
}

function sanityzeAndRemoveEmpty(fields) {

  var fields2 = {};
  for (var one in fields) {
    if(String(fields[one]) !== "undefined") {
      fields[one] = sanitizeHtml(fields[one]);
      fields2[one] = String(fields[one]);
    }
  }
  return fields2;
}

function sanitizeUrl(name, req) {
  var getValue = req.query[name];
  var sanitize = sanitizeHtml(getValue);
  return sanitize;
}

function hash() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i=0; i < 10; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// JSONP might sometimes trigger queries with the same callback ID, which causes the server to crash.
// This here sort of helps to prevent that.
function protectedCallback(response, callback, myResponse) {
  if(response.headersSent) {
    console.log("Friendly warning from Jay.protectedCallback: Headers are already sent.")
  } else {
    callback(myResponse)
  }
}

function getDB(table) {
  var thisDb;
  if(db[table]) {
    return db[table];
  } else {
    var tableFile = table + '.json';
    thisDb = new Datastore({ filename: tableFile, autoload: true });
    db[table] = thisDb;
    return thisDb;
  }
}

module.exports = new Jay();
