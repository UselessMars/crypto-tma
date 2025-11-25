// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); // Расширяем на весь экран

// Цвета темы (можно использовать системные)
// tg.themeParams.bg_color

// Элементы
const payInput = document.getElementById('pay-amount');
const receiveInput = document.getElementById('receive-amount');
const userInfo = document.getElementById('user-info');
const mainBtn = document.getElementById('main-btn');

// Фейковый курс (в реальности берем через API)
const RATE = 0.000016; // Примерно 1 RUB = X BTC

// Инициализация пользователя
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userInfo.innerText = `Привет, ${tg.initDataUnsafe.user.first_name}!`;
} else {
    userInfo.innerText = "Гость";
}

// Логика калькулятора
payInput.addEventListener('input', calculate);

function calculate() {
    let amount = parseFloat(payInput.value);
    if (isNaN(amount)) {
        receiveInput.value = "";
        return;
    }
    // Простая формула: Сумма * Курс
    let result = amount * RATE;
    receiveInput.value = result.toFixed(8); // 8 знаков для BTC
}

// Запускаем расчет сразу при загрузке
calculate();

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
        currency_from: "RUB",
        currency_to: "BTC",
        amount_pay: amount,
        amount_receive: receive
    };

    // Отправляем данные боту (они придут в виде JSON строки)
    tg.sendData(JSON.stringify(data)); 
    
    // Или можно просто закрыть окно (если логика обрабатывается иначе)
    // tg.close();
}