import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://wdishpeasylifeserver.onrender.com/');

let name = null;
let password = null;
let phoneNumber = null;
let isAuthorized = false;
let isAdmin = false;

const createBlocks = (index) => {
    const arr = new Array(7).fill(false);
    arr[index] = true;
    return arr;
};

function Authorization() {
    const [isUser, setIsUser] = useState(true);

    useEffect(() => {
        const handleAuth = (data) => {
            alert(data.message);
            if (data.message === 'success') {
                password = data.password;
                phoneNumber = data.phoneNumber;
                name = data.name;
                isAuthorized = true;
            }
        };
        const handleAdminAuth = (data) => {
            alert(data.message);
            if (data.message === 'success') {
                password = data.password;
                name = data.name;
                isAuthorized = true;
                isAdmin = true;
            }
        };

        socket.on('authorization', handleAuth);
        socket.on('authorizationAdmin', handleAdminAuth);
        return () => {
            socket.off('authorization', handleAuth);
            socket.off('authorizationAdmin', handleAdminAuth);
        };
    }, []);

    const send = () => {
        socket.emit(isUser ? 'authorization' : 'authorizationAdmin', {
            password: document.getElementById('password').value,
            phoneNumber: isUser ? document.getElementById('phoneNumber')?.value : undefined,
            name: !isUser ? document.getElementById('name')?.value : undefined,
        });
    };

    return (
        <div className="centered-page">
            <div className="form-card">
                <h2>Авторизация</h2>
                {isUser ? (
                    <input id="phoneNumber" className="input" placeholder="Номер телефона" defaultValue={phoneNumber || ''} />
                ) : (
                    <input id="name" className="input" placeholder="Имя" defaultValue={name || ''} />
                )}
                <input id="password" className="input" type="password" placeholder="Пароль" />
                <button className="btn" onClick={() => setIsUser(!isUser)}>
                    {isUser ? 'Войти как администратор' : 'Войти как пользователь'}
                </button>
                <button className="btn" onClick={send}>Войти</button>
            </div>
        </div>
    );
}

function MainWindow() {
    return (
        <div className="centered-page">
            <h1 className="main-title">EasyLife</h1>
            <h2 className="main-signature">Ваша телефонная компания</h2>
        </div>
    );
}

function AccountWindow({ setBlocks }) {
    useEffect(() => {
        socket.on('redactUserData', (data) => {
            alert(data.isPassword ? 'success' : 'error');
            if (data.isPassword) {
                password = data.password;
                name = data.name;
            }
        });
        socket.on('logOutOfAccount', () => {
            setBlocks(createBlocks(1));
            name = null;
            password = null;
            phoneNumber = null;
            isAuthorized = false;
            isAdmin = false;
        });
        return () => {
            socket.off('redactUserData');
            socket.off('logOutOfAccount');
        };
    }, []);

    return (
        <div className="centered-page">
            <div className="form-card">
                <h2>Личный кабинет</h2>
                {
                    !isAdmin &&  <label style={{ alignSelf: 'flex-start', color: '#bbe4fa' }}>Телефон</label>
                }
                {
                    !isAdmin && <input className="input" readOnly value={phoneNumber || ''} />
                }
                <label style={{ alignSelf: 'flex-start', color: '#bbe4fa' }}>Имя</label>
                <input id="name" className="input" defaultValue={name || ''} />
                <label style={{ alignSelf: 'flex-start', color: '#bbe4fa' }}>Пароль</label>
                <input id="password" className="input" type="password" defaultValue={password || ''} />
                <button className="btn" onClick={() => socket.emit('redactUserData', {
                    password: document.getElementById('password').value,
                    name: document.getElementById('name').value
                })}>Изменить</button>
                <button className="btn danger" onClick={() => socket.emit('logOutOfAccount')}>Выйти</button>
            </div>
        </div>
    );
}

function UnAuthorized() {
    return (
        <div className="centered-page">
            <h2>Вы не авторизованы</h2>
        </div>
    );
}

