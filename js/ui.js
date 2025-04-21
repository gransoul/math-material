// ui.js: взаимодействие с DOM и отображение результатов
import { materialsList, baseResourcesList } from './data.js';
import { parseInputNumber, formatNumber } from './helpers.js';
import { calculateRequiredResources } from './calculator.js';

export function readUserInputs() {
    // Собираем желаемые количества материалов
    const desiredMaterials = {};
    document.querySelectorAll('.target-quantity-input').forEach(input => {
        const materialId = input.id.replace('target-', '');
        const mat = materialsList.find(m => m.id === materialId);
        if (!mat) return;
        const value = parseInputNumber(input.value);
        if (value > 0) {
            desiredMaterials[mat.name] = value;
        }
    });
    // Собираем проценты использования для всех ресурсов (руда, уран, минералы)
    const mineralUsagePercent = {};
    document.querySelectorAll('.mineral-usage-select').forEach(select => {
        const resourceId = select.id.replace('req-usage-', '');
        const res = baseResourcesList.find(r => r.id === resourceId);
        if (!res) return;
        const percent = parseInt(select.value, 10);
        mineralUsagePercent[res.name] = percent;
    });
    return { desiredMaterials, mineralUsagePercent };
}

export function renderResults(results, mineralUsagePercent = {}) {
    baseResourcesList.forEach(res => {
        const resourceName = res.name;
        const resourceId = res.id;
        // Всего
        const totalSpan = document.getElementById('req-total-' + resourceId);
        // Необходимо
        const initialSpan = document.getElementById('req-initial-' + resourceId);
        // Для получения (колонка)
        const obtainedSpan = document.getElementById('req-to-convert-' + resourceId);
        // Преобразует (колонка)
        const convertsOthersSpan = document.getElementById('req-used-for-conversion-' + resourceId);

        const totalValue = results.finalRequired?.[resourceName] || 0;
        const initialValue = results.initialNeeds?.[resourceName] || 0;
        const obtainedValue = results.actuallyConverted?.[resourceName] || 0;
        const convertsOthersValue = results.conversionCosts?.[resourceName] || 0;
        const amountToConvertValue = results.amountToConvert?.[resourceName] || 0;
        const usagePercent = mineralUsagePercent[resourceName] ?? 100;

        // Необходимо
        if (initialSpan) {
            const formatted = formatNumber(initialValue);
            initialSpan.textContent = formatted === '0' ? '-' : formatted;
            initialSpan.title = initialValue > 0 ? initialValue.toLocaleString('ru-RU') : '';
        }
        // Для получения (amountToConvert, если usagePercent < 100)
        if (obtainedSpan) {
            const formatted = formatNumber(amountToConvertValue);
            obtainedSpan.textContent = (usagePercent < 100 && amountToConvertValue > 0) ? formatted : '-';
            obtainedSpan.title = (usagePercent < 100 && amountToConvertValue > 0) ? amountToConvertValue.toLocaleString('ru-RU') : '';
        }
        // Преобразует
        if (convertsOthersSpan) {
            const formatted = formatNumber(convertsOthersValue);
            convertsOthersSpan.textContent = convertsOthersValue > 0 ? formatted : '-';
            convertsOthersSpan.title = convertsOthersValue > 0 ? convertsOthersValue.toLocaleString('ru-RU') : '';
        }
        // Всего
        if (totalSpan) {
            const formatted = formatNumber(totalValue);
            totalSpan.textContent = formatted === '0' ? '-' : formatted;
            totalSpan.title = totalValue > 0 ? totalValue.toLocaleString('ru-RU') : '';
        }
    });
}

