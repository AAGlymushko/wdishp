const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { User, Admin, UsersList, AdminList } = require('./type.js');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'Anton',
    database: 'DataBase',
    password: 'oO3AokpKqtdIsg2yfWr0M96oqYV4oFOL'
});

connection.connect((err) => {
    const string = "Подключение к БД произошло ";
    console.log(string + (err ? "с ошибкой: " + err : "успешно!"));
});

const addUser = (userHash, userPhon, callback) => {
    const ensurePhoneSql = `INSERT IGNORE INTO database.phone_number (phone_number) VALUES (?)`;
    connection.query(ensurePhoneSql, [userPhon], (err) => {
        if (err) {
            callback(false);
            return;
        }

        const sql = `
            INSERT INTO database.user (user_password, user_phone_number, user_roles_id, user_name)
            SELECT ?, ?, 1, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM user WHERE user_phone_number = ?
            )`;
        const values = [userHash, userPhon, userPhon, userPhon];

        connection.query(sql, values, (err, results) => {
            if (err) {
                callback(false);
            } else {
                callback(results.affectedRows === 1);
            }
        });
    });
};

const checkUser = (data, callback) => {
    const isCheckFirstPass = (data, callback) => {
        const sql = `
            SELECT * FROM database.user
            WHERE (user_phone_number = ? OR user_name = ?) AND isFirstPass = ?
        `;
        const values = [data.phoneNumber, data.name, true];
        connection.query(sql, values, (err, results) => {
            if (err) {
                callback(false);
            } else {
                callback(results.length === 1);
            }
        });
    }

    const sql = `
        SELECT * FROM database.user
        WHERE user_phone_number = ? OR user_name = ?
    `;

    const values = [data.phoneNumber, data.name];
    connection.query(sql, values, (err, userResults) => {
        if (err || userResults.length === 0) {
            callback(false);
            return;
        }

        const user = userResults[0];
        const hashFromDB = user.user_password;
        isCheckFirstPass(data, (isFirst) => {
            let isValidPassword = false;

            if (isFirst) {
                isValidPassword = (data.password === hashFromDB);
            } else {
                isValidPassword = bcrypt.compareSync(data.password, hashFromDB);
            }

            callback(isValidPassword);
        });
    });
};

const redactPerson = (person, callback) => {
    const sql = `
        UPDATE database.user
        SET user_password = ?, isFirstPass = ?, user_name = ?
        WHERE user_phone_number = ?
    `;

    const values = [
        person.password,
        false,
        person.name,
        person.phoneNumber.trim()
    ];

    connection.query(sql, values, (err, result) => {
        if (err) {
            callback(false);
        } else {
            callback(result.affectedRows === 1);
        }
    });
};

const getPersonByName = (name, callback) => {
    const sql = `SELECT * FROM database.user WHERE user_name = ?`;
    connection.query(sql, [name], (err, results) => {
        if (err) {
            return callback(false, null);
        }
        if (results.length === 0) {
            return callback(false, null);
        }
        const row = results[0];
        const person = {
            name: row.user_name,
            password: row.user_password,
            phone_number: row.user_phone_number
        };
        let userInstance = null;
        switch (row.user_roles_id) {
            case 1: userInstance = new User(person.name, person.password, person.phone_number); break;
            case 2: userInstance = new Admin(person.name, person.password, person.phone_number); break;
            default: userInstance = null;
        }
        if (userInstance) {
            callback(true, userInstance);
        } else {
            callback(false, null);
        }
    });
};

const getPersonByPhoneNumber = (phone_number, callback) => {
    const sql = `SELECT * FROM database.user WHERE user_phone_number = ?`;
    connection.query(sql, [phone_number], (err, results) => {
        if (err) {
            return callback(false, null);
        }
        if (results.length === 0) {
            return callback(false, null);
        }
        const row = results[0];
        const person = {
            name: row.user_name,
            password: row.user_password,
            phone_number: row.user_phone_number
        };
        let userInstance = null;
        switch (row.user_roles_id) {
            case 1: userInstance = new User(person.name, person.password, person.phone_number); break;
            case 2: userInstance = new Admin(person.name, person.password, person.phone_number); break;
            default: userInstance = null;
        }
        if (userInstance) {
            callback(true, userInstance);
        } else {
            callback(false, null);
        }
    });
};

