const {
    getBdRate,
    getBdRates,
    getBdServices,
    getBdUserServices,
    getBdApplications,
    getBdUserApplications } = require('./mysql.js');
const { getPerson } = require('./type.js');

const getRate = (socket, users, admin) => {
    socket.on('getRate', () => {
        try {
            const person = getPerson(socket, users, admin);
            if (!person) throw Error("error");

            getBdRate(person, (success, result) => {
                if (success) {
                    socket.emit('getRate', {
                        rate: [result]
                    });
                } else {
                    socket.emit('getRate');
                }
            });
        } catch (error) {
            socket.emit('getRate')
        }
    });
}

const getRates = (socket, users, admin) => {
    socket.on('getRates', () => {
        try {
            if (!getPerson(socket, users, admin)) throw Error("error");

            getBdRates((success, result) => {
                if (success) {
                    socket.emit('getRates', {
                        rates: result
                    });
                } else {
                    socket.emit('getRates');
                }
            });
        } catch (error) {
            socket.emit('getRates')
        }
    })
};

const getUserServices = (socket, users, admin) => {
    socket.on('getUserServices', () => {
        try {
            const person = getPerson(socket, users, admin);
            if (!person) throw Error("error");

            getBdUserServices(person, (success, result) => {
                if (success) {
                    socket.emit('getUserServices', {
                        services: result
                    });
                } else {
                    socket.emit('getUserServices')
                }
            });
        } catch (error) {
            socket.emit('getUserServices')
        }
    });
};

const getServices = (socket, users, admin) => {
    socket.on('getServices', () => {
        try {
            if (!getPerson(socket, users, admin)) throw Error("error");

            getBdServices((success, result) => {
                if (success) {
                    socket.emit('getServices', {
                        services: result
                    });
                } else {
                    socket.emit('getServices')
                }
            });
        } catch (error) {
            socket.emit('getServices')
        }
    });
};

const getApplications = (socket, users, admin) => {
    socket.on('getApplications', () => {
        try {
            if (!getPerson(socket, users, admin)) throw Error("error");

            getBdApplications((success, result) => {
                if (success) {
                    socket.emit('getApplications', {
                        result: result
                    });
                } else {
                    socket.emit('getApplications');
                }
            });
        } catch (error) {
            socket.emit('getApplications')
        }
    });
}

const getUserApplications = (socket, users, admin) => {
    socket.on('getUserApplications', () => {
        try {
            const person = getPerson(socket, users, admin);
            if (!person) throw Error("error");

            getBdUserApplications(person, (success, result) => {
                if (success) {
                    socket.emit('getUserApplications', {
                        result: result
                    });
                } else {
                    socket.emit('getUserApplications');
                }
            });
        } catch (error) {
            socket.emit('getUserApplications')
        }
    });
}

module.exports = { getRate, getRates, getServices, getUserServices, getApplications, getUserApplications };