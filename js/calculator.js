// calculator.js: ядро расчетов калькулятора
// Экспортируйте функцию calculateRequiredResources

import { recipes, conversions, CONVERSION_LOSS_FACTOR, baseResourcesList } from './data.js';
import { baseConversions } from './data.js';

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
    // 2. Direct use and conversion needs (ТЗ 5)
    const directUseAmount = {};
    const amountToConvert = {};
    allResources.forEach(resName => {
        const gross = initialNeeds[resName] || 0;
        const percent = mineralUsagePercent[resName] ?? 100;
        directUseAmount[resName] = gross; // direct use = initialNeeds
        amountToConvert[resName] = Math.ceil(gross * (100 - percent) / 100);
    });
    // 3. Conversion costs (ТЗ 5: прямые коэффициенты и учёт actuallyConverted)
    const conversionCosts = {};
    const actuallyConverted = {};
    allResources.forEach(r => { conversionCosts[r] = 0; actuallyConverted[r] = 0; });
    allResources.forEach(targetRes => {
        let originalNeed = amountToConvert[targetRes];
        if (originalNeed <= 0) return;
        let allocatedShare = 0;
        for (const srcObj of baseResourcesList) {
            const srcRes = srcObj.name;
            if (srcRes === targetRes) continue;
            const srcPercent = mineralUsagePercent[srcRes] ?? 100;
            if (srcPercent === 0) continue;
            // --- используем baseConversions ---
            const directCoef = baseConversions[targetRes]?.[srcRes];
            if (!directCoef) continue;
            const potentialShare = srcPercent / 100;
            const actualShareToCover = Math.max(0, Math.min(potentialShare, 1.0 - allocatedShare));
            if (actualShareToCover < 1e-8) continue;
            const makeNow = originalNeed * actualShareToCover;
            const costPerUnit = directCoef * CONVERSION_LOSS_FACTOR;
            const actualCost = Math.ceil(makeNow * costPerUnit);
            conversionCosts[srcRes] = (conversionCosts[srcRes] || 0) + actualCost;
            actuallyConverted[targetRes] = (actuallyConverted[targetRes] || 0) + makeNow;
            allocatedShare += actualShareToCover;
            if (allocatedShare >= 0.999999) break;
        }
    });
    // 4. Итоговая потребность: initialNeeds - amountToConvert + conversionCosts
    const finalRequired = {};
    allResources.forEach(resName => {
        finalRequired[resName] = (initialNeeds[resName] || 0) - (amountToConvert[resName] || 0) + (conversionCosts[resName] || 0);
    });
    return {
        initialNeeds,
        amountToConvert,
        conversionCosts,
        finalRequired,
        actuallyConverted
    };
}
