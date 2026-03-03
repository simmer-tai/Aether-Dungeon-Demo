import { fetchTopRankings, submitScore } from './firebase_manager.js';

let skillSlots = null;

function initSkillSlots() {
    skillSlots = {
        normal: {
            el: document.getElementById('skill-normal'),
            icon: document.querySelector('#skill-normal .skill-icon'),
            fallback: document.querySelector('#skill-normal .skill-fallback-text'),
            overlay: document.querySelector('#skill-normal .cooldown-overlay'),
            text: document.querySelector('#skill-normal .cooldown-text'),
            stack: document.querySelector('#skill-normal .stack-count')
        },
        primary1: {
            el: document.getElementById('skill-primary1'),
            icon: document.querySelector('#skill-primary1 .skill-icon'),
            fallback: document.querySelector('#skill-primary1 .skill-fallback-text'),
            overlay: document.querySelector('#skill-primary1 .cooldown-overlay'),
            text: document.querySelector('#skill-primary1 .cooldown-text'),
            stack: document.querySelector('#skill-primary1 .stack-count')
        },
        primary2: {
            el: document.getElementById('skill-primary2'),
            icon: document.querySelector('#skill-primary2 .skill-icon'),
            fallback: document.querySelector('#skill-primary2 .skill-fallback-text'),
            overlay: document.querySelector('#skill-primary2 .cooldown-overlay'),
            text: document.querySelector('#skill-primary2 .cooldown-text'),
            stack: document.querySelector('#skill-primary2 .stack-count')
        },
        secondary: {
            el: document.getElementById('skill-secondary'),
            icon: document.querySelector('#skill-secondary .skill-icon'),
            fallback: document.querySelector('#skill-secondary .skill-fallback-text'),
            overlay: document.querySelector('#skill-secondary .cooldown-overlay'),
            text: document.querySelector('#skill-secondary .cooldown-text'),
            stack: document.querySelector('#skill-secondary .stack-count')
        },
        ultimate: {
            el: document.getElementById('skill-ultimate'),
            icon: document.querySelector('#skill-ultimate .skill-icon'),
            fallback: document.querySelector('#skill-ultimate .skill-fallback-text'),
            overlay: document.querySelector('#skill-ultimate .cooldown-overlay'),
            text: document.querySelector('#skill-ultimate .cooldown-text'),
            stack: document.querySelector('#skill-ultimate .stack-count')
        }
    };
}

