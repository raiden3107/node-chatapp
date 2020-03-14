const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New web socket connected!')
    socket.on('join', (options, callback) => {
        const { error, user} = addUser({id:socket.id, ...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage(user.username, 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, `${user.username} has just joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profane language is not allowed')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has just left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', ({longitude, latitude}, callback) => {
        const loc = getUser(socket.id)
        io.to(loc.room).emit('locationMessage', generateLocationMessage(loc.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server is up on ${port}`)
})