const getBdService = (data, callback) => {
    const sqlGetUserId = `
        SELECT user_id
        FROM database.user
        WHERE user_name = ?
    `;

    connection.query(sqlGetUserId, [data.name], (err, userResults) => {
        if (err) {
            return callback(false, null);
        }
        if (userResults.length === 0) {
            return callback(false, null);
        }

        const userId = userResults[0].user_id;

        const sqlServices = `
            SELECT 
                s.service_id AS services_id,
                s.service_price AS services_price,
                s.service_name AS services_name
            FROM database.user_service us
            INNER JOIN database.service s ON us.service_id = s.service_id
            WHERE us.user_id = ?
              AND NOT EXISTS (
                  SELECT 1 FROM database.rate_service rs 
                  WHERE rs.service_id = s.service_id
              )
        `;

        connection.query(sqlServices, [userId], (err, services) => {
            if (err) {
                return callback(false, null);
            }
            if (!services || services.length === 0) {
                return callback(false, null);
            }
            callback(true, services);
        });
    });
};

const getBdRate = (data, callback) => {
    const sqlGetUserId = `
        SELECT user_id
        FROM database.user
        WHERE user_name = ?
    `;

    connection.query(sqlGetUserId, [data.name], (err, userResults) => {
        if (err) {
            return callback(false, null);
        }
        if (userResults.length === 0) {
            return callback(false, null);
        }

        const userId = userResults[0].user_id;

        const sqlGetRateId = `
            SELECT rs.rate_id
            FROM database.user_rate_service urs
            INNER JOIN database.rate_service rs ON urs.rate_service_id = rs.rate_service_id
            WHERE urs.user_id = ?
        `;

        connection.query(sqlGetRateId, [userId], (err, rateResult) => {
            if (err || !rateResult.length) {
                return callback(false, null);
            }

            const rateId = rateResult[0].rate_id;

            const sqlServices = `
                SELECT 
                    r.rate_id,
                    r.rate_name,
                    s.service_id,
                    s.service_price,
                    s.service_name
                FROM database.rate r
                INNER JOIN database.rate_service rs ON r.rate_id = rs.rate_id
                INNER JOIN database.service s ON rs.service_id = s.service_id
                WHERE r.rate_id = ?
                ORDER BY s.service_id
            `;

            connection.query(sqlServices, [rateId], (err, rows) => {
                if (err || !rows || rows.length === 0) {
                    return callback(false, null);
                }

                const rate = {
                    rate_id: rows[0].rate_id,
                    rate_name: rows[0].rate_name,
                    services: rows.map(row => ({
                        service_id: row.service_id,
                        service_price: row.service_price,
                        service_name: row.service_name
                    }))
                };
                callback(true, rate);
            });
        });
    });
};

const getBdRates = (callback) => {
    const sql = `
        SELECT 
            r.rate_id,
            r.rate_name,
            s.service_id,
            s.service_name,
            s.service_price
        FROM database.rate r
        INNER JOIN database.rate_service rs ON r.rate_id = rs.rate_id
        INNER JOIN database.service s ON rs.service_id = s.service_id
        ORDER BY r.rate_id, s.service_id
    `;

    connection.query(sql, (err, rows) => {
        if (err) {
            return callback(false, null);
        }
        if (!rows || rows.length === 0) {
            return callback(false, null);
        }

        const ratesMap = new Map();

        for (const row of rows) {
            const rateId = row.rate_id;

            if (!ratesMap.has(rateId)) {
                ratesMap.set(rateId, {
                    rate_id: rateId,
                    rate_name: row.rate_name,
                    services: []
                });
            }

            const rate = ratesMap.get(rateId);
            rate.services.push({
                service_id: row.service_id,
                service_name: row.service_name,
                service_price: row.service_price
            });
        }

        callback(true, Array.from(ratesMap.values()));
    });
};

const setBdUserRate = (data, rate_id, callback) => {
    const sqlGetUserId = `SELECT user_id FROM database.user WHERE user_name = ?`;
    connection.query(sqlGetUserId, [data.name], (err, userRows) => {
        if (err || !userRows.length) {
            return callback(false);
        }
        const userId = userRows[0].user_id;

        const sqlGetRateService = `SELECT rate_service_id FROM database.rate_service WHERE rate_id = ? LIMIT 1`;
        connection.query(sqlGetRateService, [rate_id], (err, rsRows) => {
            if (err || !rsRows.length) {
                return callback(false);
            }
            const rateServiceId = rsRows[0].rate_service_id;

            const sqlUpsert = `
                INSERT INTO database.user_rate_service (user_id, rate_service_id)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE rate_service_id = ?
            `;
            connection.query(sqlUpsert, [userId, rateServiceId, rateServiceId], (err, result) => {
                if (err) {
                    callback(false);
                } else {
                    callback(result.affectedRows > 0);
                }
            });
        });
    });
};

