let { Server } = require('socket.io')
let userSchema = require('../schemas/users')
let jsonwebtoken = require('jsonwebtoken')


module.exports = {
    serverSocket: function (server) {
        let io = new Server(server);
        let user1;
        io.on('connection', async (socket) => {
            let token = socket.handshake.auth.token;
            let result = jsonwebtoken.verify(token, 'secret');
            if (result.exp * 1000 > Date.now()) {
                let user = await userSchema.findById(result.id)
                user1 = user._id
                socket.emit('welcome', user.username)
            }
            socket.on('joinUser', data => {
                socket.join(data);
                socket.join(user1)
            })
            socket.on('newMessage', data => {
                io.to(data.to).emit("newMessage")
                io.to(data.from).emit("newMessage")
            })
        });
    }
}