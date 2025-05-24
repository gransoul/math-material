// main.js: инициализация калькулятора
import { materialsList, baseResourcesList } from './data.js';
import { renderTargetMaterialsTable, renderRequiredResourcesTable, setupEventHandlers, readUserInputs, renderResults } from './ui.js';
import { calculateRequiredResources } from './calculator.js';

// (опционально) функция для обновления строки обмена
function updateExchangeStringInput() {
    if (typeof window.updateExchangeStringInputImpl === 'function') {
        window.updateExchangeStringInputImpl();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('calculator-root');
    if (!root) return;

    // Создаем контейнеры для таблиц
    const container = document.createElement('div');
    container.className = 'container';

    // Блок целевых материалов
    const targetBlock = document.createElement('div');
    targetBlock.className = 'block';
    targetBlock.id = 'target-materials-block';
    const targetTitle = document.createElement('h2');
    targetTitle.textContent = 'Целевые материалы';
    targetBlock.appendChild(targetTitle);
    const targetTable = document.createElement('table');
    targetTable.id = 'target-materials-table';
    const targetThead = document.createElement('thead');
    targetThead.innerHTML = '<tr><th></th><th>Материал</th><th>Желаемое количество</th><th></th></tr>';
    targetTable.appendChild(targetThead);
    const targetTbody = renderTargetMaterialsTable(materialsList);
    targetTable.appendChild(targetTbody);
    targetBlock.appendChild(targetTable);

    // Кнопка копирования желаемых материалов
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Скопировать список целей';
    copyBtn.className = 'styled-btn';
    copyBtn.style.margin = '12px 0 0 0';
    copyBtn.onclick = () => {
        let result = '';
        materialsList.forEach(mat => {
            const input = document.getElementById('target-' + mat.id);
            let val = input ? Number(input.value.replace(/\D/g, '')) : 0;
            if (val > 0) {
                // Используем formatNumber из helpers.js
                import('./helpers.js').then(({ formatNumber }) => {
                    const line = `${mat.name}: ${formatNumber(val)} шт.`;
                    result += line + '\n';
                    // Если это последний материал — копируем
                    if (mat === materialsList[materialsList.length - 1]) {
                        navigator.clipboard.writeText(result.trim());
                    }
                });
            }
        });
    };
    targetBlock.appendChild(copyBtn);

    // Блок необходимых ресурсов
    const reqBlock = document.createElement('div');
    reqBlock.className = 'block';
    reqBlock.id = 'required-resources-block';
    const reqTitle = document.createElement('h2');
    reqTitle.textContent = 'Необходимые ресурсы';
    reqBlock.appendChild(reqTitle);
    const reqTable = document.createElement('table');
    reqTable.id = 'required-resources-table';
    const reqThead = document.createElement('thead');
    reqThead.innerHTML = '<tr><th></th><th>Ресурс</th><th>Использовать</th><th>Необходимо</th><th>Для получения</th><th>Преобразует</th><th>Итого</th><th></th></tr>';
    reqTable.appendChild(reqThead);
    const reqTbody = renderRequiredResourcesTable(baseResourcesList);
    reqTable.appendChild(reqTbody);
    reqBlock.appendChild(reqTable);

    // Вставляем блоки в контейнер
    container.appendChild(targetBlock);
    container.appendChild(reqBlock);
    root.appendChild(container);

    // (опционально) блок обмена данными можно добавить здесь
    // ...

    // Навесить обработчики событий
    setupEventHandlers();
    // Навесить обработчики копирования
    import('./ui.js').then(mod => { mod.setupCopyButtons(); });

    // Первичный расчет и отрисовка
    const initialInputs = readUserInputs();
    const initialResults = calculateRequiredResources(initialInputs.desiredMaterials, initialInputs.mineralUsagePercent);
    renderResults(initialResults);
    updateExchangeStringInput();
});