const getBdUserServices = (data, callback) => {
    const sqlGetUserId = `SELECT user_id FROM database.user WHERE user_name = ?`;
    connection.query(sqlGetUserId, [data.name], (err, userRows) => {
        if (err) {
            return callback(false, null);
        }
        if (userRows.length === 0) {
            return callback(false, null);
        }
        const userId = userRows[0].user_id;

        const sqlServices = `
            SELECT 
                s.service_id,
                s.service_name,
                s.service_price
            FROM database.user_service us
            INNER JOIN database.service s ON us.service_id = s.service_id
            WHERE us.user_id = ?
              AND NOT EXISTS (
                  SELECT 1 FROM database.rate_service rs 
                  WHERE rs.service_id = s.service_id
              )
        `;
        connection.query(sqlServices, [userId], (err, services) => {
            if (err) {
                return callback(false, null);
            }
            if (!services) {
                return callback(false, null);
            }
            callback(true, services);
        });
    });
};

const getBdServices = (callback) => {
    const sql = `
        SELECT 
            service_id,
            service_name,
            service_price
        FROM database.service s
        WHERE NOT EXISTS (
            SELECT 1 
            FROM database.rate_service rs 
            WHERE rs.service_id = s.service_id
        )
    `;

    connection.query(sql, (err, services) => {
        if (err) {
            return callback(false, null);
        }
        if (!services) {
            return callback(false, null);
        }
        callback(true, services);
    });
};

const setBdUserService = (data, service_id, callback) => {
    const sql = `
    SELECT user_id
    FROM database.user
    WHERE user_name = ?`;
    connection.query(sql, [data.name], (err, result) => {
        if (err) {
            return callback(false);
        }
        if (!result.length) {
            return callback(false);
        }
        const user_id = result[0].user_id;

        const checkTariffSql = `
            SELECT 1
            FROM database.user_rate_service urs
            JOIN database.rate_service rs ON urs.rate_service_id = rs.rate_service_id
            WHERE urs.user_id = ? AND rs.service_id = ?
        `;
        connection.query(checkTariffSql, [user_id, service_id], (err, tariffResult) => {
            if (err) {
                return callback(false);
            }

            if (tariffResult.length > 0) {
                return callback(false);
            }

            const sql0 = `
            SELECT user_service_id 
            FROM database.user_service
            WHERE user_id = ? AND service_id = ?`;
            const values = [user_id, service_id];
            connection.query(sql0, values, (err, result) => {
                if (err) {
                    return callback(false);
                }
                if (result.length > 0) {
                    const sql1 = `
                    DELETE 
                    FROM database.user_service
                    WHERE user_id = ? AND service_id = ?`;
                    connection.query(sql1, values, (err) => {
                        return callback(!err);
                    });
                } else {
                    const sql1 = `
                    INSERT
                    INTO database.user_service (user_id, service_id)
                    VALUES (?, ?)`;
                    connection.query(sql1, values, (err) => {
                        return callback(!err);
                    });
                }
            });
        });
    });
};

const getBdUserApplications = (data, callback) => {
    const sql = `SELECT user_id FROM database.user WHERE user_name = ?`;

    connection.query(sql, [data.name], (err, result) => {
        if (err) return callback(false, null);
        if (!result.length) return callback(false, null);

        const sql0 = `
            SELECT a.application_value, a.status_id, s.status_name, a.application_id
            FROM database.application a
            JOIN database.status s ON s.status_id = a.status_id
            WHERE a.user_id = ?
        `;

        connection.query(sql0, [result[0].user_id], (err, rows) => {
            if (err) return callback(false, null);
            if (!rows.length) return callback(false, null);

            const applications = rows.map(row => {
                return {
                    application_id: row.application_id,
                    application_value: row.application_value,
                    status_name: row.status_name,
                    status_id: row.status_id
                };
            });

            applications.sort((a, b) => a.status_id - b.status_id);
            return callback(true, applications);
        });
    });
};

