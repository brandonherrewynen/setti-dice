const express = require('express')
const sanitizeHtml = require('sanitize-html');
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const path = require('path')
const dice = require('./dice')
const mongo = require('./database')

var pastMessages = []
var isOnline = []
var guestCount = 0

app.use(express.static(path.join(__dirname, '/public')))

app.get('/', function(req, res) {
    res.render('index.ejs')
})

io.sockets.on('connection', function(socket) {
    console.log('connection recieved')
    socket.on('pong', function(data){
        console.log("Pong received from client");
    });
    socket.on('refreshMessages', function(socketID) {
        pullChat(socketID)
    })
    socket.on('username', function(username) {
        username = sanitizeHtml(username, {allowedTags: []});
        socket.username = username;
        if (username == "guest") {}
        else {
            io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat.</i>', socket.username)
            guestCount--
            isOnline.push(socket.username)
            io.emit('userlistCall', isOnline, guestCount)
        }
    })

    socket.on('userlist', function() {
        if (!socket.username)
            guestCount++
        else
            isOnline.push(socket.username)
        console.log(guestCount)
        io.emit('userlistCall', isOnline, guestCount)
    })

    socket.on('disconnect', function() { 
        if (!socket.username)
            guestCount--
        else {
            io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat.</i>', false)
            removeUser(isOnline, socket.username)
        }
        io.emit('userlistCall', isOnline, guestCount)
        
    })

    socket.on('chat_message', function(message) {
        message = sanitizeHtml(message, {allowedTags:[]});
        mongo.logMessage(socket.username, message)
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message)
        //io.emit('chat_message', dice.DiceRound())
    })

    socket.on('error', (error) => {
        io.emit('chat_message', "connection error" + error);
    })

})

setTimeout(sendHeartbeat, 90000);

const server = http.listen(8080, function() {
    console.log('listening on *:8080')
})

async function pullChat (socketID) {
    await mongo.pullPersistentChat().then(function(items) {
    pastMessages = []
    for ( i in items ) {
        pastMessages.push(items[i])
        }
        console.log(pastMessages.length + " messages pulled from localstorage.")
    })
    .catch(function(err) {
    console.error('promise was rejected')
    console.error(err)
    })
    for ( i in pastMessages ) {
        io.to(socketID).emit('load_previous_chat',
        '<strong>' + pastMessages[i]['username'] + '</strong>: ' + pastMessages[i]['message'])
    }
}

function removeUser(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
  }

  function sendHeartbeat(){
    setTimeout(sendHeartbeat, 100000);
    io.sockets.emit('ping', { beat : 1 });
    console.log('pinged to keep active. beat')
}