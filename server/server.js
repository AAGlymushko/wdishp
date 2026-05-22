const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
const fs = require('fs');

const { authorization, authorizationAdmin } = require('./authorization.js');
const redactUserData = require('./redactUserData.js');
const { getRate, getRates, getServices, getUserServices, getApplications, getUserApplications } = require('./getValues.js')
const {
    setUserRate,
    setUserService,
    deleteUserApplication,
    createUserApplication,
    createRate,
    createService,
    updateApplicationStatus } = require('./setValues.js');

const { User, Admin, UsersList, AdminList } = require('./type.js');

const PATH = path.join(__dirname, 'client');

const PORT = process.env.PORT || 3002;

const users = new UsersList();

const admin = new AdminList();

const disconnect = (socket) => {
    socket.on('disconnect', () => {
        if (users.getUser(socket)) {
            users.deleteUser(socket);
            console.log(socket.id + ' отключился!');
        } else if (admin.getAdmin(socket)) {
            admin.deleteAdmin(socket);
            console.log(socket.id + ' отключился!');
        }
    });
};

const logOutOfAccount = (socket) => {
    socket.on('logOutOfAccount', () => {
        if (users.getUser(socket)) {
            users.deleteUser(socket);
            console.log(socket.id + ' отключился!');
            socket.emit('logOutOfAccount');
        } else if (admin.getAdmin(socket)) {
            admin.deleteAdmin(socket);
            console.log(socket.id + ' отключился!');
            socket.emit('logOutOfAccount');
        }
    });
}

const checkUser = (socket) => {
    io.on('checkUser', () => {
        io.emit('checkUser', { check: users.has(socket.id) });
    });
}

app.get('/', (req, res) => { res.sendFile(path.join(PATH, 'dist', 'index.html')); });
app.use(express.static(path.join(PATH, 'dist')));
app.use(express.static(path.join(PATH, 'style')));

io.on('connection', (socket) => {
    authorization(socket, users, admin);

    authorizationAdmin(socket, users, admin)

    redactUserData(socket, users, admin);

    getRate(socket, users, admin);

    getRates(socket, users, admin);

    getServices(socket, users, admin);

    getUserServices(socket, users, admin);

    getApplications(socket, users, admin);

    getUserApplications(socket, users, admin);

    setUserRate(socket, users);

    setUserService(socket, users);

    deleteUserApplication(socket, users);

    createUserApplication(socket, users);

    createRate(socket, admin);

    createService(socket, admin);

    updateApplicationStatus(socket, admin);

    disconnect(socket);

    logOutOfAccount(socket);
});

http.listen(PORT, () => {
    console.log(`Сервер начал работу на порте ${PORT}!`);
});