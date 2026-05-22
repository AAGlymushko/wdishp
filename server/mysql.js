const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { User, Admin, UsersList, AdminList } = require('./type.js');

const pool = new Pool({
    ssl: true,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    host: 'dpg-d885r6km0tmc738egc2g-a.frankfurt-postgres.render.com',
    port: 5432,
    user: 'anton',
    database: 'database_272z',
    password: 'oO3AokpKqtdIsg2yfWr0M96oqYV4oFOL'
});

pool.connect((err) => {
    const string = "Подключение к БД произошло ";
    console.log(string + (err ? "с ошибкой: " + err : "успешно!"));
});

const addUser = (userHash, userPhon, callback) => {
    const ensurePhoneSql = `
        INSERT INTO phone_number (phone_number)
        VALUES ($1)
        ON CONFLICT (phone_number) DO NOTHING
    `;
    pool.query(ensurePhoneSql, [userPhon], (err) => {
        if (err) {
            callback(false);
            return;
        }

        const sql = `
            INSERT INTO app_user (user_password, user_phone_number, user_roles_id, user_name)
            SELECT $1, $2, 1, $3
            WHERE NOT EXISTS (
                SELECT 1 FROM app_user WHERE user_phone_number = $4
            )
        `;
        const values = [userHash, userPhon, userPhon, userPhon];

        pool.query(sql, values, (err, result) => {
            if (err) {
                callback(false);
            } else {
                callback(result.rowCount === 1);
            }
        });
    });
};

