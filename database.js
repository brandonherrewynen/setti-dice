const mongo = require('mongodb').MongoClient;
// const uri = "mongodb://localhost:27017/settiDB";
const uri = "mongodb+srv://setti:rootsdelta49821@setti-dice-cluster.eslwh.mongodb.net/settiDB?retryWrites=true&w=majority";

exports.createDB = function () {
    mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("settiDB");
        dbo.createCollection("messages", function(err, res) {
            if (err) throw err;
            console.log("Collection created!");
            db.close();
        });
    });
};

exports.logMessage = function (username, message) {
    mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
        if (err) throw err;
        let dbo = db.db("settiDB")
        let record = { username: username, message: message };
        dbo.collection("messages").insertOne(record, function(err, res) {
            console.log("1 message recorded");
            db.close();
        });
    });
};

exports.pullPersistentChat = async function () {
    var client;
    try {
        client = await mongo.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        let dbo = client.db("settiDB")
        let collection = dbo.collection("messages")
        let result = await collection.find().toArray()
        return result
    }
    catch(err) {console.error(err);}
    finally{ client.close(); }
}