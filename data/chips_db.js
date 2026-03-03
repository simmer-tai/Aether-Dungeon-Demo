/**
 * Aether Chips Database
 * Categories:洞察 (Insight), 技巧 (Technique), 耐久 (Durability), 俊敏 (Agility)
 */
export const chipsDB = [
    {
        id: 'power_strike',
        name: '猛攻',
        category: '技巧',
        description: 'スキルダメージ',
        baseCost: 4,
        ranks: [
            { level: 1, value: 0.05, cost: 4 },
            { level: 2, value: 0.10, cost: 5 },
            { level: 3, value: 0.15, cost: 6 },
            { level: 4, value: 0.20, cost: 7 },
            { level: 5, value: 0.25, cost: 8 }
        ],
        effectType: 'damage_mult'
    },
    {
        id: 'life_spark',
        name: '命の灯火',
        category: '耐久',
        description: '最大HP',
        baseCost: 3,
        ranks: [
            { level: 1, value: 5, cost: 3 },
            { level: 2, value: 10, cost: 4 },
            { level: 3, value: 15, cost: 5 },
            { level: 4, value: 20, cost: 6 },
            { level: 5, value: 25, cost: 7 }
        ],
        effectType: 'max_hp'
    },
    {
        id: 'swift_step',
        name: '迅速',
        category: '俊敏',
        description: '移動速度',
        baseCost: 2,
        ranks: [
            { level: 1, value: 0.03, cost: 2 },
            { level: 2, value: 0.06, cost: 3 },
            { level: 3, value: 0.09, cost: 4 },
            { level: 4, value: 0.12, cost: 5 },
            { level: 5, value: 0.15, cost: 6 }
        ],
        effectType: 'speed_mult'
    }
];
