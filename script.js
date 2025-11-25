// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); 

// Переменные, которые будут обновлены из API
let currentRate = 0;
let userRating = 5.0; // Дефолтный рейтинг
const PAY_CURRENCY = "RUB";
const RECEIVE_CURRENCY = "BTC"; // Монету можно сделать динамической позже

// Элементы
const payInput = document.getElementById('pay-amount');
const receiveInput = document.getElementById('receive-amount');
const userInfo = document.getElementById('user-info');
const rateInfo = document.getElementById('rate-info'); 
const mainBtn = document.getElementById('main-btn');

// Логика получения данных с сервера (API)
async function fetchRatesAndUserData() {
    // !ВАЖНО: ЗАМЕНИТЬ НА IP АДРЕС ТВОЕГО VPS И ПОРТ 8000
    const API_ENDPOINT = 'http://77.238.238.67:8000/api/data'; 
    
    // Получаем ID пользователя из Telegram
    const userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 0;
    
    try {
        const response = await fetch(`${API_ENDPOINT}?user_id=${userId}&symbol=${RECEIVE_CURRENCY}`);
        const data = await response.json();
        
        currentRate = data.rate; // 1 BTC = X RUB
        userRating = data.rating;
        
        // Обновляем UI
        userInfo.innerText = `Рейтинг: ⭐ ${userRating}`;
        // Форматирование для красивого отображения чисел
        rateInfo.innerText = `1 ${RECEIVE_CURRENCY} = ~${currentRate.toLocaleString('ru-RU')} ${PAY_CURRENCY}`;
        
        // Пересчитываем после получения нового курса
        calculate();

    } catch (error) {
        console.error("Ошибка при получении данных с сервера:", error);
        rateInfo.innerText = "Ошибка загрузки курса. Проверьте IP-адрес и порт 8080.";
    }
}

// Логика калькулятора (использует global currentRate)
function calculate() {
    let amount = parseFloat(payInput.value);
    if (isNaN(amount) || currentRate === 0) {
        receiveInput.value = "";
        return;
    }
    // Формула: Рубли / Курс (RUB/BTC) = Количество BTC
    let result = amount / currentRate;
    receiveInput.value = result.toFixed(8);
}

// Отправка данных боту
function sendData() {
    let amount = payInput.value;
    let receive = receiveInput.value;

    if (!amount || amount < 1000) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Минимальная сумма обмена 1000 RUB',
            buttons: [{type: 'ok'}]
        });
        return;
    }

    // Формируем объект данных для отправки
    let data = {
        action: "exchange",
        currency_from: PAY_CURRENCY,
        currency_to: RECEIVE_CURRENCY,
        amount_pay: amount,
        amount_receive: receive
    };

    // Отправляем данные боту и закрываем Web App
    tg.sendData(JSON.stringify(data)); 
    tg.close();
}

// Запуск при инициализации
fetchRatesAndUserData(); 
payInput.addEventListener('input', calculate);

