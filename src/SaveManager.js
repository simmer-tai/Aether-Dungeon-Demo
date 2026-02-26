/**
 * Manages persistent game data using localStorage.
 */
export class SaveManager {
    static STORAGE_KEY = 'aether_dungeon_save_data';

    /**
     * Retrieves the current save data from localStorage.
     * @returns {Object} The save data object.
     */
    static getSaveData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse save data:', e);
                return this.createInitialData();
            }
        }
        return this.createInitialData();
    }

    /**
     * Saves the data object to localStorage.
     * @param {Object} data The data to save.
     */
    static saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Creates the initial structure for save data.
     * @returns {Object}
     */
    static createInitialData() {
        return {
            unlockedSkills: [], // List of skill IDs
            stats: {
                totalKills: 0,
                totalRuns: 0,
                deepestFloor: 0
            }
        };
    }

    /**
     * Records a newly unlocked skill.
     * @param {string} skillId 
     */
    static unlockSkill(skillId) {
        const data = this.getSaveData();
        if (!data.unlockedSkills.includes(skillId)) {
            data.unlockedSkills.push(skillId);
            this.saveData(data);
            console.log(`[SaveManager] Skill unlocked: ${skillId}`);
        }
    }

    /**
     * Checks if a skill is already unlocked in the collection.
     * @param {string} skillId 
     * @returns {boolean}
     */
    static isSkillUnlocked(skillId) {
        const data = this.getSaveData();
        return data.unlockedSkills.includes(skillId);
    }
}