function Tariffs({ block }) {
    const [userTariffs, setUserTariffs] = useState([]);
    const [allTariffs, setAllTariffs] = useState([]);

    useEffect(() => {
        if (block) {
            socket.emit('getRate');
            socket.emit('getRates');
        }
    }, [block]);

    useEffect(() => {
        socket.on('getRate', (data) => { if (data.rate) setUserTariffs(data.rate); });
        socket.on('getRates', (data) => { if (data.rates) setAllTariffs(data.rates); });
        return () => {
            socket.off('getRate');
            socket.off('getRates');
        };
    }, []);

    const activeId = userTariffs[0]?.rate_id;
    const displayed = activeId
        ? [userTariffs[0], ...allTariffs.filter(t => t.rate_id !== activeId)]
        : allTariffs;

    const handleSelect = (tariff) => {
        socket.emit('setUserRate', { rate_id: tariff.rate_id });
        setTimeout(() => {
            socket.emit('getRate');
            socket.emit('getRates');
        }, 100);
    };

    return (
        <div className="section">
            <h2>Тарифы</h2>
            {displayed.length === 0 ? (
                <p className="no-items">Нет доступных тарифов</p>
            ) : (
                <div className="grid">
                    {displayed.map(t => (
                        <div key={t.rate_id} className="card">
                            <h3>{t.rate_name || `Тариф #${t.rate_id}`}</h3>
                            {t.services?.map(s => (
                                <div key={s.service_id} className="row">
                                    <span>{s.service_name}</span>
                                    <span>{s.service_price} ₽</span>
                                </div>
                            ))}
                            <button
                                className="btn"
                                disabled={activeId === t.rate_id}
                                style={{ opacity: activeId === t.rate_id ? 0.6 : 1 }}
                                onClick={() => handleSelect(t)}
                            >
                                {activeId === t.rate_id ? 'Текущий тариф' : 'Выбрать'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Services({ block }) {
    const [userServices, setUserServices] = useState([]);
    const [allServices, setAllServices] = useState([]);

    useEffect(() => {
        if (block) {
            socket.emit('getUserServices');
            socket.emit('getServices');
        }
    }, [block]);

    useEffect(() => {
        socket.on('getUserServices', (data) => { if (data.services) setUserServices(data.services); });
        socket.on('getServices', (data) => { if (data.services) setAllServices(data.services); });
        return () => {
            socket.off('getUserServices');
            socket.off('getServices');
        };
    }, []);

    const toggleService = (service) => {
        socket.emit('setUserService', { service_id: service.service_id });
        setTimeout(() => {
            socket.emit('getUserServices');
            socket.emit('getServices');
        }, 100);
    };

    return (
        <div className="section">
            <h2>Услуги</h2>
            {allServices.length === 0 ? (
                <p className="no-items">Нет доступных услуг</p>
            ) : (
                <div className="grid">
                    {allServices.map(s => {
                        const isConnected = !userServices.some(us => us.service_id === s.service_id);
                        return (
                            <div key={s.service_id} className="card">
                                <h3>{s.service_name || `Услуга #${s.service_id}`}</h3>
                                <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {s.service_price} ₽ / мес
                                </p>
                                {s.service_description && <p style={{ color: '#475569' }}>{s.service_description}</p>}
                                <button
                                    className="btn"
                                    onClick={() => toggleService(s)}
                                    style={{ opacity: !isConnected ? 0.6 : 1 }}
                                >
                                    {isConnected ? 'Подключить' : 'Отключить'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Requests() {
    const [requests, setRequests] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        socket.emit('getUserApplications');
        socket.on('getUserApplications', (data) => {
            setRequests(data.result || []);
            setLoading(false);
        });
        return () => socket.off('getUserApplications');
    }, []);

    const createRequest = () => {
        const val = document.getElementById('new-request-text').value;
        socket.emit('createUserApplication', { application_value: val });
        setTimeout(() => {
            socket.emit('getUserApplications');
            setShowCreate(false);
        }, 300);
    };

    const deleteRequest = (id) => {
        socket.emit('deleteUserApplication', { application_id: id });
        setTimeout(() => {
            socket.emit('getUserApplications');
            setSelected(null);
        }, 300);
    };

    return (
        <div className="section" style={{ height: 'auto', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Мои заявки</h2>
                <button className="btn small" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? 'Отмена' : 'Создать заявку'}
                </button>
            </div>

            {showCreate && (
                <div className="create-form">
                    <textarea id="new-request-text" rows={4} placeholder="Текст заявки..." />
                    <div className="actions">
                        <button className="btn small" onClick={createRequest}>Отправить</button>
                        <button className="btn small" style={{ background: '#9e9e9e' }} onClick={() => setShowCreate(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="requests-layout">
                <div className="requests-list">
                    {requests.length === 0 ? (
                        <p className="placeholder-text">Нет заявок</p>
                    ) : (
                        requests.map(req => (
                            <div
                                key={req.application_id}
                                className={`request-item ${selected?.application_id === req.application_id ? 'active' : ''}`}
                                onClick={() => setSelected(req)}
                            >
                                <div className="request-meta">
                                    <span>{req.application_value.slice(0, 40)}...</span>
                                    <span className="status" style={{ background: req.status_id === 1 ? '#fff3e0' : req.status_id === 2 ? '#e8f5e9' : '#ffebee' }}>
                                        {req.status_name}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="details-panel">
                    {selected ? (
                        <>
                            <div className="details-header">
                                <h3 style={{ margin: 0 }}>Заявка</h3>
                                <button className="btn small danger" onClick={() => deleteRequest(selected.application_id)}>Удалить</button>
                            </div>
                            <div className="full-text">{selected.application_value}</div>
                        </>
                    ) : (
                        <p className="placeholder-text">Выберите заявку</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function AdminTariffs() {
    const [tariffs, setTariffs] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [servicesList, setServicesList] = useState([{ name: '', price: '' }]);

    useEffect(() => {
        socket.emit('getRates');
        socket.on('getRates', (data) => {
            if (data.rates) setTariffs(data.rates);
        });
        return () => socket.off('getRates');
    }, []);

    const addServiceField = () => setServicesList([...servicesList, { name: '', price: '' }]);
    const updateService = (index, field, value) => {
        const updated = [...servicesList];
        updated[index][field] = value;
        setServicesList(updated);
    };
    const removeService = (index) => setServicesList(servicesList.filter((_, i) => i !== index));

    const createTariff = () => {
        const services = servicesList
            .filter(s => s.name.trim() && s.price.trim())
            .map(s => ({ service_name: s.name, service_price: s.price }));
        if (!newName.trim() || services.length === 0) {
            alert('Введите название тарифа и хотя бы одну услугу');
            return;
        }
        socket.emit('createRate', { rate_name: newName, services });
        setTimeout(() => {
            socket.emit('getRates');
            setShowCreate(false);
            setNewName('');
            setServicesList([{ name: '', price: '' }]);
        }, 300);
    };

    return (
        <div className="section">
            <h2>Управление тарифами</h2>
            <button className="btn small" style={{ marginBottom: 16 }} onClick={() => setShowCreate(!showCreate)}>
                {showCreate ? 'Отмена' : 'Создать тариф'}
            </button>

            {showCreate && (
                <div className="create-form">
                    <input
                        className="input"
                        style={{ background: '#fff', color: '#333', marginBottom: 12 }}
                        placeholder="Название тарифа"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <h4 style={{ margin: '0 0 8px' }}>Услуги в тарифе</h4>
                    {servicesList.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <input
                                className="input"
                                style={{ background: '#fff', color: '#333', flex: 2 }}
                                placeholder="Название услуги"
                                value={s.name}
                                onChange={e => updateService(idx, 'name', e.target.value)}
                            />
                            <input
                                className="input"
                                style={{ background: '#fff', color: '#333', flex: 1 }}
                                placeholder="Цена"
                                value={s.price}
                                onChange={e => updateService(idx, 'price', e.target.value)}
                            />
                            {servicesList.length > 1 && (
                                <button className="btn small danger" onClick={() => removeService(idx)}>✕</button>
                            )}
                        </div>
                    ))}
                    <button className="btn small" style={{ marginRight: 8 }} onClick={addServiceField}>+ Добавить услугу</button>
                    <div className="actions">
                        <button className="btn small" onClick={createTariff}>Создать</button>
                        <button className="btn small" style={{ background: '#9e9e9e' }} onClick={() => setShowCreate(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="grid">
                {tariffs.length === 0 ? (
                    <p className="no-items">Нет тарифов</p>
                ) : (
                    tariffs.map(t => (
                        <div key={t.rate_id} className="card">
                            <h3>{t.rate_name}</h3>
                            {t.services?.map(s => (
                                <div key={s.service_id} className="row">
                                    <span>{s.service_name}</span>
                                    <span>{s.service_price} ₽</span>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function AdminServices() {
    const [services, setServices] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');

    useEffect(() => {
        socket.emit('getServices');
        socket.on('getServices', (data) => {
            if (data.services) setServices(data.services);
        });
        return () => socket.off('getServices');
    }, []);

    const createService = () => {
        if (!newName.trim() || !newPrice.trim()) {
            alert('Заполните название и цену');
            return;
        }
        socket.emit('createService', { service_name: newName, service_price: newPrice });
        setTimeout(() => {
            socket.emit('getServices');
            setShowCreate(false);
            setNewName('');
            setNewPrice('');
        }, 300);
    };

    return (
        <div className="section">
            <h2>Управление услугами</h2>
            <button className="btn small" style={{ marginBottom: 16 }} onClick={() => setShowCreate(!showCreate)}>
                {showCreate ? 'Отмена' : 'Создать услугу'}
            </button>

            {showCreate && (
                <div className="create-form">
                    <input
                        className="input"
                        style={{ background: '#fff', color: '#333', marginBottom: 8 }}
                        placeholder="Название услуги"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <input
                        className="input"
                        style={{ background: '#fff', color: '#333', marginBottom: 12 }}
                        placeholder="Цена"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                    />
                    <div className="actions">
                        <button className="btn small" onClick={createService}>Создать</button>
                        <button className="btn small" style={{ background: '#9e9e9e' }} onClick={() => setShowCreate(false)}>Отмена</button>
                    </div>
                </div>
            )}

            <div className="grid">
                {services.length === 0 ? (
                    <p className="no-items">Нет услуг</p>
                ) : (
                    services.map(s => (
                        <div key={s.service_id} className="card">
                            <h3>{s.service_name}</h3>
                            <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#3b82f6' }}>{s.service_price} ₽</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        socket.emit('getApplications');
        socket.on('getApplications', (data) => {
            if (data.result) setRequests(data.result);
        });
        return () => socket.off('getApplications');
    }, []);

    const updateStatus = (id, statusId) => {
        socket.emit('updateApplicationStatus', { application_id: id, status_id: statusId });
        setTimeout(() => {
            socket.emit('getApplications');
            setSelected(null);
        }, 300);
    };

    return (
        <div className="section">
            <h2>Заявки клиентов</h2>
            <div className="requests-layout">
                <div className="requests-list">
                    {requests.length === 0 ? (
                        <p className="placeholder-text">Нет заявок</p>
                    ) : (
                        requests.map(req => (
                            <div
                                key={req.application_id}
                                className={`request-item ${selected?.application_id === req.application_id ? 'active' : ''}`}
                                onClick={() => setSelected(req)}>
                                <div className="request-meta">
                                    <span>{req.application_value.slice(0, 40)}...</span>
                                    <span className="status" style={{ background: req.status_id === 1 ? '#fff3e0' : req.status_id === 2 ? '#e8f5e9' : '#ffebee' }}>
                                        {req.status_name}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="details-panel">
                    {selected ? (
                        <>
                            <div className="details-header">
                                <h3 style={{ margin: 0 }}>Заявка #{selected.application_id}</h3>
                                {selected.status_id === 3 && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn small" style={{ background: '#2e7d32' }} onClick={() => updateStatus(selected.application_id, 2)}>
                                            Одобрить
                                        </button>
                                        <button className="btn small danger" onClick={() => updateStatus(selected.application_id, 3)}>
                                            Отклонить
                                        </button>
                                    </div>
                                )}
                            </div>
                            {selected.user_phone_number && (
                                <p><strong>Телефон:</strong> {selected.user_phone_number}</p>
                            )}
                            <div className="full-text">{selected.application_value}</div>
                        </>
                    ) : (
                        <p className="placeholder-text">Выберите заявку</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function Warp() {
    const [blocks, setBlocks] = useState(createBlocks(0));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="strips strips-top">
                <div style={{ display: 'flex', gap: 6 }}>
                    {['Меню', 'Авторизация', 'Тарифы', 'Услуги', 'Заявки', 'Аккаунт'].map((label, i) => (
                        <button
                            key={i}
                            className={`nav-btn ${blocks[i] ? 'active' : ''}`}
                            onClick={() => setBlocks(createBlocks(i))}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <main style={{ flex: 1, padding: '60px 0 60px', display: 'flex', flexDirection: 'column' }}>
                {blocks[0] && <MainWindow />}
                {blocks[1] && <Authorization />}

                {isAuthorized && (
                    <>
                        {blocks[2] && (isAdmin ? <AdminTariffs /> : <Tariffs block={blocks[2]} />)}
                        {blocks[3] && (isAdmin ? <AdminServices /> : <Services block={blocks[3]} />)}
                        {blocks[4] && (isAdmin ? <AdminRequests /> : <Requests />)}
                        {blocks[5] && <AccountWindow setBlocks={setBlocks} />}
                    </>
                )}

                {!isAuthorized && !blocks[0] && !blocks[1] && <UnAuthorized />}
            </main>

            <div className="strips strips-bottom" />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Warp />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
