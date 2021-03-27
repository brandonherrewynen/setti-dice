const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const storage = require('node-persist');
const path = require('path');
const dice = require('./dice');
app.use(express.static(path.join(__dirname, '/public')));

async function initStorage() {
    await storage.init({
        dir: '/logs/',
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false,  // can also be custom logging function
        ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS or a valid Javascript Date object
        expiredInterval: 2 * 60 * 1000, // every 2 minutes the process will clean-up the expired cache
        // in some cases, you (or some other service) might add non-valid storage files to your
        // storage dir, i.e. Google Drive, make this true if you'd like to ignore these files and not throw an error
        forgiveParseErrors: false
    });
}

var i = dice.DiceRound();

app.get('/', function(req, res) {
    res.render('index.ejs');
});

initStorage();
io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        if (username == "notassigned") {}
        else
            io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat.</i>');
    });
    socket.on('disconnect', function() { io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat.</i>'); })
    socket.on('chat_message', function(message) { 
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
        // socket.then(async function(result) {
        //     console.log(result);
        // })
    });
});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});