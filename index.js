const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const dice = require('./dice');
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res) {
    res.render('index.ejs');
});

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
        io.emit('chat_message', dice.DiceRound());
        // socket.then(async function(result) {
        //     console.log(result);
        // })
    });
    socket.on('error', (error) => {
        io.emit('chat_message', "coonection error" + error);
    })
});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});