export function drawUI(ctx, game, width, height) {
    // ... (Game Over logic unchanged)
    if (game.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px "Press Start 2P", cursive';
        ctx.fillText("GAME OVER", width / 2, height / 2 - 60);

        // Final Score
        ctx.fillStyle = 'white';
        ctx.font = '20px "Press Start 2P", cursive';
        ctx.fillText(`SCORE: ${Math.floor(game.score)}`, width / 2, height / 2 + 10);

        // New Record Highlight
        if (game.score >= game.highScore && game.score > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px "Press Start 2P", cursive';
            ctx.fillText("NEW RECORD!", width / 2, height / 2 + 60);

            // Subtle pulsing glow
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.shadowBlur = 10 * pulse;
            ctx.shadowColor = '#ffd700';
        } else {
            ctx.fillStyle = '#aaa';
            ctx.font = '14px "Press Start 2P", cursive';
            ctx.fillText(`BEST: ${Math.floor(game.highScore)}`, width / 2, height / 2 + 50);
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px "Press Start 2P", cursive';
        ctx.fillText("Press [SPACE] to Restart", width / 2, height / 2 + 120);

        ctx.textAlign = 'left'; // Reset for other UI elements
        return;
    }

    // Update Currency
    updateCurrency(game.player.currency);

    // Update Aether Gauge
    updateAetherGauge(game.player.aetherGauge, game.player.maxAetherGauge);

    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    // ctx.fillText(`Enemies: ${game.enemies.length}`, 10, 20);

    // Draw Version
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText("v0.6.0 (Pro)", width - 10, height - 10);
    ctx.restore();


    if (!skillSlots) initSkillSlots();

    // --- HUD Visibility Management ---
    const uiLayerEl = document.getElementById('ui-layer');
    const skillBarEl = document.getElementById('skill-bar');
    const healthBarEl = document.getElementById('health-bar-container');
    const currencyDisplayEl = document.getElementById('currency-display');
    const scoreDisplayEl = document.getElementById('score-display');
    const floorDisplayEl = document.getElementById('floor-display');
    const settingsBtnEl = document.getElementById('settings-btn');

    if (!game.isHUDVisible) {
        if (uiLayerEl) {
            // We want to keep the UI layer for things like level up, but hide specific HUD elements
            if (skillBarEl) skillBarEl.style.display = 'none';
            if (healthBarEl) healthBarEl.style.display = 'none';
            if (currencyDisplayEl) currencyDisplayEl.style.display = 'none';
            if (scoreDisplayEl) scoreDisplayEl.style.display = 'none';
            if (floorDisplayEl) floorDisplayEl.style.display = 'none';
            if (settingsBtnEl) settingsBtnEl.style.display = 'none';
        }
        return; // Skip Canvas HUD drawing (Mini-map, etc)
    } else {
        if (skillBarEl) skillBarEl.style.display = 'flex';
        if (healthBarEl) healthBarEl.style.display = 'flex';
        if (currencyDisplayEl) currencyDisplayEl.style.display = 'flex';
        if (scoreDisplayEl) scoreDisplayEl.style.display = 'flex';
        if (floorDisplayEl) floorDisplayEl.style.display = 'flex';
        if (settingsBtnEl) settingsBtnEl.style.display = 'flex';
    }

    // Update Skill DOM UI
    for (let key in game.player.equippedSkills) {
        const skill = game.player.equippedSkills[key];
        const slot = skillSlots[key];

        if (slot) {
            if (!slot.icon) console.warn("UI Warning: Icon element missing for slot", key);

            if (skill) {
                // Update Icon
                // Update Icon with Fallback
                if (skill.icon) {
                    if (slot.lastIcon !== skill.icon) {
                        slot.lastIcon = skill.icon;
                        slot.icon.src = skill.icon;

                        // Reset handlers
                        slot.icon.onload = () => {
                            slot.icon.style.display = 'block';
                            slot.fallback.style.display = 'none';
                        };
                        slot.icon.onerror = () => {
                            slot.icon.style.display = 'none';
                            slot.fallback.textContent = skill.name;
                            slot.fallback.style.display = 'block';
                        };
                    }
                    // Note: If icon matches lastIcon, we assume state is managed by handlers
                } else {
                    if (slot.icon.style.display !== 'none') slot.icon.style.display = 'none';
                    if (slot.fallback.style.display !== 'block') {
                        slot.fallback.textContent = skill.name;
                        slot.fallback.style.display = 'block';
                    }
                }

                // Update Cooldown
                if (skill.currentCooldown > 0) {
                    const ratio = skill.currentCooldown / skill.cooldown;
                    slot.overlay.style.height = `${ratio * 100}%`;
                    slot.text.style.display = 'block';
                    slot.text.textContent = skill.currentCooldown.toFixed(1);
                    slot.el.classList.remove('active');
                } else {
                    slot.overlay.style.height = '0%';
                    slot.text.style.display = 'none';
                    slot.el.classList.add('active');
                }

                // Update Stacks
                if (skill.maxStacks > 1) {
                    slot.stack.textContent = skill.stacks;
                    slot.stack.style.display = 'block';
                } else {
                    slot.stack.style.display = 'none';
                }

                // Aether Rush Visuals for Ultimate
                if (key === 'ultimate') {
                    if (game.player.isAetherRush) {
                        slot.el.classList.add('aether-rush');
                    } else {
                        slot.el.classList.remove('aether-rush');
                    }
                }

            } else {
                slot.icon.style.display = 'none';
                slot.overlay.style.height = '0%';
                slot.text.style.display = 'none';
                slot.el.classList.remove('active');
                slot.stack.style.display = 'none';
            }
        }
    }

    // Update HP Bar
    const hpFill = document.getElementById('health-bar-fill');
    const hpText = document.getElementById('health-bar-text');
    const hpValue = document.getElementById('hp-value');
    const hpMax = document.getElementById('hp-max');
    if (hpFill && hpText && hpValue && hpMax) {
        const ratio = Math.min(1, Math.max(0, game.player.hp / game.player.maxHp));
        hpFill.style.width = `${ratio * 100}%`;
        hpValue.textContent = Math.ceil(game.player.hp);
        hpMax.textContent = Math.ceil(game.player.maxHp);
    }

    // Draw Mini-map
    drawMiniMap(ctx, game, width, height);
}

function drawMiniMap(ctx, game, screenWidth, screenHeight) {
    const map = game.map;
    const player = game.player;

    // Mini-map configuration
    const mapSize = 280; // Doubled from 140
    const timerSize = 4; // Tile size in pixels (if fitted)

    // Calculate scale to fit in mapSize
    const scaleX = mapSize / map.width;
    const scaleY = mapSize / map.height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

    const mmW = map.width * scale;
    const mmH = map.height * scale;

    const mmX = screenWidth - mmW - 20; // 20px padding from right
    const mmY = 20; // 20px padding from top

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mmX - 5, mmY - 5, mmW + 10, mmH + 10);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - 5, mmY - 5, mmW + 10, mmH + 10);

    // Draw Map Tiles
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.tiles[y][x];

            // Check for Staircase
            let isStaircase = false;
            let isShop = false;
            let isBoss = false;
            // Check room grid for staircase type
            if (map.roomGrid && map.roomGrid[y] && map.roomGrid[y][x] !== -1) {
                const roomId = map.roomGrid[y][x];
                const room = map.rooms[roomId];
                if (room && room.type === 'staircase') {
                    const centerX = room.x + Math.floor(room.w / 2);
                    const centerY = room.y + Math.floor(room.h / 2);
                    // Highlight center 2x2
                    if ((x === centerX || x === centerX - 1) && (y === centerY || y === centerY - 1)) {
                        isStaircase = true;
                    }
                }
                if (room && room.type === 'shop') {
                    isShop = true;
                }
                if (room && room.type === 'boss') {
                    isBoss = true;
                }
            }

            if (isStaircase) {
                if (game.debugMode || map.exploredTiles[y][x]) {
                    ctx.fillStyle = '#00ffff'; // Cyan for stairs
                    ctx.fillRect(mmX + x * scale, mmY + y * scale, scale, scale);
                }
            } else if (isBoss && tile === 0) {
                if (game.debugMode || map.exploredTiles[y][x]) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; // Red tint for boss room
                    ctx.fillRect(mmX + x * scale, mmY + y * scale, scale, scale);
                }
            } else if (isShop && tile === 0) {
                if (game.debugMode || map.exploredTiles[y][x]) {
                    ctx.fillStyle = 'rgba(255, 200, 0, 0.35)'; // Gold tint for shop floor
                    ctx.fillRect(mmX + x * scale, mmY + y * scale, scale, scale);
                }
            } else if (tile === 1) {
                // Wall
                if (game.debugMode || map.exploredTiles[y][x]) {
                    ctx.fillStyle = '#888';
                    ctx.fillRect(mmX + x * scale, mmY + y * scale, scale, scale);
                }
                // Floor - Do nothing (Transparent/Background)
            } else if (tile === 0) {
                // Floor
                if (game.debugMode || map.exploredTiles[y][x]) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Very subtle floor highlight?
                    ctx.fillRect(mmX + x * scale, mmY + y * scale, scale, scale);
                }
            }
        }
    }

    // Draw Statues
    if (game.statues) {
        ctx.fillStyle = '#ffffff'; // White for statues
        game.statues.forEach(statue => {
            const tx = Math.floor(statue.x / map.tileSize);
            const ty = Math.floor(statue.y / map.tileSize);
            if (!statue.used && (game.debugMode || map.exploredTiles[ty][tx])) {
                const sX = (statue.x / map.tileSize) * scale;
                const sY = (statue.y / map.tileSize) * scale;
                // Draw a small rect or circle
                ctx.fillRect(mmX + sX, mmY + sY, Math.max(2, scale), Math.max(2, scale));
            }
        });
    }

    // Draw Shop NPCs
    if (game.shopNPCs) {
        game.shopNPCs.forEach(npc => {
            const tx = Math.floor(npc.x / map.tileSize);
            const ty = Math.floor(npc.y / map.tileSize);
            if (game.debugMode || map.exploredTiles[ty][tx]) {
                const sX = (npc.x / map.tileSize) * scale;
                const sY = (npc.y / map.tileSize) * scale;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(mmX + sX + scale / 2, mmY + sY + scale / 2, Math.max(3, scale * 1.5), 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Draw Player
    const pX = (player.x / map.tileSize) * scale;
    const pY = (player.y / map.tileSize) * scale;

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(mmX + pX + (player.width / map.tileSize * scale) / 2, mmY + pY + (player.height / map.tileSize * scale) / 2, Math.max(2, scale), 0, Math.PI * 2);
    ctx.fill();
}

// --- Skill Selection UI ---
const skillModal = document.getElementById('skill-selection-modal');
const skillCardsContainer = document.getElementById('skill-selection-cards');

export function showSkillSelection(skills, onSelectCallback) {
    if (!skillModal || !skillCardsContainer) return;

    // Clear previous
    skillCardsContainer.innerHTML = '';

    skills.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.dataset.type = skill.type; // for styling

        // Icon
        const icon = document.createElement('img');
        icon.className = 'skill-card-icon';
        icon.src = skill.icon || 'assets/icon_unknown.png'; // Fallback? based on type?
        icon.onerror = () => { icon.style.display = 'none'; }; // Hide if missing
        card.appendChild(icon);

        // Name
        const name = document.createElement('div');
        name.className = 'skill-card-name';
        name.textContent = skill.name;
        card.appendChild(name);

        // Type
        const type = document.createElement('div');
        type.className = 'skill-card-type';
        // Translate type or capitalize
        const typeMap = {
            normal: '通常スキル',
            primary: 'メインスキル',
            secondary: 'サブスキル',
            ultimate: 'アルティメット'
        };
        type.textContent = typeMap[skill.type] || skill.type.toUpperCase();
        card.appendChild(type);

        // Description
        const desc = document.createElement('div');
        desc.className = 'skill-card-desc';
        desc.textContent = skill.description || '説明がありません。';
        card.appendChild(desc);

        // Click Handler
        card.addEventListener('click', () => {
            hideSkillSelection();
            if (onSelectCallback) onSelectCallback(skill);
        });

        skillCardsContainer.appendChild(card);
    });

    skillModal.style.display = 'flex';
}

export function hideSkillSelection() {
    if (skillModal) {
        skillModal.style.display = 'none';
        skillCardsContainer.innerHTML = ''; // Cleanup
    }
}

// --- Blessing Selection UI ---
const blessingModal = document.getElementById('blessing-selection-modal');
const blessingCardsContainer = document.getElementById('blessing-selection-cards');

export function showBlessingSelection(options, onSelectCallback, source = 'default') {
    if (!blessingModal || !blessingCardsContainer) return;

    // Clear previous
    blessingCardsContainer.innerHTML = '';

    options.forEach(opt => {
        const card = document.createElement('div');
        card.className = source === 'angel' ? 'blessing-card angel-card' : 'blessing-card';
        card.dataset.id = opt.id;

        // Name
        const name = document.createElement('div');
        name.className = 'blessing-card-name';
        name.textContent = opt.name;
        // Center the name explicitly since icon is gone
        name.style.marginTop = '20px';
        card.appendChild(name);

        // Description
        const desc = document.createElement('div');
        desc.className = 'blessing-card-desc';
        desc.textContent = opt.description || opt.desc || '';
        card.appendChild(desc);

        // Click Handler
        card.addEventListener('click', () => {
            hideBlessingSelection();
            if (onSelectCallback) onSelectCallback(opt);
        });

        blessingCardsContainer.appendChild(card);
    });

    blessingModal.style.display = 'flex';
}

export function showAcquiredBlessing(blessing, onConfirmCallback, source = 'blood') {
    if (!blessingModal || !blessingCardsContainer) return;

    // Clear previous
    blessingCardsContainer.innerHTML = '';

    // Also remove any existing standalone acquire btn (from previous calls)
    const container = blessingModal.querySelector('.skill-selection-container');
    const existingBtn = container.querySelector('.acquire-btn-wrapper');
    if (existingBtn) existingBtn.remove();

    // Change Title temporarily
    const title = blessingModal.querySelector('h2');
    const originalTitle = title ? title.textContent : '女神の祝福';
    if (title) title.textContent = source === 'angel' ? '天使の加護を獲得！' : '血の祝福を獲得！';

    // Wrapper to stack name above card
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '20px';

    const card = document.createElement('div');
    card.className = source === 'angel'
        ? 'blessing-card acquired angel-card'
        : 'blessing-card acquired';
    card.style.cursor = 'default';

    // Name (Now placed OUTSIDE/ABOVE the card)
    const name = document.createElement('div');
    name.className = 'blessing-card-name acquired-title';
    name.textContent = blessing.name;
    name.style.color = source === 'angel' ? '#ffe066' : '#ff4444';
    name.style.fontSize = '32px';
    name.style.marginBottom = '0';
    wrapper.appendChild(name);

    // Description (Inside card, will be centered via CSS)
    const desc = document.createElement('div');
    desc.className = 'blessing-card-desc';
    desc.textContent = blessing.description || blessing.desc || '';
    card.appendChild(desc);

    wrapper.appendChild(card);
    blessingCardsContainer.appendChild(wrapper);

    // Acquire Button Wrapper (placed outside cards container)
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'acquire-btn-wrapper';
    btnWrapper.style.marginTop = '30px';
    btnWrapper.style.width = '100%';
    btnWrapper.style.display = 'flex';
    btnWrapper.style.justifyContent = 'center';

    const btn = document.createElement('button');
    btn.className = 'acquire-btn';
    btn.textContent = '獲得';
    btn.style.width = '200px'; // Fixed width when outside
    btn.addEventListener('click', () => {
        if (title) title.textContent = originalTitle;
        btnWrapper.remove();
        hideBlessingSelection();
        if (onConfirmCallback) onConfirmCallback();
    });
    btnWrapper.appendChild(btn);
    container.appendChild(btnWrapper);

    blessingModal.style.display = 'flex';
}

export function hideBlessingSelection() {
    if (blessingModal) {
        blessingModal.style.display = 'none';
        blessingCardsContainer.innerHTML = '';
    }
}

export function updateCurrency(amount) {
    const el = document.getElementById('currency-value');
    if (el) {
        el.textContent = amount;
    }
}


const dialogueOverlay = document.getElementById('dialogue-overlay');
const dialogueTextEl = document.getElementById('dialogue-text');

export function drawDialogue(game, text) {
    const overlay = document.getElementById('dialogue-overlay');
    const textEl = document.getElementById('dialogue-text');
    if (!overlay || !textEl) return;

    // Show Overlay
    if (overlay.style.display !== 'flex') {
        overlay.style.display = 'flex';
    }

    // Update Text (Avoid redundant updates to prevent flicker/cursor reset if any)
    const safeText = text || "";
    if (textEl.textContent !== safeText) {
        textEl.textContent = safeText;
    }
}

export function hideDialogue() {
    if (dialogueOverlay && dialogueOverlay.style.display !== 'none') {
        dialogueOverlay.style.display = 'none';
        hideChoices(); // Ensure choices are hidden too

        const prompt = document.getElementById('dialogue-prompt');
        if (prompt) prompt.style.display = 'block';
    }
}

const choicesContainer = document.getElementById('dialogue-choices-container');

export function showChoices(options, onSelectCallback) {
    if (!choicesContainer) return;

    const prompt = document.getElementById('dialogue-prompt');
    if (prompt) prompt.style.display = 'none';

    choicesContainer.innerHTML = ''; // Clear previous
    choicesContainer.style.display = 'flex';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice-btn';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
            hideChoices();
            if (onSelectCallback) onSelectCallback(opt);
        });
        choicesContainer.appendChild(btn);
    });
}

