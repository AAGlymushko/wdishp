const { getPerson } = require('./type.js');
const {
    setBdUserRate,
    setBdUserService,
    deleteUserBdApplication,
    createBdUserApplication,
    createBdRate,
    createBdService,
    updateBdApplicationStatus } = require('./mysql.js');

const setUserRate = (socket, users) => {
    socket.on('setUserRate', (data) => {
        const user = users.getUser(socket);
        if (!user) return;
        if (!data) return;
        if (data.rate_id === undefined) return;

        setBdUserRate(user, data.rate_id, (success) => {
        });
    });
}

const setUserService = (socket, users) => {
    socket.on('setUserService', (data) => {
        const user = users.getUser(socket);
        if (!user) return;
        if (!data) return;
        if (data.service_id === undefined) return;

        setBdUserService(user, data.service_id, (success) => {
        });
    });
}

const deleteUserApplication = (socket, users) => {
    socket.on('deleteUserApplication', (data) => {
        const user = users.getUser(socket);
        if (!user) return;
        if (!data) return;
        if (data.application_id === undefined) return;

        deleteUserBdApplication(user, data.application_id, (success) => {
        });
    }); 
}

const createUserApplication = (socket, users) => {
    socket.on('createUserApplication', (data) => {
        const user = users.getUser(socket);
        if (!user) return;
        if (!data) return;
        if (data.application_value === undefined) return;

        createBdUserApplication(user, data.application_value, (success) => {
        });
    });
}

const createRate = (socket, admins) => {
    socket.on('createRate', (data) => {
        const admin = admins.getAdmin(socket);
        if (!admin) return;
        if (!admin) return;
        if (data.rate_name === undefined) return;
        if (data.services === undefined) return;

        createBdRate(data.rate_name, data.services, (success) => {
        });
    });
}

const createService = (socket, admins) => {
    socket.on('createService', (data) => {
        const admin = admins.getAdmin(socket);
        if (!admin) return;
        if (!admin) return;
        if (data.service_name === undefined) return;
        if (data.service_price === undefined) return;

        createBdService(data.service_name, data.service_price, (success) => {
        });
    });
}

const updateApplicationStatus = (socket, admins) => {
    socket.on('updateApplicationStatus', (data) => {
        const admin = admins.getAdmin(socket);
        if (!admin) return;
        if (!admin) return;
        if (data.application_id === undefined) return;
        if (data.status_id === undefined) return;

        updateBdApplicationStatus(admin, data.application_id, data.status_id, (success) => {
        });
    });
}

module.exports = {
    setUserRate,
    setUserService,
    deleteUserApplication,
    createUserApplication,
    createRate,
    createService,
    updateApplicationStatus,
};