const mongodb     = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID    = require('mongodb').ObjectID;
const GridStore   = require('mongodb').GridStore;
const config      = require('../config/config');
const url         = config.database.url;
const dbName      = config.database.dbName;
const fs          = require('fs');
const isID        = new RegExp("^[0-9a-fA-F]{24}$");


// Connect
const connection = (closure) => {
    return MongoClient.connect(url, (err, client) => {
      closure(client, err);
    });
};

module.exports = {

  find: (collection, params ) => {
    params = params || {};
    params.pager = params.pager || {};

    var limit = 0;
    var skip = 0;
    if(params.pager.pageIndex && params.pager.pageSize){
      skip = params.pager.pageSize*(params.pager.pageIndex-1);
      limit = params.pager.pageSize;
    }
    return new Promise((resolve, reject) => {
       connection((client, err) => {
           if (err) {
             reject(err);
             return;
           }
           client.db(dbName).collection(collection)
           .find(params.query, params.fields)
           .sort(params.sort)
           .skip(skip)
           .limit(limit)
           .toArray()
           .then((obj) => {
               resolve(obj);
               client.close();
           })
           .catch((err) => {
               reject(err);
               client.close();
           });
       });
    });
  },

  findFiles: (params ) => {
    params = params || {};
    params.pager = params.pager || {};

    var limit = 0;
    var skip = 0;
    if(params.pager.pageIndex && params.pager.pageSize){
      skip = params.pager.pageSize*(params.pager.pageIndex-1);
      limit = params.pager.pageSize;
    }
    return new Promise((resolve, reject) => {
       connection((client, err) => {
         if (err) {
           reject(err);
           return;
         }
         client.db(dbName).fs.files
           .find(params.query)
           .sort(params.sort)
           .skip(skip)
           .limit(limit)
           .toArray()
           .then((obj) => {
               resolve(obj);
               client.close();
           })
           .catch((err) => {
               reject(err);
               client.close();
           });
       });
    });


  },

  findOne: (collection, params ) => {
    params = params || {};
    return new Promise((resolve, reject) => {
       connection((client, err) => {
         if (err) {
           reject(err);
           return;
         }
         client.db(dbName).collection(collection)
         .find(params.query, params.fields)
         .sort(params.sort)
         .toArray()
         .then((obj) => {
             resolve(obj[0]);
             client.close();
         })
         .catch((err) => {
             reject(err);
             client.close();
         });
       });
    });
  },

  findById: (collection, params ) => {
    params = params || {};

    return new Promise((resolve, reject) => {
       connection((client, err) => {
         if (err) {
           reject(err);
           return;
         }
         if (!isID.test(params.id)) {
           resolve();
           return;
         }
         client.db(dbName).collection(collection)
         .find({_id: new ObjectID(params.id)}, params.fields)
         .sort(params.sort)
         .toArray()
         .then((obj) => {
             resolve(obj[0]);
             client.close();
         })
         .catch((err) => {
             reject(err);
             client.close();
         });
       });
    });
  },

  insertOne: (collection, obj) => {
    return new Promise((resolve, reject) => {
      connection((client, err) => {
        if (err) {
          reject(err);
          return;
        }

        client.db(dbName).collection(collection)
        .insertOne(obj)
        .then((obj) => {
            resolve(obj);
            client.close();
        })
        .catch((err) => {
            reject(err);
            client.close();
        });
      });
    });
  },

  insertOneFile: (collection, obj) => {
    return new Promise((resolve, reject) => {
      connection((client, err) => {
        if (err) {
          reject(err);
          return;
        }
        var gs = new GridStore(client.db(dbName), obj.name, "w", {
          "content_type": obj.mimetype,
          "metadata":{
              "name": obj.name
          }
        });

        gs.open(function(err, gs) {
          gs.write(obj.data, function(error, result){
            if(error) reject(err);
            else{
              resolve(result);
            }
            gs.close();
          });
        });


      });
    });
  },

  downloadFile: (collection, params) => {
    return new Promise((resolve, reject) => {
      connection((client, err) => {
        if (err) {
          reject(err);
          return;
        }
        var gs = new GridStore(client.db(dbName), params.id, "r");
        gs.open(function(err, gs) {
          gs.read( (err, obj)=>{
            resolve(obj);
            gs.close();
          })
        });
      });
    });
  },

  insertMany: (collection, obj) => {
    return new Promise((resolve, reject) => {
      connection((client, err) => {
        if (err) {
          reject(err);
          return;
        }
        client.db(dbName).collection(collection)
        .insertMany(obj)
        .then((obj) => {
            resolve(obj);
            client.close();
        })
        .catch((err) => {
            reject(err);
            client.close();
        });
      });
    });
  },

  updateOne: (collection, obj) => {
    var id = obj._id;
    delete obj._id;
    return new Promise((resolve, reject) => {
      connection((client, err) => {
          if (err) {
            reject(err);
            return;
          }
          if (!isID.test(id)) {
            resolve();
            return;
          }
          client.db(dbName).collection(collection)
              .updateOne({_id: new ObjectID(id)}, { $set: obj})
              .then((obj) => {
                  resolve(obj.result);
                  client.close();
              })
              .catch((err) => {
                  reject(err);
                  client.close();
              });
      });
    });
  },

  deleteOne: (collection, id) => {
    return new Promise((resolve, reject) => {
      connection((client, err) => {

        if (err) {
          reject(err);
          return;
        }
        if (!isID.test(id)) {
          resolve();
          return;
        }
          client.db(dbName).collection(collection)
          .deleteOne({_id: new ObjectID(id)})
          .then((obj) => {
              resolve(obj.result);
              client.close();
          })
          .catch((err) => {
              reject(err);
              client.close();
          });
      });
    });
  },

  count: (collection, params) => {
    params = params || {};
    return new Promise((resolve, reject) => {
       connection((client, err) => {
           if (err) {
             reject(err);
             return;
           }
           client.db(dbName).collection(collection)
           .find(params.query)
           .count()
           .then((obj) => {
               resolve(obj);
               client.close();
           })
           .catch((err) => {
               reject(err);
               client.close();
           });
       });
    });
  },

  aggregate: (collection, pipeline) => {
    return new Promise((resolve, reject) => {
       connection((client, err) => {
           if (err) {
             reject(err);
             return;
           }
           client.db(dbName).collection(collection)
           .aggregate(pipeline)
           .toArray()
           .then((obj) => {
               resolve(obj);
               client.close();
           })
           .catch((err) => {
               reject(err);
               client.close();
           });;
       });
    });
  },

}