export function hideChoices() {
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';
    }
}

// --- Settings UI ---
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnTraining = document.getElementById('btn-training');

export function initSettingsUI(game) {
    const cheatContainer = document.getElementById('cheat-menu-container');
    if (cheatContainer) {
        cheatContainer.style.display = game.debugMode ? 'block' : 'none';
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            game.isPaused = true;
            // Update invincible button text when opening
            const invBtn = document.getElementById('btn-cheat-invincible');
            if (invBtn && game.player) {
                invBtn.textContent = `無敵: ${game.player.isCheatInvincible ? 'ON' : 'OFF'}`;
            }
        });
    }

    // Cheat Button Listeners
    const btnTeleportBoss = document.getElementById('btn-cheat-teleport-boss');
    if (btnTeleportBoss) {
        btnTeleportBoss.onclick = () => {
            const bossRoom = game.map.rooms.find(r => r.type === 'boss');
            if (bossRoom && game.player) {
                game.player.x = (bossRoom.x + bossRoom.w / 2) * game.map.tileSize;
                game.player.y = (bossRoom.y + bossRoom.h / 2) * game.map.tileSize;
                settingsModal.style.display = 'none';
                game.isPaused = false;
            }
        };
    }

    const btnTeleportPortal = document.getElementById('btn-cheat-teleport-portal');
    if (btnTeleportPortal) {
        btnTeleportPortal.onclick = () => {
            const portalRoom = game.map.rooms.find(r => r.type === 'staircase');
            if (portalRoom && game.player) {
                game.player.x = (portalRoom.x + portalRoom.w / 2) * game.map.tileSize;
                game.player.y = (portalRoom.y + portalRoom.h / 2) * game.map.tileSize;
                settingsModal.style.display = 'none';
                game.isPaused = false;
            }
        };
    }

    const btnInvincible = document.getElementById('btn-cheat-invincible');
    if (btnInvincible) {
        btnInvincible.onclick = () => {
            if (game.player) {
                game.player.isCheatInvincible = !game.player.isCheatInvincible;
                btnInvincible.textContent = `無敵: ${game.player.isCheatInvincible ? 'ON' : 'OFF'}`;
            }
        };
    }

    if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            game.isPaused = false;
        });
    }

    if (btnTraining) {
        btnTraining.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            game.isPaused = false;
            game.enterTrainingMode();
        });
    }
}

