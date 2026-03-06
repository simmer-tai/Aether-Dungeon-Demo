import { chipsDB } from '../data/chips_db.js';

/**
 * Manages the Aether Circuit (mod system).
 * Handles equipped chips, capacity, and stat calculations.
 */
export class AetherCircuitManager {
    constructor(player) {
        this.player = player;
        this.slots = new Array(6).fill(null); // 6 slots for chips
        this.ownedChips = []; // All chips in collection
        this.maxCapacity = 50; // Initial capacity (increased from 20)
    }

    /**
     * Calculates current capacity based on level (example).
     */
    updateCapacity() {
        // Implementation could depend on player level or specific upgrades
        this.maxCapacity = 50 + (this.player.currentFloor * 2);
    }

    get usedCapacity() {
        return this.slots.reduce((total, chip) => {
            return total + (chip ? chip.getCurrentCost() : 0);
        }, 0);
    }

    /**
     * Equips a chip to a specific slot.
     */
    equipChip(chipInstance, slotIndex) {
        if (slotIndex < 0 || slotIndex >= 6) return false;

        // Remove from existing slot if already equipped
        const existingSlot = this.slots.indexOf(chipInstance);
        if (existingSlot !== -1) {
            this.slots[existingSlot] = null;
        }

        // Check capacity
        const newTotal = this.usedCapacity + chipInstance.getCurrentCost();
        if (newTotal > this.maxCapacity) {
            console.warn("Aether Circuit: Over capacity!");
            return false;
        }

        this.slots[slotIndex] = chipInstance;
        this.player.saveAetherData(); // Persist change
        return true;
    }

    unequipChip(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 6) {
            this.slots[slotIndex] = null;
            this.player.saveAetherData(); // Persist change
        }
    }

    /**
     * Recalculates all bonuses from equipped chips.
     */
    getBonuses() {
        const bonuses = {
            damageMult: 0,
            maxHp: 0,
            speedMult: 0,
            aetherChargeMult: 0,
            fireDamageMult: 0,
            critRateAdd: 0,
            onHitDamageBuff: 0
        };

        this.slots.forEach(chip => {
            if (chip) {
                const effect = chip.getCurrentEffect();
                if (chip.data.effectType === 'damage_mult') bonuses.damageMult += effect;
                if (chip.data.effectType === 'max_hp') bonuses.maxHp += effect;
                if (chip.data.effectType === 'speed_mult') bonuses.speedMult += effect;
                if (chip.data.effectType === 'aether_charge_mult') bonuses.aetherChargeMult += effect;
                if (chip.data.effectType === 'fire_damage_mult') bonuses.fireDamageMult += effect;
                if (chip.data.effectType === 'crit_rate_add') bonuses.critRateAdd += effect;
                if (chip.data.effectType === 'on_hit_damage_buff') bonuses.onHitDamageBuff += effect;
            }
        });

        return bonuses;
    }

    /**
     * Load data for Aether Circuit.
     */
    deserialize(data) {
        if (!data) return;

        // Load owned chips
        this.ownedChips = (data.ownedChips || []).map(chipData => {
            // Pass instanceId as 4th arg to preserve it
            const chip = new ChipInstance(chipData.id, chipData.level, chipData.isIdentified !== false, chipData.instanceId);
            return chip;
        });

        // Load equipment
        if (data.equippedChipIds) {
            data.equippedChipIds.forEach((instanceId, idx) => {
                if (instanceId && idx < 6) {
                    const chip = this.ownedChips.find(c => c.instanceId === instanceId);
                    if (chip) this.slots[idx] = chip;
                }
            });
        }
    }

    serialize() {
        return {
            ownedChips: this.ownedChips.map(c => c.serialize()),
            equippedChipIds: this.slots.map(c => c ? c.instanceId : null)
        };
    }
}

/**
 * Instance of a chip in the inventory.
 */
export class ChipInstance {
    constructor(id, level = 1, isIdentified = true, instanceId = null) {
        this.data = chipsDB.find(c => c.id === id);
        this.instanceId = instanceId || Math.random().toString(36).substr(2, 9);
        this.level = level;
        this.isIdentified = isIdentified;
    }

    getCurrentCost() {
        if (this.data.ranks.length < 2) return this.data.baseCost;

        const rank1 = this.data.ranks[0];
        const rank5 = this.data.ranks[this.data.ranks.length - 1]; // Original Max

        // Linear interpolation from Level 1 to 10
        const progress = (this.level - 1) / 9;
        const interpolated = rank1.cost + (rank5.cost - rank1.cost) * progress;
        return Math.round(interpolated);
    }

    getCurrentEffect() {
        if (this.data.ranks.length < 2) return 0;

        const rank1 = this.data.ranks[0];
        const rank5 = this.data.ranks[this.data.ranks.length - 1];

        const progress = (this.level - 1) / 9;
        return rank1.value + (rank5.value - rank1.value) * progress;
    }

    serialize() {
        return {
            id: this.data.id,
            level: this.level,
            instanceId: this.instanceId,
            isIdentified: this.isIdentified
        };
    }
}