const getBdApplications = (callback) => {
    const sql = `
        SELECT 
            a.application_id,
            a.application_value,
            a.status_id,
            s.status_name,
            u.user_phone_number
        FROM database.application a
        JOIN database.status s ON s.status_id = a.status_id
        LEFT JOIN database.user u ON u.user_id = a.user_id
        ORDER BY a.status_id
    `;

    connection.query(sql, [], (err, rows) => {
        if (err) return callback(false, null);
        if (!rows.length) return callback(false, null);
        callback(true, rows);
    });
};

const deleteUserBdApplication = (data, application_id, callback) => {
    const sql = `
        SELECT user_id
        FROM database.user
        WHERE user_name = ?
    `;
    connection.query(sql, [data.name], (err, result) => {
        if (err) return callback(false);
        if (!result.length) return callback(false);

        const user_id = result[0].user_id;

        const deleteSql = `
            DELETE FROM database.application
            WHERE user_id = ? AND application_id = ?
        `;
        connection.query(deleteSql, [user_id, application_id], (err, deleteResult) => {
            if (err) return callback(false);
            return callback(true);
        });
    });
};

const createBdUserApplication = (data, application_value, callback) => {
    const sql = `
    SELECT user_id
    FROM database.user
    WHERE user_name = ?`;
    connection.query(sql, [data.name], (err, result) => {
        if (err) return callback(false);
        if (!result.length) return callback(false);

        const user_id = result[0].user_id;

        const insertSql = `
            INSERT INTO database.application (user_id, application_value, status_id)
            VALUES (?, ?, 3)
        `;
        connection.query(insertSql, [user_id, application_value], (err, insertResult) => {
            if (err) return callback(false);
            return callback(true);
        });
    });
};

const createBdRate = (rate_name, services, callback) => {
    const createRateSql = `INSERT INTO database.rate (rate_name) VALUES (?)`;
    connection.query(createRateSql, [rate_name], (err, result) => {
        if (err) {
            return callback(false);
        }

        const rateId = result.insertId;

        if (services.length === 0) {
            return callback(false);
        }

        let i = 0;

        services.forEach(service => {
            const insertServiceSql = `INSERT INTO database.service (service_name, service_price) VALUES (?, ?)`;
            connection.query(insertServiceSql, [service.service_name, service.service_price], (err, result) => {
                if (err) {
                    return callback(false);
                }
                const insertRateServiceSql = `INSERT INTO database.rate_service (rate_id, service_id) VALUES (?, ?)`
                connection.query(insertRateServiceSql, [rateId, result.insertId], (err, result) => {
                    if (err) {
                        return callback(false);
                    }
                    ++i;
                    if (i === services.length) {
                        callback(true);
                    }
                });
            });
        });
    });
};

const createBdService = (service_name, service_price, callback) => {
    const insertServiceSql = `
    INSERT INTO database.service (service_name, service_price) VALUES (?, ?)
    `;
    connection.query(insertServiceSql, [service_name, service_price], (err, result) => {
        if (err) {
            return callback(false);
        }
        return callback(true);
    });
}

const updateBdApplicationStatus = (data, application_id, status_id, callback) => {
    const sql = `
    SELECT user_id
    FROM database.user
    WHERE user_name = ?`;
    connection.query(sql, [data.name], (err, result) => {
        if (err) {
            return callback(false);
        }
        const adminId = result[0].user_id;
        const updateApplicationSql = `
        UPDATE database.application
        SET admin_id = ?, status_id = ?
        WHERE application_id = ?
        `;
        connection.query(updateApplicationSql, [adminId, status_id, application_id], (err, result) => {
            if (err) {
                return callback(false);
            }
            return callback(true);
        });
    });
}

//setTimeout(() => {
//    connection.end((err) => {
//        const string = "Отключение от БД произошло ";
//        if (err) {
//            console.log(string + "с ошибкой: " + err);
//        } else {
//            console.log(string + "успешно!");
//        }
//    });
//}, 5000);

module.exports = {
    getBdRate,
    getBdRates,
    getBdServices,
    getBdUserServices,
    getBdApplications,
    getBdUserApplications,
    deleteUserBdApplication,
    createBdUserApplication,
    createBdRate,
    createBdService,
    setBdUserRate,
    setBdUserService,
    updateBdApplicationStatus,
    addUser,
    checkUser,
    connection,
    getBdService,
    redactPerson,
    getPersonByName,
    getPersonByPhoneNumber
};