// --- Ranking UI ---
const rankingModal = document.getElementById('ranking-modal');
const rankingList = document.getElementById('ranking-list');
const btnOpenRanking = document.getElementById('btn-open-ranking');
const btnCloseRanking = document.getElementById('btn-close-ranking');

const nicknameModal = document.getElementById('nickname-modal');
const nicknameInput = document.getElementById('nickname-input');
const btnSubmitNickname = document.getElementById('btn-submit-nickname');
const btnCancelNickname = document.getElementById('btn-cancel-nickname');

export function initRankingUI(game) {
    if (btnOpenRanking) {
        btnOpenRanking.addEventListener('click', () => {
            showRanking();
        });
    }

    if (btnCloseRanking) {
        btnCloseRanking.addEventListener('click', () => {
            hideRanking();
        });
    }
}

export async function showRanking() {
    if (!rankingModal || !rankingList) return;

    rankingModal.style.display = 'flex';
    rankingList.innerHTML = '<div class="loading-spinner">通信中...</div>';

    try {
        const rankings = await fetchTopRankings(10);
        rankingList.innerHTML = '';

        if (rankings.length === 0) {
            rankingList.innerHTML = '<div class="loading-spinner">データがありません</div>';
            return;
        }

        rankings.forEach((data, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <span class="rank-num">#${index + 1}</span>
                <span class="rank-name">${data.name || 'ななし'}</span>
                <span class="rank-score">${Math.floor(data.score).toLocaleString()}</span>
            `;
            rankingList.appendChild(item);
        });
    } catch (error) {
        rankingList.innerHTML = '<div class="loading-spinner">読み込みに失敗しました</div>';
    }
}

export function hideRanking() {
    if (rankingModal) rankingModal.style.display = 'none';
}

export function showNicknameInput(onSubmit, onCancel) {
    if (!nicknameModal || !nicknameInput) return;

    nicknameModal.style.display = 'flex';
    nicknameInput.value = localStorage.getItem('last_nickname') || '';
    nicknameInput.focus();

    // Reset listeners
    btnSubmitNickname.onclick = () => {
        const name = nicknameInput.value.trim();
        if (name) {
            localStorage.setItem('last_nickname', name);
            hideNicknameInput();
            if (onSubmit) onSubmit(name);
        } else {
            nicknameInput.style.borderColor = 'red';
        }
    };

    btnCancelNickname.onclick = () => {
        hideNicknameInput();
        if (onCancel) onCancel();
    };
}

export function hideNicknameInput() {
    if (nicknameModal) nicknameModal.style.display = 'none';
}

let aetherFill = null;
function updateAetherGauge(current, max) {
    if (!aetherFill) aetherFill = document.getElementById('aether-gauge-fill');
    if (aetherFill) {
        const pct = Math.min(100, Math.max(0, (current / max) * 100));
        aetherFill.style.width = `${pct}%`;

        // Optional: Change color if full? (CSS handles gradient)
        if (pct >= 100) {
            aetherFill.style.boxShadow = "0 0 15px #00ffff";
        } else {
            aetherFill.style.boxShadow = "0 0 5px #00aaff";
        }
    }
}



// --- Stage Settings UI ---
const stageModal = document.getElementById('stage-settings-modal');
const startSkillList = document.getElementById('start-skill-list');
const btnStartAdventure = document.getElementById('btn-start-adventure');
const btnBackToTitle = document.getElementById('btn-back-to-title');
const btnSelectSkill = document.getElementById('btn-select-skill');
const skillGridOverlay = document.getElementById('skill-selection-grid-overlay');
const currentSkillIcon = document.getElementById('current-skill-icon');
const currentSkillName = document.getElementById('current-skill-name');
const currentSkillDesc = document.getElementById('current-skill-desc');

export function showStageSettings(game, skills, onStartCallback, onBackCallback) {
    if (!stageModal || !startSkillList) return;

    let selectedDifficulty = 'normal';
    // Default to 'slash' if available, else first skill
    let selectedSkillId = skills.some(s => s.id === 'slash') ? 'slash' : (skills.length > 0 ? skills[0].id : null);

    const updateSkillDisplay = () => {
        const skill = skills.find(s => s.id === selectedSkillId);
        if (skill) {
            currentSkillIcon.src = skill.icon || '';
            currentSkillName.textContent = skill.name;
            if (currentSkillDesc) currentSkillDesc.textContent = skill.description || "";
        }
    };
    updateSkillDisplay();

    // Difficulty selection
    const diffOptions = stageModal.querySelectorAll('.diff-option');
    diffOptions.forEach(opt => {
        opt.onclick = () => {
            diffOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedDifficulty = opt.dataset.difficulty;
        };
    });

    // Skill selection logic (GRID)
    startSkillList.innerHTML = '';
    skills.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'start-skill-card';
        if (skill.id === selectedSkillId) card.classList.add('active');

        card.innerHTML = `
            <img src="${skill.icon || ''}" class="start-skill-icon">
        `;

        card.onclick = () => {
            selectedSkillId = skill.id;
            updateSkillDisplay();
            startSkillList.querySelectorAll('.start-skill-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Overlay logic removed as it's now permanent
        };

        startSkillList.appendChild(card);
    });

    // Toggle skill grid removed as it's now a side-by-side permanent layout

    // --- Tab Logic ---
    const tabButtons = stageModal.querySelectorAll('.stage-tab-btn');
    const tabContents = stageModal.querySelectorAll('.stage-tab-content');

    // --- Circuit Logic ---
    let selectedChip = null;

    const renderCircuitUI = () => {
        const capacityUsedEl = document.getElementById('circuit-capacity-used');
        const capacityMaxEl = document.getElementById('circuit-capacity-max');
        const capacityFillEl = document.getElementById('circuit-capacity-fill');
        const chipListEl = document.getElementById('chip-list');
        const chipSlotsEl = document.getElementById('chip-slots');
        const detailPanelEl = document.getElementById('chip-detail-panel');

        const circuit = game.player.circuit;
        if (!circuit || !detailPanelEl) return;

        // Update Capacity
        capacityUsedEl.textContent = circuit.usedCapacity;
        capacityMaxEl.textContent = circuit.maxCapacity;
        const percent = Math.min((circuit.usedCapacity / circuit.maxCapacity) * 100, 100);
        capacityFillEl.style.width = percent + '%';

        // Render Detail Panel
        if (selectedChip) {
            const isEquipped = game.player.circuit.slots.includes(selectedChip);
            const catClass = {
                '洞察': 'cat-insight',
                '技巧': 'cat-technique',
                '耐久': 'cat-durability',
                '俊敏': 'cat-agility'
            }[selectedChip.data.category] || '';

            const getFormattedEffect = (chip) => {
                const value = chip.getCurrentEffect();
                const type = chip.data.effectType;
                let text = '';
                const isPositive = value > 0;

                if (type.endsWith('_mult')) {
                    const percent = Math.round(value * 100);
                    text = `${isPositive ? '+' : ''}${percent}%`;
                } else {
                    text = `${isPositive ? '+' : ''}${value}`;
                }

                const colorClass = isPositive ? 'stat-plus' : 'stat-minus';
                return `<span class="${colorClass}">${text}</span>`;
            };

            detailPanelEl.innerHTML = `
                <div class="detail-header">
                    <div class="chip-category ${catClass}">${selectedChip.data.category}</div>
                    <div class="detail-cost-value">${selectedChip.getCurrentCost()}</div>
                    <div class="detail-title">${selectedChip.data.name}</div>
                </div>
                <div class="chip-rank-dots">
                    ${Array.from({ length: 5 }).map((_, i) => `<span class="dot ${i < selectedChip.level ? 'filled' : ''}"></span>`).join('')}
                </div>
                <div class="detail-description">
                    ${selectedChip.data.description}${getFormattedEffect(selectedChip)}
                </div>
               <div class="detail-footer">
                    <button class="detail-action-btn ${isEquipped ? 'unequip' : ''}">
                        ${isEquipped ? '解除' : '装着'}
                    </button>
                </div>
          `;

            detailPanelEl.querySelector('.detail-action-btn').onclick = () => {
                if (isEquipped) {
                    const idx = circuit.slots.indexOf(selectedChip);
                    circuit.unequipChip(idx);
                } else {
                    const emptyIdx = circuit.slots.indexOf(null);
                    if (emptyIdx !== -1) {
                        circuit.equipChip(selectedChip, emptyIdx);
                    }
                }
                renderCircuitUI();
            };
        } else {
            detailPanelEl.innerHTML = '<div class="detail-placeholder">チップを選択して詳細を表示</div>';
        }

        // Render Inventory (Owned Chips)
        chipListEl.innerHTML = '';
        circuit.ownedChips.forEach(chip => {
            const item = document.createElement('div');
            item.className = 'chip-item';
            if (game.player.circuit.slots.includes(chip)) item.classList.add('equipped');
            if (selectedChip === chip) item.classList.add('selected');

            const catClass = {
                '洞察': 'cat-insight',
                '技巧': 'cat-technique',
                '耐久': 'cat-durability',
                '俊敏': 'cat-agility'
            }[chip.data.category] || '';

            item.innerHTML = `
                <div class="chip-category ${catClass}">${chip.data.category}</div>
                <div class="chip-name">${chip.data.name}</div>
                <div class="chip-rank-dots">
                    ${Array.from({ length: 5 }).map((_, i) => `<span class="dot ${i < chip.level ? 'filled' : ''}"></span>`).join('')}
                </div>
            `;

            item.onclick = () => {
                selectedChip = chip;
                renderCircuitUI();
            };
            chipListEl.appendChild(item);
        });

        // Render Slots
        chipSlotsEl.innerHTML = '';
        game.player.circuit.slots.forEach((chip, idx) => {
            if (chip) {
                const item = document.createElement('div');
                item.className = 'chip-item';
                if (selectedChip === chip) item.classList.add('selected');

                const catClass = {
                    '洞察': 'cat-insight',
                    '技巧': 'cat-technique',
                    '耐久': 'cat-durability',
                    '俊敏': 'cat-agility'
                }[chip.data.category] || '';

                item.innerHTML = `
                    <div class="chip-category ${catClass}">${chip.data.category}</div>
                    <div class="chip-name">${chip.data.name}</div>
                    <div class="chip-rank-dots">
                        ${Array.from({ length: 5 }).map((_, i) => `<span class="dot ${i < chip.level ? 'filled' : ''}"></span>`).join('')}
                    </div>
                `;
                item.onclick = () => {
                    selectedChip = chip;
                    renderCircuitUI();
                };
                chipSlotsEl.appendChild(item);
            } else {
                const empty = document.createElement('div');
                empty.className = 'chip-slot-empty';
                empty.textContent = 'Empty';
                chipSlotsEl.appendChild(empty);
            }
        });
    };

    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update contents
            tabContents.forEach(content => {
                if (content.id === `tab-${tabId}`) {
                    content.style.display = 'block';
                    content.classList.add('active');
                    if (tabId === 'circuits') renderCircuitUI();
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });
        };
    });

    // Reset to default tab (Skills)
    const skillsTabBtn = Array.from(tabButtons).find(b => b.dataset.tab === 'skills');
    if (skillsTabBtn) skillsTabBtn.click();

    // Footer buttons
    btnStartAdventure.onclick = () => {
        if (!selectedSkillId) return;

        // Final hide of title screen (if it was transparently visible)
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) titleScreen.style.display = 'none';

        hideStageSettings();
        if (onStartCallback) onStartCallback({ difficulty: selectedDifficulty, skillId: selectedSkillId });
    };

    btnBackToTitle.onclick = () => {
        hideStageSettings();
        if (onBackCallback) onBackCallback();
    };

    stageModal.style.display = 'flex';
}

export function hideStageSettings() {
    if (stageModal) stageModal.style.display = 'none';
}
