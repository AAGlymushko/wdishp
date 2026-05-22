import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const socket = io({
  transports: ['polling', 'websocket'],
  upgrade: true
});
let name = null;
let password = null;
let phoneNumber = null;
let isAuthorized = false;
let isAdmin = false;
const createBlocks = index => {
  const arr = new Array(7).fill(false);
  arr[index] = true;
  return arr;
};
function Authorization() {
  const [isUser, setIsUser] = useState(true);
  useEffect(() => {
    const handleAuth = data => {
      alert(data.message);
      if (data.message === 'success') {
        password = data.password;
        phoneNumber = data.phoneNumber;
        name = data.name;
        isAuthorized = true;
      }
    };
    const handleAdminAuth = data => {
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
      name: !isUser ? document.getElementById('name')?.value : undefined
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "centered-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"), isUser ? /*#__PURE__*/React.createElement("input", {
    id: "phoneNumber",
    className: "input",
    placeholder: "\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430",
    defaultValue: phoneNumber || ''
  }) : /*#__PURE__*/React.createElement("input", {
    id: "name",
    className: "input",
    placeholder: "\u0418\u043C\u044F",
    defaultValue: name || ''
  }), /*#__PURE__*/React.createElement("input", {
    id: "password",
    className: "input",
    type: "password",
    placeholder: "\u041F\u0430\u0440\u043E\u043B\u044C"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setIsUser(!isUser)
  }, isUser ? 'Войти как администратор' : 'Войти как пользователь'), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: send
  }, "\u0412\u043E\u0439\u0442\u0438")));
}
function MainWindow() {
  return /*#__PURE__*/React.createElement("div", {
    className: "centered-page"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "main-title"
  }, "EasyLife"), /*#__PURE__*/React.createElement("h2", {
    className: "main-signature"
  }, "\u0412\u0430\u0448\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043D\u0430\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F"));
}
function AccountWindow({
  setBlocks
}) {
  useEffect(() => {
    socket.on('redactUserData', data => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "centered-page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-card"
  }, /*#__PURE__*/React.createElement("h2", null, "\u041B\u0438\u0447\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442"), !isAdmin && /*#__PURE__*/React.createElement("label", {
    style: {
      alignSelf: 'flex-start',
      color: '#bbe4fa'
    }
  }, "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"), !isAdmin && /*#__PURE__*/React.createElement("input", {
    className: "input",
    readOnly: true,
    value: phoneNumber || ''
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      alignSelf: 'flex-start',
      color: '#bbe4fa'
    }
  }, "\u0418\u043C\u044F"), /*#__PURE__*/React.createElement("input", {
    id: "name",
    className: "input",
    defaultValue: name || ''
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      alignSelf: 'flex-start',
      color: '#bbe4fa'
    }
  }, "\u041F\u0430\u0440\u043E\u043B\u044C"), /*#__PURE__*/React.createElement("input", {
    id: "password",
    className: "input",
    type: "password",
    defaultValue: password || ''
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => socket.emit('redactUserData', {
      password: document.getElementById('password').value,
      name: document.getElementById('name').value
    })
  }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    className: "btn danger",
    onClick: () => socket.emit('logOutOfAccount')
  }, "\u0412\u044B\u0439\u0442\u0438")));
}
function UnAuthorized() {
  return /*#__PURE__*/React.createElement("div", {
    className: "centered-page"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0412\u044B \u043D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D\u044B"));
}
function Tariffs({
  block
}) {
  const [userTariffs, setUserTariffs] = useState([]);
  const [allTariffs, setAllTariffs] = useState([]);
  useEffect(() => {
    if (block) {
      socket.emit('getRate');
      socket.emit('getRates');
    }
  }, [block]);
  useEffect(() => {
    socket.on('getRate', data => {
      if (data.rate) setUserTariffs(data.rate);
    });
    socket.on('getRates', data => {
      if (data.rates) setAllTariffs(data.rates);
    });
    return () => {
      socket.off('getRate');
      socket.off('getRates');
    };
  }, []);
  const activeId = userTariffs[0]?.rate_id;
  const displayed = activeId ? [userTariffs[0], ...allTariffs.filter(t => t.rate_id !== activeId)] : allTariffs;
  const handleSelect = tariff => {
    socket.emit('setUserRate', {
      rate_id: tariff.rate_id
    });
    setTimeout(() => {
      socket.emit('getRate');
      socket.emit('getRates');
    }, 100);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0422\u0430\u0440\u0438\u0444\u044B"), displayed.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "no-items"
  }, "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0442\u0430\u0440\u0438\u0444\u043E\u0432") : /*#__PURE__*/React.createElement("div", {
    className: "grid"
  }, displayed.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.rate_id,
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, t.rate_name || `Тариф #${t.rate_id}`), t.services?.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.service_id,
    className: "row"
  }, /*#__PURE__*/React.createElement("span", null, s.service_name), /*#__PURE__*/React.createElement("span", null, s.service_price, " \u20BD"))), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: activeId === t.rate_id,
    style: {
      opacity: activeId === t.rate_id ? 0.6 : 1
    },
    onClick: () => handleSelect(t)
  }, activeId === t.rate_id ? 'Текущий тариф' : 'Выбрать')))));
}
function Services({
  block
}) {
  const [userServices, setUserServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  useEffect(() => {
    if (block) {
      socket.emit('getUserServices');
      socket.emit('getServices');
    }
  }, [block]);
  useEffect(() => {
    socket.on('getUserServices', data => {
      if (data.services) setUserServices(data.services);
    });
    socket.on('getServices', data => {
      if (data.services) setAllServices(data.services);
    });
    return () => {
      socket.off('getUserServices');
      socket.off('getServices');
    };
  }, []);
  const toggleService = service => {
    socket.emit('setUserService', {
      service_id: service.service_id
    });
    setTimeout(() => {
      socket.emit('getUserServices');
      socket.emit('getServices');
    }, 100);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0423\u0441\u043B\u0443\u0433\u0438"), allServices.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "no-items"
  }, "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0443\u0441\u043B\u0443\u0433") : /*#__PURE__*/React.createElement("div", {
    className: "grid"
  }, allServices.map(s => {
    const isConnected = !userServices.some(us => us.service_id === s.service_id);
    return /*#__PURE__*/React.createElement("div", {
      key: s.service_id,
      className: "card"
    }, /*#__PURE__*/React.createElement("h3", null, s.service_name || `Услуга #${s.service_id}`), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: '#3b82f6'
      }
    }, s.service_price, " \u20BD / \u043C\u0435\u0441"), s.service_description && /*#__PURE__*/React.createElement("p", {
      style: {
        color: '#475569'
      }
    }, s.service_description), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => toggleService(s),
      style: {
        opacity: !isConnected ? 0.6 : 1
      }
    }, isConnected ? 'Подключить' : 'Отключить'));
  })));
}
function Requests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    socket.emit('getUserApplications');
    socket.on('getUserApplications', data => {
      setRequests(data.result || []);
      setLoading(false);
    });
    return () => socket.off('getUserApplications');
  }, []);
  const createRequest = () => {
    const val = document.getElementById('new-request-text').value;
    socket.emit('createUserApplication', {
      application_value: val
    });
    setTimeout(() => {
      socket.emit('getUserApplications');
      setShowCreate(false);
    }, 300);
  };
  const deleteRequest = id => {
    socket.emit('deleteUserApplication', {
      application_id: id
    });
    setTimeout(() => {
      socket.emit('getUserApplications');
      setSelected(null);
    }, 300);
  };
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "centered-page"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
  return /*#__PURE__*/React.createElement("div", {
    className: "section",
    style: {
      height: 'auto',
      minHeight: '80vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0
    }
  }, "\u041C\u043E\u0438 \u0437\u0430\u044F\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    onClick: () => setShowCreate(!showCreate)
  }, showCreate ? 'Отмена' : 'Создать заявку')), showCreate && /*#__PURE__*/React.createElement("div", {
    className: "create-form"
  }, /*#__PURE__*/React.createElement("textarea", {
    id: "new-request-text",
    rows: 4,
    placeholder: "\u0422\u0435\u043A\u0441\u0442 \u0437\u0430\u044F\u0432\u043A\u0438..."
  }), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    onClick: createRequest
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      background: '#9e9e9e'
    },
    onClick: () => setShowCreate(false)
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "requests-layout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "requests-list"
  }, requests.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "placeholder-text"
  }, "\u041D\u0435\u0442 \u0437\u0430\u044F\u0432\u043E\u043A") : requests.map(req => /*#__PURE__*/React.createElement("div", {
    key: req.application_id,
    className: `request-item ${selected?.application_id === req.application_id ? 'active' : ''}`,
    onClick: () => setSelected(req)
  }, /*#__PURE__*/React.createElement("div", {
    className: "request-meta"
  }, /*#__PURE__*/React.createElement("span", null, req.application_value.slice(0, 40), "..."), /*#__PURE__*/React.createElement("span", {
    className: "status",
    style: {
      background: req.status_id === 1 ? '#fff3e0' : req.status_id === 2 ? '#e8f5e9' : '#ffebee'
    }
  }, req.status_name))))), /*#__PURE__*/React.createElement("div", {
    className: "details-panel"
  }, selected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "details-header"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "\u0417\u0430\u044F\u0432\u043A\u0430"), /*#__PURE__*/React.createElement("button", {
    className: "btn small danger",
    onClick: () => deleteRequest(selected.application_id)
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    className: "full-text"
  }, selected.application_value)) : /*#__PURE__*/React.createElement("p", {
    className: "placeholder-text"
  }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u044F\u0432\u043A\u0443"))));
}
function AdminTariffs() {
  const [tariffs, setTariffs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [servicesList, setServicesList] = useState([{
    name: '',
    price: ''
  }]);
  useEffect(() => {
    socket.emit('getRates');
    socket.on('getRates', data => {
      if (data.rates) setTariffs(data.rates);
    });
    return () => socket.off('getRates');
  }, []);
  const addServiceField = () => setServicesList([...servicesList, {
    name: '',
    price: ''
  }]);
  const updateService = (index, field, value) => {
    const updated = [...servicesList];
    updated[index][field] = value;
    setServicesList(updated);
  };
  const removeService = index => setServicesList(servicesList.filter((_, i) => i !== index));
  const createTariff = () => {
    const services = servicesList.filter(s => s.name.trim() && s.price.trim()).map(s => ({
      service_name: s.name,
      service_price: s.price
    }));
    if (!newName.trim() || services.length === 0) {
      alert('Введите название тарифа и хотя бы одну услугу');
      return;
    }
    socket.emit('createRate', {
      rate_name: newName,
      services
    });
    setTimeout(() => {
      socket.emit('getRates');
      setShowCreate(false);
      setNewName('');
      setServicesList([{
        name: '',
        price: ''
      }]);
    }, 300);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0440\u0438\u0444\u0430\u043C\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      marginBottom: 16
    },
    onClick: () => setShowCreate(!showCreate)
  }, showCreate ? 'Отмена' : 'Создать тариф'), showCreate && /*#__PURE__*/React.createElement("div", {
    className: "create-form"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    style: {
      background: '#fff',
      color: '#333',
      marginBottom: 12
    },
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0442\u0430\u0440\u0438\u0444\u0430",
    value: newName,
    onChange: e => setNewName(e.target.value)
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 8px'
    }
  }, "\u0423\u0441\u043B\u0443\u0433\u0438 \u0432 \u0442\u0430\u0440\u0438\u0444\u0435"), servicesList.map((s, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    style: {
      background: '#fff',
      color: '#333',
      flex: 2
    },
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438",
    value: s.name,
    onChange: e => updateService(idx, 'name', e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "input",
    style: {
      background: '#fff',
      color: '#333',
      flex: 1
    },
    placeholder: "\u0426\u0435\u043D\u0430",
    value: s.price,
    onChange: e => updateService(idx, 'price', e.target.value)
  }), servicesList.length > 1 && /*#__PURE__*/React.createElement("button", {
    className: "btn small danger",
    onClick: () => removeService(idx)
  }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      marginRight: 8
    },
    onClick: addServiceField
  }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443"), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    onClick: createTariff
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      background: '#9e9e9e'
    },
    onClick: () => setShowCreate(false)
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "grid"
  }, tariffs.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "no-items"
  }, "\u041D\u0435\u0442 \u0442\u0430\u0440\u0438\u0444\u043E\u0432") : tariffs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.rate_id,
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, t.rate_name), t.services?.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.service_id,
    className: "row"
  }, /*#__PURE__*/React.createElement("span", null, s.service_name), /*#__PURE__*/React.createElement("span", null, s.service_price, " \u20BD")))))));
}
function AdminServices() {
  const [services, setServices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  useEffect(() => {
    socket.emit('getServices');
    socket.on('getServices', data => {
      if (data.services) setServices(data.services);
    });
    return () => socket.off('getServices');
  }, []);
  const createService = () => {
    if (!newName.trim() || !newPrice.trim()) {
      alert('Заполните название и цену');
      return;
    }
    socket.emit('createService', {
      service_name: newName,
      service_price: newPrice
    });
    setTimeout(() => {
      socket.emit('getServices');
      setShowCreate(false);
      setNewName('');
      setNewPrice('');
    }, 300);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0430\u043C\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      marginBottom: 16
    },
    onClick: () => setShowCreate(!showCreate)
  }, showCreate ? 'Отмена' : 'Создать услугу'), showCreate && /*#__PURE__*/React.createElement("div", {
    className: "create-form"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    style: {
      background: '#fff',
      color: '#333',
      marginBottom: 8
    },
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438",
    value: newName,
    onChange: e => setNewName(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "input",
    style: {
      background: '#fff',
      color: '#333',
      marginBottom: 12
    },
    placeholder: "\u0426\u0435\u043D\u0430",
    value: newPrice,
    onChange: e => setNewPrice(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    onClick: createService
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      background: '#9e9e9e'
    },
    onClick: () => setShowCreate(false)
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"))), /*#__PURE__*/React.createElement("div", {
    className: "grid"
  }, services.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "no-items"
  }, "\u041D\u0435\u0442 \u0443\u0441\u043B\u0443\u0433") : services.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.service_id,
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, s.service_name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#3b82f6'
    }
  }, s.service_price, " \u20BD")))));
}
function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    socket.emit('getApplications');
    socket.on('getApplications', data => {
      if (data.result) setRequests(data.result);
    });
    return () => socket.off('getApplications');
  }, []);
  const updateStatus = (id, statusId) => {
    socket.emit('updateApplicationStatus', {
      application_id: id,
      status_id: statusId
    });
    setTimeout(() => {
      socket.emit('getApplications');
      setSelected(null);
    }, 300);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("h2", null, "\u0417\u0430\u044F\u0432\u043A\u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432"), /*#__PURE__*/React.createElement("div", {
    className: "requests-layout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "requests-list"
  }, requests.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "placeholder-text"
  }, "\u041D\u0435\u0442 \u0437\u0430\u044F\u0432\u043E\u043A") : requests.map(req => /*#__PURE__*/React.createElement("div", {
    key: req.application_id,
    className: `request-item ${selected?.application_id === req.application_id ? 'active' : ''}`,
    onClick: () => setSelected(req)
  }, /*#__PURE__*/React.createElement("div", {
    className: "request-meta"
  }, /*#__PURE__*/React.createElement("span", null, req.application_value.slice(0, 40), "..."), /*#__PURE__*/React.createElement("span", {
    className: "status",
    style: {
      background: req.status_id === 1 ? '#fff3e0' : req.status_id === 2 ? '#e8f5e9' : '#ffebee'
    }
  }, req.status_name))))), /*#__PURE__*/React.createElement("div", {
    className: "details-panel"
  }, selected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "details-header"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0
    }
  }, "\u0417\u0430\u044F\u0432\u043A\u0430 #", selected.application_id), selected.status_id === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn small",
    style: {
      background: '#2e7d32'
    },
    onClick: () => updateStatus(selected.application_id, 2)
  }, "\u041E\u0434\u043E\u0431\u0440\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    className: "btn small danger",
    onClick: () => updateStatus(selected.application_id, 3)
  }, "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C"))), selected.user_phone_number && /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "\u0422\u0435\u043B\u0435\u0444\u043E\u043D:"), " ", selected.user_phone_number), /*#__PURE__*/React.createElement("div", {
    className: "full-text"
  }, selected.application_value)) : /*#__PURE__*/React.createElement("p", {
    className: "placeholder-text"
  }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u044F\u0432\u043A\u0443"))));
}
function Warp() {
  const [blocks, setBlocks] = useState(createBlocks(0));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "strips strips-top"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['Меню', 'Авторизация', 'Тарифы', 'Услуги', 'Заявки', 'Аккаунт'].map((label, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: `nav-btn ${blocks[i] ? 'active' : ''}`,
    onClick: () => setBlocks(createBlocks(i))
  }, label)))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      padding: '60px 0 60px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, blocks[0] && /*#__PURE__*/React.createElement(MainWindow, null), blocks[1] && /*#__PURE__*/React.createElement(Authorization, null), isAuthorized && /*#__PURE__*/React.createElement(React.Fragment, null, blocks[2] && (isAdmin ? /*#__PURE__*/React.createElement(AdminTariffs, null) : /*#__PURE__*/React.createElement(Tariffs, {
    block: blocks[2]
  })), blocks[3] && (isAdmin ? /*#__PURE__*/React.createElement(AdminServices, null) : /*#__PURE__*/React.createElement(Services, {
    block: blocks[3]
  })), blocks[4] && (isAdmin ? /*#__PURE__*/React.createElement(AdminRequests, null) : /*#__PURE__*/React.createElement(Requests, null)), blocks[5] && /*#__PURE__*/React.createElement(AccountWindow, {
    setBlocks: setBlocks
  })), !isAuthorized && !blocks[0] && !blocks[1] && /*#__PURE__*/React.createElement(UnAuthorized, null)), /*#__PURE__*/React.createElement("div", {
    className: "strips strips-bottom"
  }));
}
function App() {
  return /*#__PURE__*/React.createElement(BrowserRouter, null, /*#__PURE__*/React.createElement(Routes, null, /*#__PURE__*/React.createElement(Route, {
    path: "/",
    element: /*#__PURE__*/React.createElement(Warp, null)
  })));
}
export default App;