export function setupEventHandlers() {
    function updateCalculation() {
        const inputs = readUserInputs();
        const results = calculateRequiredResources(inputs.desiredMaterials, inputs.mineralUsagePercent);
        renderResults(results, inputs.mineralUsagePercent);
        if (typeof window.updateExchangeStringInputImpl === 'function') {
            window.updateExchangeStringInputImpl();
        }
    }
    // Инпуты количества
    document.querySelectorAll('.target-quantity-input').forEach(input => {
        input.addEventListener('input', updateCalculation);
        input.addEventListener('blur', function() {
            const val = parseInputNumber(this.value);
            if (!isNaN(val)) {
                this.value = formatNumber(val);
                this.title = val > 0 ? val.toLocaleString('ru-RU') : '';
            } else {
                this.value = '0';
                this.title = '';
            }
            updateCalculation();
        });
    });
    // Селекты минералов
    document.querySelectorAll('.mineral-usage-select').forEach(select => {
        select.addEventListener('change', updateCalculation);
    });
    // Кнопки обмена (если есть)
    const copyBtn = document.getElementById('copy-exchange-string');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const str = getExchangeString();
            navigator.clipboard.writeText(str);
        });
    }
    const loadBtn = document.getElementById('load-exchange-string');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const input = document.getElementById('exchange-string');
            if (input) setExchangeString(input.value);
        });
    }
}

export function getExchangeString() {
    // Сохраняем значения материалов (в порядке materialsList)
    const parts = [];
    materialsList.forEach(mat => {
        const input = document.getElementById('target-' + mat.id);
        let val = input ? parseInputNumber(input.value) : 0;
        parts.push(val > 0 ? String(val) : '');
    });
    // Сохраняем проценты минералов (в порядке baseResourcesList, только isMineral)
    baseResourcesList.filter(r => r.isMineral).forEach(res => {
        const select = document.getElementById('req-usage-' + res.id);
        let percent = select ? parseInt(select.value, 10) : 100;
        parts.push(String(percent));
    });
    return parts.join(',');
}

export function setExchangeString(str) {
    if (!str) return;
    const parts = str.split(',');
    let idx = 0;
    // Восстанавливаем значения материалов
    materialsList.forEach(mat => {
        const input = document.getElementById('target-' + mat.id);
        if (input && parts[idx] !== undefined) {
            const val = parseInputNumber(parts[idx]);
            input.value = val > 0 ? String(val) : '0';
            input.title = val > 0 ? val.toLocaleString('ru-RU') : '';
        }
        idx++;
    });
    // Восстанавливаем проценты минералов
    baseResourcesList.filter(r => r.isMineral).forEach(res => {
        const select = document.getElementById('req-usage-' + res.id);
        if (select && parts[idx] !== undefined) {
            select.value = parts[idx];
        }
        idx++;
    });
    // После загрузки обновить расчёт и вывод
    const inputs = readUserInputs();
    const results = calculateRequiredResources(inputs.desiredMaterials, inputs.mineralUsagePercent);
    renderResults(results, inputs.mineralUsagePercent);
    if (typeof window.updateExchangeStringInputImpl === 'function') {
        window.updateExchangeStringInputImpl();
    }
}

export function renderTargetMaterialsTable(materialsList) {
    const tbody = document.createElement('tbody');
    materialsList.forEach(mat => {
        const tr = document.createElement('tr');
        // Иконка
        const tdIcon = document.createElement('td');
        const img = document.createElement('img');
        img.className = 'icon';
        img.src = mat.icon;
        img.alt = mat.name;
        tdIcon.appendChild(img);
        tr.appendChild(tdIcon);
        // Название
        const tdName = document.createElement('td');
        tdName.textContent = mat.name;
        tr.appendChild(tdName);
        // Поле ввода
        const tdInput = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'target-quantity-input';
        input.id = `target-${mat.id}`;
        input.value = '0';
        input.inputMode = 'numeric';
        input.pattern = '[0-9]*';
        input.min = 0;
        tdInput.appendChild(input);
        tr.appendChild(tdInput);
        // Иконка копирования (Желаемое количество)
        const tdCopy = document.createElement('td');
        tdCopy.className = 'td-copy';
        tdCopy.style.width = '16px';
        tdCopy.style.textAlign = 'center';
        const imgCopy = document.createElement('img');
        imgCopy.src = 'images/i-copy-16.png';
        imgCopy.alt = 'Copy';
        imgCopy.className = 'copy-desired-img';
        imgCopy.style.cursor = 'pointer';
        imgCopy.setAttribute('data-material-id', mat.id);
        tdCopy.appendChild(imgCopy);
        tr.appendChild(tdCopy);
        tbody.appendChild(tr);
    });
    return tbody;
}

