const { redactPerson } = require('./mysql.js');
const { Admin, User, getPerson } = require('./type.js');
const { chekStrLength, hash, checkChar } = require('./baseServerFunc.js');

const redactUserData = (socket, users, admins) => {
    socket.on('redactUserData', (data) => {
        try {
            const person = getPerson(socket, users, admins);
            if (!person) throw Error("error");

            if (!data) throw Error("error");

            if (!data.password && !data.name) throw Error("error");

            if (!chekStrLength(data.password, 10, 60)) throw Error("error");

            if (data.password) {
                if (!chekStrLength(data.password, 10, 60)) throw Error("error");
            }
            if (data.name) {
                if (!chekStrLength(data.name, 10, 50)) throw Error("error");
                if (checkChar(data.name, ',./\'\";:][}{!@#$%^&*()=+`~<>?|\\ ')) throw Error("error");
            }

            const newPerson = (person instanceof User) ?
                new User(
                    data.name ? data.name : person.name,
                    data.password ? hash(data.password) : person.password,
                    person.phoneNumber) :
                new Admin(
                    data.name ? data.name : person.name,
                    data.password ? hash(data.password) : person.password,
                    person.phoneNumber);

            redactPerson(newPerson, (result) => {
                if (result) {
                    const user = users.getUser(socket);
                    const admin = admins.getAdmin(socket);

                    if (user) {
                        users.deleteUser(socket);
                        users.addUser(socket, newPerson);
                    }
                    if (admin) {
                        admins.deleteAdmin(socket);
                        admins.addAdmin(socket, newPerson);
                    }
                    socket.emit('redactUserData', {
                        isPassword: true,
                        name: newPerson.name,
                        password: data.password
                    });
                } else {
                    socket.emit('redactUserData', {
                        isPassword: false
                    });
                }
            });
        } catch (error) {
            socket.emit('redactUserData', {
                isPassword: false
            });
        }
    });
}

module.exports = redactUserData;