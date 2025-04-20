// calculator.js: ядро расчетов калькулятора
// Экспортируйте функцию calculateRequiredResources

import { recipes, conversions, CONVERSION_LOSS_FACTOR, baseResourcesList } from './data.js';

export function calculateRequiredResources(desiredMaterials, mineralUsagePercent) {
    // 1. Gross needs (initialNeeds)
    const initialNeeds = {};
    for (const matName in desiredMaterials) {
        const qty = desiredMaterials[matName];
        const recipe = recipes[matName];
        if (!recipe) continue;
        for (const resName in recipe) {
            initialNeeds[resName] = (initialNeeds[resName] || 0) + recipe[resName] * qty;
        }
    }
    const allResources = baseResourcesList.map(r => r.name);
    // 2. Direct use and conversion needs
    const directUseAmount = {};
    const amountToConvert = {};
    allResources.forEach(resName => {
        const gross = initialNeeds[resName] || 0;
        const percent = mineralUsagePercent[resName] ?? 100;
        directUseAmount[resName] = Math.floor(gross * percent / 100);
        amountToConvert[resName] = Math.ceil(gross * (100 - percent) / 100);
    });
    // 3. Conversion costs
    const conversionCosts = {};
    allResources.forEach(r => { conversionCosts[r] = 0; });
    allResources.forEach(targetRes => {
        let remainingToConvert = amountToConvert[targetRes];
        if (remainingToConvert <= 0) return;
        for (const srcRes of allResources) {
            if (srcRes === targetRes) continue;
            const srcPercent = mineralUsagePercent[srcRes] ?? 100;
            if (srcPercent === 0) continue;
            const coef = conversions[targetRes][srcRes];
            if (!coef) continue;
            const costPerUnit = coef * CONVERSION_LOSS_FACTOR;
            // По ТЗ: если ресурс разрешён к использованию, можно использовать его без ограничения его собственной initialNeed
            const makeNow = remainingToConvert;
            const actualCost = Math.ceil(makeNow * costPerUnit);
            conversionCosts[srcRes] += actualCost;
            remainingToConvert -= makeNow;
            if (remainingToConvert <= 0) break;
        }
    });
    // 4. Итоговая потребность
    const finalRequired = {};
    allResources.forEach(resName => {
        finalRequired[resName] = directUseAmount[resName] + conversionCosts[resName];
    });
    return {
        initialNeeds,
        amountToConvert,
        conversionCosts,
        finalRequired
    };
}