export function renderRequiredResourcesTable(baseResourcesList) {
    const tbody = document.createElement('tbody');
    baseResourcesList.forEach(res => {
        const tr = document.createElement('tr');
        // Иконка
        const tdIcon = document.createElement('td');
        const img = document.createElement('img');
        img.className = 'icon';
        img.src = res.icon;
        img.alt = res.name;
        tdIcon.appendChild(img);
        tr.appendChild(tdIcon);
        // Название
        const tdName = document.createElement('td');
        tdName.textContent = res.name;
        tdName.style.color = '#daa548';
        tr.appendChild(tdName);
        // Использовать (селект для всех ресурсов)
        const tdPercent = document.createElement('td');
        tdPercent.className = 'td-center';
        const select = document.createElement('select');
        select.className = 'mineral-usage-select';
        select.id = `req-usage-${res.id}`;
        for (let p = 100; p >= 0; p -= 10) {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = `${p}%`;
            if (p === 100) opt.selected = true;
            select.appendChild(opt);
        }
        tdPercent.appendChild(select);
        tr.appendChild(tdPercent);
        // Необходимо
        const tdInitial = document.createElement('td');
        tdInitial.className = 'td-output';
        const spanInitial = document.createElement('span');
        spanInitial.className = 'required-initial-output';
        spanInitial.id = `req-initial-${res.id}`;
        spanInitial.textContent = '0';
        tdInitial.appendChild(spanInitial);
        tr.appendChild(tdInitial);
        // Преобразовать
        const tdToConvert = document.createElement('td');
        tdToConvert.className = 'td-output';
        tdToConvert.style.color = '#daa548';
        const spanToConvert = document.createElement('span');
        spanToConvert.className = 'required-to-convert-output';
        spanToConvert.id = `req-to-convert-${res.id}`;
        spanToConvert.textContent = '0';
        tdToConvert.appendChild(spanToConvert);
        tr.appendChild(tdToConvert);
        // Используется
        const tdUsed = document.createElement('td');
        tdUsed.className = 'td-output';
        tdUsed.style.color = '#daa548';
        const spanUsed = document.createElement('span');
        spanUsed.className = 'required-used-for-conversion-output';
        spanUsed.id = `req-used-for-conversion-${res.id}`;
        spanUsed.textContent = '0';
        tdUsed.appendChild(spanUsed);
        tr.appendChild(tdUsed);
        // Всего
        const tdTotal = document.createElement('td');
        tdTotal.className = 'td-output';
        const spanTotal = document.createElement('span');
        spanTotal.className = 'required-total-output';
        spanTotal.id = `req-total-${res.id}`;
        spanTotal.textContent = '0';
        tdTotal.appendChild(spanTotal);
        tr.appendChild(tdTotal);
        // Иконка копирования (Итого)
        const tdCopy = document.createElement('td');
        tdCopy.className = 'td-copy';
        tdCopy.style.width = '16px';
        tdCopy.style.textAlign = 'center';
        const imgCopy = document.createElement('img');
        imgCopy.src = 'images/i-copy-16.png';
        imgCopy.alt = 'Copy';
        imgCopy.className = 'copy-total-img';
        imgCopy.style.cursor = 'pointer';
        imgCopy.setAttribute('data-resource-id', res.id);
        tdCopy.appendChild(imgCopy);
        tr.appendChild(tdCopy);
        tbody.appendChild(tr);
    });
    return tbody;
}

// Добавим обработчики для иконок копирования
export function setupCopyButtons() {
    // Копировать "Желаемое количество"
    document.querySelectorAll('.copy-desired-img').forEach(img => {
        img.addEventListener('click', function() {
            const matId = img.getAttribute('data-material-id');
            const input = document.getElementById('target-' + matId);
            if (input) {
                // Копировать только целое число
                const val = parseInt(input.value.replace(/\D/g, '')) || 0;
                navigator.clipboard.writeText(String(val));
            }
        });
    });
    // Копировать "Итого"
    document.querySelectorAll('.copy-total-img').forEach(img => {
        img.addEventListener('click', function() {
            const resId = img.getAttribute('data-resource-id');
            const span = document.getElementById('req-total-' + resId);
            if (span) {
                // Копировать только целое число
                const val = parseInt(span.textContent.replace(/\D/g, '')) || 0;
                navigator.clipboard.writeText(String(val));
            }
        });
    });
}
