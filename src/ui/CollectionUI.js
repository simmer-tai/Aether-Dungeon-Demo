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

                // Add hover for details
                item.addEventListener('mouseover', () => this.updateDetails(skill));
                item.addEventListener('mouseout', () => this.clearDetails());
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
     * Updates the detail panel with skill information.
     * @param {Object} skill 
     */
    static updateDetails(skill) {
        const details = document.getElementById('collection-details');
        if (!details) return;

        const p = skill.params || {};
        const damage = p.damage || 0;
        const cooldown = skill.cooldown || 0;
        const crit = Math.round((p.critChance || 0) * 100);
        const critMult = p.critMultiplier || 1.0;
        const status = p.statusEffect ? `${p.statusEffect} (${Math.round((p.statusChance || 0) * 100)}%)` : '-';

        details.innerHTML = `
            <div class="details-content">
                <div class="details-main-row">
                    <span class="details-name">${skill.name}</span>
                    <span class="details-desc" style="font-size: 11px; color: #ccc;">${skill.description}</span>
                </div>
                <div class="collection-stats-row">
                    <div class="c-stat-item">
                        <span class="c-stat-label">威力:</span>
                        <span class="c-stat-value">${damage}</span>
                    </div>
                    <div class="c-stat-item">
                        <span class="c-stat-label">待機:</span>
                        <span class="c-stat-value">${cooldown}s</span>
                    </div>
                    <div class="c-stat-item">
                        <span class="c-stat-label">会心:</span>
                        <span class="c-stat-value">${crit}% (x${critMult})</span>
                    </div>
                    <div class="c-stat-item">
                        <span class="c-stat-label">効果:</span>
                        <span class="c-stat-value">${status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Clears the detail panel.
     */
    static clearDetails() {
        const details = document.getElementById('collection-details');
        if (details) {
            details.innerHTML = '<div class="details-hint">スキルにカーソルを合わせて詳細を表示</div>';
        }
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
