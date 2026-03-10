// Загрузка библиотеки для диаграмм
google.charts.load('current', {'packages': ['corechart']});

// Данные для статистики
let cachedStats = null;

// Привязка функций кнопкам
document.getElementById("addBtn").addEventListener("click", addFood);
document.getElementById("setWeightBtn").addEventListener("click", setWeight)
document.getElementById("statsBtn").addEventListener("click", showStats);
document.getElementById("closeBtn").addEventListener("click", closeStats);

// Добавление еды
function addFood() {

    const product = document.getElementById("product").value;
    const weight = document.getElementById("weightFood").value;

    if (!weight) {
        alert("Введите вес");
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

    loadKPFCInfo();
}

// Изменение веса
function setWeight() {
    const weight = document.getElementById("weightHuman").value;

    if (!weight) {
        alert("Введите вес");
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
    getWeight();
    document.getElementById("weightHuman").value = "";
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
    if (cachedStats) {
        document.getElementById("statsModal").style.display = "flex";
        google.charts.setOnLoadCallback(() => drawChart(cachedStats));
    } else {
        loadStats().then(() => {
            if (cachedStats) {
                document.getElementById("statsModal").style.display = "flex";
                google.charts.setOnLoadCallback(() => drawChart(cachedStats));
            }
            else console.log("Не удалось загрузить данные для статистики")
        });
    }
}

// Закрыть окно статистики
function closeStats() {
    document.getElementById("statsModal").style.display = "none";
}

// Заполнение списка продуктов
function fillProductSelect(products) {
    const select = document.getElementById("product");// Находим <select> на странице
    select.innerHTML = "";// очищаем старые опции

    // Заполняем <select>
    products.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.text = p;
        select.appendChild(option);
    });
}

// Получение списка продуктов
async function loadProducts() {

    try {
        const cached = localStorage.getItem('cachedProducts');
        const cachedTime = localStorage.getItem('cachedProductsTime');

        // Если кэш свежий (меньше часа), используем его
        if (cached && cachedTime && (Date.now() - cachedTime < 3600000)) {
            const products = JSON.parse(cached);
            fillProductSelect(products);
            return;
        }

        const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=products");
        const products = await response.json();

        localStorage.setItem('cachedProducts', JSON.stringify(products));
        localStorage.setItem('cachedProductsTime', Date.now());

        fillProductSelect(products);

    } catch (error) {
        console.error("Ошибка загрузки продуктов:", error);
        // Используем старый кэш если есть
        const cached = localStorage.getItem('cachedProducts');
        if (cached) {
            fillProductSelect(JSON.parse(cached));
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
        // Проверяем кэш
        const cached = localStorage.getItem('cachedStats');
        const cachedTime = localStorage.getItem('cachedStatsTime');

        // Если кэш свежий (меньше 24 часов = 86400000 мс), используем его
        if (cached && cachedTime && (Date.now() - cachedTime < 86400000)) {
            cachedStats = JSON.parse(cached);
            console.log('Stats загружены из кэша');
            return cachedStats;
        }

        // Иначе грузим с сервера
        console.log('Загружаем свежие stats с сервера');
        const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=stats");
        const data = await response.json();

        // Сохраняем в кэш
        localStorage.setItem('cachedStats', JSON.stringify(data));
        localStorage.setItem('cachedStatsTime', Date.now());

        cachedStats = data;
        return data;

    } catch (error) {
        console.error('Ошибка загрузки stats:', error);

        // При ошибке пробуем использовать старый кэш (даже если просрочен)
        const oldCache = localStorage.getItem('cachedStats');
        if (oldCache) {
            console.log('Используем старый кэш stats из-за ошибки');
            cachedStats = JSON.parse(oldCache);
            return cachedStats;
        }

        cachedStats = null;
        return null;
    }


    // try {
    //     const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=stats");
    //     cachedStats = await response.json();
    //     console.log('Stats загружены в кэш');
    // } catch (error) {
    //     console.error('Ошибка загрузки stats:', error);
    //     cachedStats = null;
    // }
}

async function initializeApp() {
    try {
        // Ждем выполнения
        await Promise.all([
            loadProducts(),
            getWeight(),
            loadKPFCInfo()
        ]);

        loadStats().catch(e => console.log('Stats грузятся в фоне'));

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