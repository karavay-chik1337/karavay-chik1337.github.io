//загрузка библиотеки для диаграмм
google.charts.load('current', {'packages': ['corechart']});

//получение списка продуктов
async function loadProducts() {

    try {
        // Получаем данные с Apps Script API
        const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=products");
        const products = await response.json();

        // Находим <select> на странице
        const select = document.getElementById("product");
        select.innerHTML = ""; // очищаем старые опции

        // Заполняем <select>
        products.forEach(p => {
            const option = document.createElement("option");
            option.value = p;
            option.text = p;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Ошибка загрузки продуктов:", error);
    }
}

//добавление еды
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

    updateKcalInfo();
}

//изменение веса
function setWeight(){
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

//показ статистики
async function showStats() {
    const response = await fetch("https://script.google.com/macros/s/AKfycbyO9pkgjCIx3hV7_ZpBlu5E7i6NfO0Gl9WuB-8vqNkF4TadG81tOlHm7Jp8LnR6NPqSdA/exec?action=stats")
    const stats = await response.json();

    document.getElementById("statsModal").style.display = "flex";
    google.charts.setOnLoadCallback(() => drawChart(stats));
}

//закрыть окно статистики
function closeStats() {
    document.getElementById("statsModal").style.display = "none";
}

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

async function updateKcalInfo() {
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

document.getElementById("addBtn").addEventListener("click", addFood);
document.getElementById("setWeightBtn").addEventListener("click", setWeight)
document.getElementById("statsBtn").addEventListener("click", showStats);
document.getElementById("closeBtn").addEventListener("click", closeStats);

loadProducts();
getWeight();
updateKcalInfo();