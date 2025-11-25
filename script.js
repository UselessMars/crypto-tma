// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); 

// Элементы
const payInput = document.getElementById('pay-amount');
const receiveInput = document.getElementById('receive-amount');
const userInfo = document.getElementById('user-info'); // Теперь это кнопка
const rateInfo = document.getElementById('rate-info'); 
const payCurrencySelect = document.getElementById('pay-currency'); 
const receiveCurrencySelect = document.getElementById('receive-currency'); 

// Глобальная переменная для курса
let currentRate = 0;

// !ВАЖНО: АДРЕС ТВОЕГО VPS И ПОРТ 8000
const API_ENDPOINT = 'http://77.238.238.67:8000/api/data'; 

// --- Логика получения данных с сервера (API) ---
async function fetchRatesAndUserData() {
    const userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 0;
    
    const RECEIVE_CURRENCY = receiveCurrencySelect.value;
    const PAY_CURRENCY = payCurrencySelect.value;
    
    if (RECEIVE_CURRENCY === PAY_CURRENCY) {
        rateInfo.innerText = "Выберите разные валюты.";
        currentRate = 0;
        calculate();
        return;
    }
    
    const apiSymbol = RECEIVE_CURRENCY; 

    try {
        rateInfo.innerText = "Загрузка курса..."; // Показываем загрузку, пока ждем ответ
        const response = await fetch(`${API_ENDPOINT}?user_id=${userId}&symbol=${apiSymbol}`);
        
        if (!response.ok) { // Если ответ не 200 OK
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        currentRate = data.rate; 
        let userRating = data.rating;
        
        // Обновляем UI: имя пользователя уже установлено, просто добавляем рейтинг
        if (!userInfo.textContent || userInfo.textContent === 'Loading...') {
            setUserInfo(); // Переустанавливаем имя, если оно еще не загружено
        }
        // Добавляем рейтинг. Если там уже есть рейтинг, он будет заменен
        userInfo.textContent = userInfo.textContent.split(' ⭐')[0] + ` ⭐ ${userRating}`; 
        
        rateInfo.innerText = `1 ${RECEIVE_CURRENCY} = ~${currentRate.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${PAY_CURRENCY}`;
        
        calculate();

    } catch (error) {
        console.error("Ошибка при получении данных с сервера:", error);
        rateInfo.innerText = "Ошибка загрузки курса. Проверьте IP-адрес и порт 8000."; 
        currentRate = 0;
        calculate();
    }
}

// --- Установка имени пользователя (Для кнопки) ---
function setUserInfo() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        let displayName = user.first_name || 'Пользователь';
        
        if (user.username) {
            displayName = `@${user.username}`;
        }
        
        userInfo.textContent = displayName; 
    } else {
        userInfo.textContent = 'Гость';
    }
}

// --- Общая функция обновления обмена ---
function updateExchange() {
    fetchRatesAndUserData(); 
}

// --- Логика свитчера ---
window.switchCurrencies = function() {
    let tempPayValue = payCurrencySelect.value;
    let tempReceiveValue = receiveCurrencySelect.value;
    
    // Меняем значения
    payCurrencySelect.value = tempReceiveValue;
    receiveCurrencySelect.value = tempPayValue;

    // После смены валют нужно обновить курс
    updateExchange();
};

// --- Логика калькулятора ---
function calculate() {
    let amount = parseFloat(payInput.value);
    if (isNaN(amount) || currentRate === 0) {
        receiveInput.value = "";
        return;
    }
    
    let result = amount / currentRate; 
    receiveInput.value = result.toFixed(8);
}

// --- Отправка данных боту ---
window.sendData = function() {
    let amount = payInput.value;
    let receive = receiveInput.value;
    let currency_to = receiveCurrencySelect.value;
    let currency_from = payCurrencySelect.value;

    if (!amount || amount < 1000) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Минимальная сумма обмена 1000 RUB',
            buttons: [{type: 'ok'}]
        });
        return;
    }

    let data = {
        action: "exchange",
        currency_from: currency_from,
        currency_to: currency_to,
        amount_pay: amount,
        amount_receive: receive
    };

    tg.sendData(JSON.stringify(data)); 
    tg.close();
}

// --- Логика открытия профиля (Интерактивная кнопка) ---
window.openProfile = function() {
    const user = tg.initDataUnsafe.user;
    
    if (user) {
        let message = `Ваш ID: ${user.id}\n`;
        if (user.first_name) message += `Имя: ${user.first_name}\n`;
        if (user.username) message += `Username: @${user.username}\n`;
        
        // Получаем рейтинг из текущего текста кнопки
        const currentRatingText = userInfo.textContent;
        const ratingMatch = currentRatingText.match(/⭐\s*(\d+\.?\d*)/);
        const currentRating = ratingMatch ? ratingMatch[1] : 'Н/Д';

        message += `Ваш текущий рейтинг: ⭐ ${currentRating}`;

        tg.showPopup({
            title: 'Ваш Профиль',
            message: message,
            buttons: [{type: 'ok', text: 'Закрыть'}]
        });
    } else {
        // Если данные пользователя не загружены (режим "Гость")
        tg.showPopup({
            title: 'Вход не выполнен',
            message: 'Данные пользователя не загружены. Попробуйте перезапустить Web App.',
            buttons: [{type: 'ok', text: 'ОК'}]
        });
    }
};


// --- Запуск и слушатели событий ---
payInput.addEventListener('input', calculate);
receiveCurrencySelect.addEventListener('change', updateExchange); 
payCurrencySelect.addEventListener('change', updateExchange); 

setUserInfo(); // Сначала устанавливаем имя пользователя
fetchRatesAndUserData(); // Затем загружаем курс и рейтинг