const checkUser = (data, callback) => {
    const isCheckFirstPass = (data, callback) => {
        const sql = `
            SELECT * FROM app_user
            WHERE (user_phone_number = $1 OR user_name = $2) AND is_first_pass = $3
        `;
        const values = [data.phoneNumber, data.name, true];
        pool.query(sql, values, (err, results) => {
            if (err) {
                callback(false);
            } else {
                callback(results.rows.length === 1);
            }
        });
    }

    const sql = `
        SELECT * FROM app_user
        WHERE user_phone_number = $1 OR user_name = $2
    `;
    const values = [data.phoneNumber, data.name];
    pool.query(sql, values, (err, userResults) => {
        if (err || userResults.rows.length === 0) {
            callback(false);
            return;
        }

        const user = userResults.rows[0];
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
        UPDATE app_user
        SET user_password = $1, is_first_pass = $2, user_name = $3
        WHERE user_phone_number = $4
    `;
    const values = [
        person.password,
        false,
        person.name,
        person.phoneNumber.trim()
    ];
    pool.query(sql, values, (err, result) => {
        if (err) {
            callback(false);
        } else {
            callback(result.rowCount === 1);
        }
    });
};

const getPersonByName = (name, callback) => {
    const sql = `SELECT * FROM app_user WHERE user_name = $1`;
    pool.query(sql, [name], (err, results) => {
        if (err) {
            return callback(false, null);
        }
        if (results.rows.length === 0) {
            return callback(false, null);
        }
        const row = results.rows[0];
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
    const sql = `SELECT * FROM app_user WHERE user_phone_number = $1`;
    pool.query(sql, [phone_number], (err, results) => {
        if (err) {
            return callback(false, null);
        }
        if (results.rows.length === 0) {
            return callback(false, null);
        }
        const row = results.rows[0];
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
    const sqlGetUserId = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sqlGetUserId, [data.name], (err, userResults) => {
        if (err) {
            return callback(false, null);
        }
        if (userResults.rows.length === 0) {
            return callback(false, null);
        }
        const userId = userResults.rows[0].user_id;

        const sqlServices = `
            SELECT 
                s.service_id AS services_id,
                s.service_price AS services_price,
                s.service_name AS services_name
            FROM user_service us
            INNER JOIN service s ON us.service_id = s.service_id
            WHERE us.user_id = $1
              AND NOT EXISTS (
                  SELECT 1 FROM rate_service rs 
                  WHERE rs.service_id = s.service_id
              )
        `;
        pool.query(sqlServices, [userId], (err, services) => {
            if (err) {
                return callback(false, null);
            }
            if (!services.rows || services.rows.length === 0) {
                return callback(false, null);
            }
            callback(true, services.rows);
        });
    });
};

const getBdRate = (data, callback) => {
    const sqlGetUserId = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sqlGetUserId, [data.name], (err, userResults) => {
        if (err) {
            return callback(false, null);
        }
        if (userResults.rows.length === 0) {
            return callback(false, null);
        }
        const userId = userResults.rows[0].user_id;

        const sqlGetRateId = `
            SELECT rs.rate_id
            FROM user_rate_service urs
            INNER JOIN rate_service rs ON urs.rate_service_id = rs.rate_service_id
            WHERE urs.user_id = $1
        `;
        pool.query(sqlGetRateId, [userId], (err, rateResult) => {
            if (err || !rateResult.rows.length) {
                return callback(false, null);
            }
            const rateId = rateResult.rows[0].rate_id;

            const sqlServices = `
                SELECT 
                    r.rate_id,
                    r.rate_name,
                    s.service_id,
                    s.service_price,
                    s.service_name
                FROM rate r
                INNER JOIN rate_service rs ON r.rate_id = rs.rate_id
                INNER JOIN service s ON rs.service_id = s.service_id
                WHERE r.rate_id = $1
                ORDER BY s.service_id
            `;
            pool.query(sqlServices, [rateId], (err, rows) => {
                if (err || !rows.rows || rows.rows.length === 0) {
                    return callback(false, null);
                }
                const rate = {
                    rate_id: rows.rows[0].rate_id,
                    rate_name: rows.rows[0].rate_name,
                    services: rows.rows.map(row => ({
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
        FROM rate r
        INNER JOIN rate_service rs ON r.rate_id = rs.rate_id
        INNER JOIN service s ON rs.service_id = s.service_id
        ORDER BY r.rate_id, s.service_id
    `;
    pool.query(sql, (err, rows) => {
        if (err) {
            return callback(false, null);
        }
        if (!rows.rows || rows.rows.length === 0) {
            return callback(false, null);
        }
        const ratesMap = new Map();
        for (const row of rows.rows) {
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
    const sqlGetUserId = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sqlGetUserId, [data.name], (err, userRows) => {
        if (err || !userRows.rows.length) {
            return callback(false);
        }
        const userId = userRows.rows[0].user_id;

        const sqlGetRateService = `SELECT rate_service_id FROM rate_service WHERE rate_id = $1 LIMIT 1`;
        pool.query(sqlGetRateService, [rate_id], (err, rsRows) => {
            if (err || !rsRows.rows.length) {
                return callback(false);
            }
            const rateServiceId = rsRows.rows[0].rate_service_id;

            const sqlUpsert = `
                INSERT INTO user_rate_service (user_id, rate_service_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE SET rate_service_id = EXCLUDED.rate_service_id
            `;
            pool.query(sqlUpsert, [userId, rateServiceId], (err, result) => {
                if (err) {
                    callback(false);
                } else {
                    callback(result.rowCount > 0);
                }
            });
        });
    });
};

const getBdUserServices = (data, callback) => {
    const sqlGetUserId = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sqlGetUserId, [data.name], (err, userRows) => {
        if (err) {
            return callback(false, null);
        }
        if (userRows.rows.length === 0) {
            return callback(false, null);
        }
        const userId = userRows.rows[0].user_id;

        const sqlServices = `
            SELECT 
                s.service_id,
                s.service_name,
                s.service_price
            FROM user_service us
            INNER JOIN service s ON us.service_id = s.service_id
            WHERE us.user_id = $1
              AND NOT EXISTS (
                  SELECT 1 FROM rate_service rs 
                  WHERE rs.service_id = s.service_id
              )
        `;
        pool.query(sqlServices, [userId], (err, services) => {
            if (err) {
                return callback(false, null);
            }
            if (!services.rows) {
                return callback(false, null);
            }
            callback(true, services.rows);
        });
    });
};

const getBdServices = (callback) => {
    const sql = `
        SELECT 
            service_id,
            service_name,
            service_price
        FROM service s
        WHERE NOT EXISTS (
            SELECT 1 
            FROM rate_service rs 
            WHERE rs.service_id = s.service_id
        )
    `;
    pool.query(sql, (err, services) => {
        if (err) {
            return callback(false, null);
        }
        if (!services.rows) {
            return callback(false, null);
        }
        callback(true, services.rows);
    });
};

const setBdUserService = (data, service_id, callback) => {
    const sql = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sql, [data.name], (err, result) => {
        if (err) {
            return callback(false);
        }
        if (!result.rows.length) {
            return callback(false);
        }
        const user_id = result.rows[0].user_id;

        const checkTariffSql = `
            SELECT 1
            FROM user_rate_service urs
            JOIN rate_service rs ON urs.rate_service_id = rs.rate_service_id
            WHERE urs.user_id = $1 AND rs.service_id = $2
        `;
        pool.query(checkTariffSql, [user_id, service_id], (err, tariffResult) => {
            if (err) {
                return callback(false);
            }
            if (tariffResult.rows.length > 0) {
                return callback(false);
            }

            const sql0 = `
                SELECT user_service_id 
                FROM user_service
                WHERE user_id = $1 AND service_id = $2
            `;
            const values = [user_id, service_id];
            pool.query(sql0, values, (err, result) => {
                if (err) {
                    return callback(false);
                }
                if (result.rows.length > 0) {
                    const sql1 = `
                        DELETE FROM user_service
                        WHERE user_id = $1 AND service_id = $2
                    `;
                    pool.query(sql1, values, (err) => {
                        return callback(!err);
                    });
                } else {
                    const sql1 = `
                        INSERT INTO user_service (user_id, service_id)
                        VALUES ($1, $2)
                    `;
                    pool.query(sql1, values, (err) => {
                        return callback(!err);
                    });
                }
            });
        });
    });
};

const getBdUserApplications = (data, callback) => {
    const sql = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sql, [data.name], (err, result) => {
        if (err) return callback(false, null);
        if (!result.rows.length) return callback(false, null);

        const sql0 = `
            SELECT a.application_value, a.status_id, s.status_name, a.application_id
            FROM application a
            JOIN status s ON s.status_id = a.status_id
            WHERE a.user_id = $1
        `;
        pool.query(sql0, [result.rows[0].user_id], (err, rows) => {
            if (err) return callback(false, null);
            if (!rows.rows.length) return callback(false, null);

            const applications = rows.rows.map(row => ({
                application_id: row.application_id,
                application_value: row.application_value,
                status_name: row.status_name,
                status_id: row.status_id
            }));

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
        FROM application a
        JOIN status s ON s.status_id = a.status_id
        LEFT JOIN app_user u ON u.user_id = a.user_id
        ORDER BY a.status_id
    `;
    pool.query(sql, [], (err, rows) => {
        if (err) return callback(false, null);
        if (!rows.rows.length) return callback(false, null);
        callback(true, rows.rows);
    });
};

const deleteUserBdApplication = (data, application_id, callback) => {
    const sql = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sql, [data.name], (err, result) => {
        if (err) return callback(false);
        if (!result.rows.length) return callback(false);

        const user_id = result.rows[0].user_id;

        const deleteSql = `
            DELETE FROM application
            WHERE user_id = $1 AND application_id = $2
        `;
        pool.query(deleteSql, [user_id, application_id], (err) => {
            if (err) return callback(false);
            return callback(true);
        });
    });
};

const createBdUserApplication = (data, application_value, callback) => {
    const sql = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sql, [data.name], (err, result) => {
        if (err) return callback(false);
        if (!result.rows.length) return callback(false);

        const user_id = result.rows[0].user_id;

        const insertSql = `
            INSERT INTO application (user_id, application_value, status_id)
            VALUES ($1, $2, 3)
        `;
        pool.query(insertSql, [user_id, application_value], (err) => {
            if (err) return callback(false);
            return callback(true);
        });
    });
};

const createBdRate = (rate_name, services, callback) => {
    const createRateSql = `INSERT INTO rate (rate_name) VALUES ($1) RETURNING rate_id`;
    pool.query(createRateSql, [rate_name], (err, result) => {
        if (err) {
            return callback(false);
        }
        const rateId = result.rows[0].rate_id;

        if (services.length === 0) {
            return callback(false);
        }

        let i = 0;
        let hasError = false;

        services.forEach(service => {
            if (hasError) return;
            const insertServiceSql = `INSERT INTO service (service_name, service_price) VALUES ($1, $2) RETURNING service_id`;
            pool.query(insertServiceSql, [service.service_name, service.service_price], (err, result) => {
                if (err) {
                    hasError = true;
                    return callback(false);
                }
                const serviceId = result.rows[0].service_id;
                const insertRateServiceSql = `INSERT INTO rate_service (rate_id, service_id) VALUES ($1, $2)`;
                pool.query(insertRateServiceSql, [rateId, serviceId], (err) => {
                    if (err) {
                        hasError = true;
                        return callback(false);
                    }
                    ++i;
                    if (i === services.length && !hasError) {
                        callback(true);
                    }
                });
            });
        });
    });
};

const createBdService = (service_name, service_price, callback) => {
    const insertServiceSql = `
        INSERT INTO service (service_name, service_price) VALUES ($1, $2)
    `;
    pool.query(insertServiceSql, [service_name, service_price], (err) => {
        if (err) {
            return callback(false);
        }
        return callback(true);
    });
};

const updateBdApplicationStatus = (data, application_id, status_id, callback) => {
    const sql = `SELECT user_id FROM app_user WHERE user_name = $1`;
    pool.query(sql, [data.name], (err, result) => {
        if (err) {
            return callback(false);
        }
        const adminId = result.rows[0].user_id;
        const updateApplicationSql = `
            UPDATE application
            SET admin_id = $1, status_id = $2
            WHERE application_id = $3
        `;
        pool.query(updateApplicationSql, [adminId, status_id, application_id], (err) => {
            if (err) {
                return callback(false);
            }
            return callback(true);
        });
    });
};

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
    connection: pool,
    getBdService,
    redactPerson,
    getPersonByName,
    getPersonByPhoneNumber
};
