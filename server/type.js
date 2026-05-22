class User {
    constructor(name, password, phoneNumber) {
        this.name = name;
        this.password = password;
        this.phoneNumber = phoneNumber;
    }
}

class Admin {
    constructor(name, password, phoneNumber) {
        this.name = name;
        this.password = password;
        this.phoneNumber = phoneNumber;
    }
}

class UsersList {
    #users;
    constructor() {
        this.#users = new Map();
    }
    addUser(socket, data) {
        if (!this.#users.has(socket.id)) {
            this.#users.set(socket.id, data);
        }
    }
    deleteUser(socket) {
        if (this.#users.has(socket.id)) {
            this.#users.delete(socket.id);
        }
    }
    getUser(socket) {
        if (this.#users.has(socket.id)) {
            return this.#users.get(socket.id);
        } else {
            return null;
        }
    }
}

class AdminList {
    #admins;
    constructor() {
        this.#admins = new Map();
    }
    addAdmin(socket, data) {
        if (!this.#admins.has(socket.id)) {
            this.#admins.set(socket.id, data);
        }
    }
    deleteAdmin(socket) {
        if (this.#admins.has(socket.id)) {
            this.#admins.delete(socket.id);
        }
    }
    getAdmin(socket) {
        if (this.#admins.has(socket.id)) {
            return this.#admins.get(socket.id);
        } else {
            return null;
        }
    }
}

const getPerson = (socket, users, admins) => {
    const user = users.getUser(socket);
    const admin = admins.getAdmin(socket);
    if (user) return user;
    else if (admin) return admin;
    return null;
} 

module.exports = { User, Admin, UsersList, AdminList, getPerson };