import { SaveManager } from '../SaveManager.js';
import { skillsDB } from '../../data/skills_db.js';
import { getCachedImage } from '../utils.js';

export class CollectionUI {
    /**
     * Renders the collection grid within the provided container.
     * @param {HTMLElement} gridContainer 
     */
    static render(gridContainer) {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        const saveData = SaveManager.getSaveData();
        const unlockedIds = saveData.unlockedSkills || [];

        // Group skills by type for better organization (optional)
        // For now, just show all in order of DB

        skillsDB.forEach(skill => {
            const isUnlocked = unlockedIds.includes(skill.id);
            const item = document.createElement('div');
            item.className = `collection-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            if (isUnlocked) {
                const icon = getCachedImage(skill.icon);
                item.innerHTML = `
                    <div class="collection-icon-wrapper">
                        <img src="${skill.icon}" alt="${skill.name}" class="collection-icon">
                    </div>
                    <div class="collection-item-name">${skill.name}</div>
                    <div class="collection-item-rarity" data-type="${skill.type}">${skill.type}</div>
                `;

                // Add hover for details?
                item.title = skill.description;
            } else {
                item.innerHTML = `
                    <div class="collection-icon-wrapper locked">
                        <span class="locked-icon">?</span>
                    </div>
                    <div class="collection-item-name">???</div>
                    <div class="collection-item-rarity">LOCKED</div>
                `;
            }

            gridContainer.appendChild(item);
        });
    }

    /**
     * Opens the collection modal.
     */
    static open() {
        const modal = document.getElementById('collection-modal');
        const grid = document.getElementById('collection-grid');
        if (modal && grid) {
            this.render(grid);
            modal.style.display = 'flex';
            modal.style.animation = 'fadeInModal 0.3s forwards';
        }
    }

    /**
     * Closes the collection modal.
     */
    static close() {
        const modal = document.getElementById('collection-modal');
        if (modal) {
            modal.style.animation = 'fadeOutModal 0.3s forwards';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.animation = '';
            }, 300);
        }
    }
}
