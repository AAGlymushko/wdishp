const {
    addUser,
    checkUser,
    connection,
    redactPassword,
    getPersonByName,
    getPersonByPhoneNumber
} = require('./mysql.js');

const { getPerson } = require('./type.js');

const { checkChar, chekStrLength, hash } = require('./baseServerFunc.js');

const authorization = (socket, users, admin) => {
    socket.on('authorization', (data) => {
        try {
            if (getPerson(socket, users, admin)) throw Error("error");

            if (!data) throw Error("error");

            if (!data.password) throw Error("error");
            if (!chekStrLength(data.password, 10, 60)) throw Error("error");

            if (!data.phoneNumber) throw Error("error");

            if (!checkChar(data.phoneNumber, '+0123456789')) throw Error("error");
            if (!chekStrLength(data.phoneNumber, 10, 50)) throw Error("error");

            checkUser({
                name: null,
                password: data.password,
                phoneNumber: data.phoneNumber
            }, (result) => {
                if (result) {
                    getPersonByPhoneNumber(data.phoneNumber, (succes, userObject) => {
                        if (succes) {
                            console.log(socket.id + ' авторизовался!');
                            socket.emit('authorization', {
                                message: 'success',
                                password: data.password,
                                phoneNumber: userObject.phoneNumber,
                                name: userObject.name
                            });
                            users.addUser(socket, userObject);
                        } else {
                            socket.emit('authorization', { message: 'error' });
                        }
                    });
                } else {
                    socket.emit('authorization', { message: 'error' });
                }
            });
        } catch (error) {
            socket.emit('authorization', {
                message: error.message
            });
        }
    });
}

const authorizationAdmin = (socket, users, admin) => {
    socket.on('authorizationAdmin', (data) => {
        try {
            if (getPerson(socket, users, admin)) throw Error("error");

            if (!data) throw Error("error");

            if (!data.password) throw Error("error");
            if (!chekStrLength(data.password, 10, 60)) throw Error("error");

            if (!data.name) throw Error("error");
            if (!chekStrLength(data.name, 10, 50)) throw Error("error");
            if (checkChar(data.name, ',./\'\";:][}{!@#$%^&*()=+`~<>?|\\ ')) throw Error("error");

            checkUser({
                name: data.name,
                password: data.password,
                phoneNumber: null
            }, (result) => {
                if (result) {
                    getPersonByName(data.name, (succes, userObject) => {
                        if (succes) {
                            console.log(socket.id + ' авторизовался!');
                            socket.emit('authorizationAdmin', {
                                message: 'success',
                                password: data.password,
                                phoneNumber: userObject.phoneNumber,
                                name: userObject.name
                            });
                            admin.addAdmin(socket, userObject);
                        } else {
                            socket.emit('authorizationAdmin', { message: 'error' });
                        }
                    });
                } else {
                    socket.emit('authorizationAdmin', { message: 'error' });
                }
            });
        } catch (error) {
            socket.emit('authorizationAdmin', {
                message: error.message
            });
        }
    });
}

module.exports = { authorization, authorizationAdmin };