// Загрузка библиотеки для диаграмм
google.charts.load('current', {'packages': ['corechart']});

// Данные для статистики
let cachedStats = null;
let cachedStatsTime = null;
// Привязка функций кнопкам
document.getElementById("addBtn").addEventListener("click", addFood);
document.getElementById("setWeightBtn").addEventListener("click", setWeight)
document.getElementById("statsBtn").addEventListener("click", showStats);
document.getElementById("closeBtn").addEventListener("click", closeStats);

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");
    const text = document.getElementById("toastText");
    const icon = document.getElementById("toastIcon");

    text.textContent = message;

    toast.className = "toast show " + type;

    if (type === "success") icon.textContent = "✔️";
    if (type === "error") icon.textContent = "❌";
    if (type === "warning") icon.textContent = "⚠️";

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Добавление еды
function addFood() {

    const product = document.getElementById("product").value;
    const weight = document.getElementById("weightFood").value;

    if (!weight) {
        showToast("Введите вес", "warning");
        return;
    }

    if (weight < 1 || weight > 5000) {
        showToast("Вес не реалистичен", "error");
        return;
    }

    const data = {
        product: product,
        weight: weight
    }
    fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=addFood", {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data)
    });

    document.getElementById("weightFood").value = "";
    showToast("Продукт добавлен");

    loadKPFCInfo();
}

// Изменение веса
function setWeight() {
    const weight = Number(document.getElementById("weightHuman").value);

    if (!weight) {
        showToast("Введите вес", "warning");
        return;
    }

    if (weight < 30 || weight > 300) {
        showToast("Вес не реалистичен", "error");
        return;
    }

    const data = {
        weight: weight
    }
    fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=setWeight", {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data)
    });

    document.getElementById("weightHuman").value = "";
    showToast("Вес сохранён");

    setTimeout(() => {
        getWeight();
    }, 1000);
}

// Отрисовка диаграммы
function drawChart(statsData) {

    const data = google.visualization.arrayToDataTable([
        ['Дата', 'Нужно', 'Употреблено'],
        ...statsData
    ]);

    const options = {
        title: '"Нужно" vs "Употреблено"',
        width: '100%',
        height: 400,
        legend: {position: 'bottom'},
        vAxis: {title: 'Ккал'},
        hAxis: {title: 'Дата'},
        colors: ['#3467c7', '#ff0008']
    };

    const chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

// Показ статистики
function showStats() {
    loadStats().then(() => {
        if (cachedStats) {
            document.getElementById("statsModal").style.display = "flex";
            google.charts.setOnLoadCallback(() => drawChart(cachedStats));
        } else console.log("Не удалось загрузить данные для статистики")
    });
}

// Закрыть окно статистики
function closeStats() {
    document.getElementById("statsModal").style.display = "none";
}

// Заполнение списка продуктов
function fillProductAndFoodSelect(data) {
    const selectProduct = document.getElementById("product");// Находим <select> на странице
    const selectFood = document.getElementById("food");
    selectProduct.innerHTML = "";// очищаем старые опции
    selectFood.innerHTML = "";

    // Заполняем <select
    data.products.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.text = p;
        selectProduct.appendChild(option);
    });

    data.foods.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.text = p;
        selectFood.appendChild(option);
    });

}

// Получение списка продуктов
async function loadProducts() {

    try {
        const cached = localStorage.getItem('cachedProductAndFood');
        const cachedTime = localStorage.getItem('cachedProductAndFoodTime');

        // Если кэш свежий (меньше часа), используем его
        if (cached && cachedTime && (Date.now() - cachedTime < 3600000)) {
            const products = JSON.parse(cached);
            fillProductAndFoodSelect(products);
            return;
        }

        const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=products");
        const data = await response.json();
        console.log(data);
        localStorage.setItem('cachedProductAndFood', JSON.stringify(data));
        localStorage.setItem('cachedProductAndFoodTime', Date.now());

        fillProductAndFoodSelect(data);

    } catch (error) {
        console.error("Ошибка загрузки продуктов:", error);
        // Используем старый кэш если есть
        const cached = localStorage.getItem('cachedProductAndFood');
        if (cached) {
            fillProductAndFoodSelect(JSON.parse(cached));
        }
    }
}

// Получение данных о КБЖУ
async function loadKPFCInfo() {
    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=kpfc`);
        const data = await response.json();

        document.getElementById('kcalValue').textContent = data.calories;
        document.getElementById('proteinValue').textContent = data.protein;
        document.getElementById('fatValue').textContent = data.fats;
        document.getElementById('carbsValue').textContent = data.carbs;

    } catch (error) {
        console.error("Ошибка загрузки КБЖУ:", error);
    }
}

// Получаем текущий вес пользователя
async function getWeight() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=weight");
        document.getElementById("currentWeight").textContent = await response.json();

    } catch (error) {
        console.error("Ошибка загрузки текущего веса:", error);
    }
}

// Загрузка данных для статистики
async function loadStats() {
    try {
        cachedStats = JSON.parse(localStorage.getItem('cachedStats'));
        cachedStatsTime = Number(localStorage.getItem('cachedStatsTime'));

        // Если кэш свежий (меньше 24 часов = 86400000 мс), используем его
        if (cachedStats && cachedStatsTime && Date.now() - cachedStatsTime < 86400000) {
            console.log('Stats загружены из кэша');
        } else {
            // Иначе грузим с сервера
            console.log('Загружаем свежие stats с сервера');
            const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=stats");
            const data = await response.json();

            // Сохраняем в кэш
            localStorage.setItem('cachedStats', JSON.stringify(data));
            localStorage.setItem('cachedStatsTime', Date.now());

            cachedStats = data;
        }

    } catch (error) {
        console.error('Ошибка загрузки stats:', error);

        const oldCache = localStorage.getItem('cachedStats');
        if (oldCache) {
            console.log('Используем старый кэш stats из-за ошибки');
            cachedStats = JSON.parse(oldCache);
        }
    }
}

async function initializeApp() {
    try {
        // Ждем выполнения
        await Promise.all([
            loadProducts(),
            getWeight(),
            loadKPFCInfo()
        ]);

        loadStats().catch(() => console.log('Stats грузятся в фоне'));

        // Прячем спиннер загрузки и показываем контент
        document.getElementById('preloader').style.display = 'none';
        document.getElementById('content').style.display = 'flex';

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        document.getElementById('preloader').innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">Упс...☹️</div>
                        <div class="preloader-text">Ошибка загрузки данных</div>
                        <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 12px; font-size: 16px;">Повторить 🔁</button>
                    </div>
                `;
    }
}

initializeApp();


function showSelect(type, btnElement) {
    // Скрываем оба селекта
    document.getElementById('food').style.display = 'none';
    document.getElementById('product').style.display = 'none';

    // Убираем active класс у всех кнопок
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Добавляем active класс нажатой кнопке
    btnElement.classList.add('active');

    // Показываем нужный селект
    if (type === 'food') {
        document.getElementById('food').style.display = 'block';
    } else if (type === 'product') {
        document.getElementById('product').style.display = 'block';
    }
}
