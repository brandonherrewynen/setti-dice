const express = require('express')
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
    for ( i in pastMessages ) {
        io.emit('load_previous_chat', '<strong>' + pastMessages[i]['username'] + '</strong>: ' + pastMessages[i]['message'])
    }
    socket.on('username', function(username) {
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
        mongo.logMessage(socket.username, message)
        pullChat()
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message)
        //io.emit('chat_message', dice.DiceRound())
    })

    socket.on('error', (error) => {
        io.emit('chat_message', "connection error" + error);
    })

})

const server = http.listen(8080, function() {
    console.log('listening on *:8080')
    pullChat()
})

function pullChat () {
    mongo.pullPersistentChat().then(function(items) {
        console.info('promise was fulfilled with items!')
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
}

function removeUser(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
  }