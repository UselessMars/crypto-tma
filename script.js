// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); 

// Элементы
const payInput = document.getElementById('pay-amount');
const receiveInput = document.getElementById('receive-amount');
const userInfo = document.getElementById('user-info');
const rateInfo = document.getElementById('rate-info'); 
const payCurrencySelect = document.getElementById('pay-currency'); // Новый элемент
const receiveCurrencySelect = document.getElementById('receive-currency'); // Новый элемент

// Глобальная переменная для курса
let currentRate = 0;

// !ВАЖНО: АДРЕС ТВОЕГО VPS И ПОРТ 8000
const API_ENDPOINT = 'http://77.238.238.67:8000/api/data'; 

// --- Логика получения данных с сервера (API) ---
async function fetchRatesAndUserData() {
    const userId = tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 0;
    // Берем актуальные валюты из полей select
    const RECEIVE_CURRENCY = receiveCurrencySelect.value;
    const PAY_CURRENCY = payCurrencySelect.value;
    
    // Проверяем, что не пытаемся обменять RUB на RUB или BTC на BTC
    if (RECEIVE_CURRENCY === PAY_CURRENCY) {
        rateInfo.innerText = "Выберите разные валюты.";
        currentRate = 0;
        calculate();
        return;
    }

    try {
        // API на сервере берет курс в USDT, поэтому передаем только крипту
        const response = await fetch(`${API_ENDPOINT}?user_id=${userId}&symbol=${RECEIVE_CURRENCY}`);
        const data = await response.json();
        
        currentRate = data.rate; // 1 {RECEIVE_CURRENCY} = X RUB
        let userRating = data.rating;
        
        // Обновляем UI
        userInfo.innerText = `Рейтинг: ⭐ ${userRating}`;
        rateInfo.innerText = `1 ${RECEIVE_CURRENCY} = ~${currentRate.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${PAY_CURRENCY}`;
        
        calculate();

    } catch (error) {
        console.error("Ошибка при получении данных с сервера:", error);
        // ИСПРАВЛЕННЫЙ ТЕКСТ ОШИБКИ
        rateInfo.innerText = "Ошибка загрузки курса. Проверьте IP-адрес и порт 8000."; 
        currentRate = 0;
        calculate();
    }
}

// --- Общая функция обновления обмена (вызывается при смене select) ---
function updateExchange() {
    rateInfo.innerText = "Обновление курса...";
    fetchRatesAndUserData(); 
}

// --- Логика свитчера (пока только обновляет курс, так как обмен односторонний: RUB -> CRYPTO) ---
window.switchCurrencies = function() {
    // В текущей реализации просто перезапускаем обновление курса.
    // Если ты добавишь BTC в pay-currency, эту функцию нужно будет доработать для обмена значений в select.
    updateExchange(); 
};

// --- Логика калькулятора ---
function calculate() {
    let amount = parseFloat(payInput.value);
    if (isNaN(amount) || currentRate === 0) {
        receiveInput.value = "";
        return;
    }
    // Формула: Рубли / Курс (RUB/CRYPTO) = Количество CRYPTO
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

// --- Запуск и слушатели событий ---
payInput.addEventListener('input', calculate);
// При смене валюты, обновляем курс
receiveCurrencySelect.addEventListener('change', updateExchange); 
payCurrencySelect.addEventListener('change', updateExchange); 

fetchRatesAndUserData(); // Первый запуск при загрузке
