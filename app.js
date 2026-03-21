/**
 * 🌟 冒險蓋章挑戰 - 闖關遊戲版
 * 10 關闖關制，每關 30 格，每 10 格解鎖新大頭貼 + 印章。
 * 支援 JSON 匯出/匯入備份。
 */
(function () {
    'use strict';

    const STAMPS_PER_LEVEL = 30;
    const MAX_LEVEL = 10;
    const STORAGE_KEY = 'rewardChart_v3';
    const MILESTONE_VALUES = [10, 20, 30];

    // ===== All stamp images (60 total, unlocked progressively) =====
    const ALL_STAMPS = [
        'stamps/01_star.svg','stamps/02_heart.svg','stamps/03_rainbow.svg','stamps/04_flower.svg',
        'stamps/05_cat.svg','stamps/06_dog.svg','stamps/07_bunny.svg','stamps/08_sun.svg',
        'stamps/09_moon.svg','stamps/10_apple.svg','stamps/11_butterfly.svg','stamps/12_fish.svg',
        'stamps/13_balloon.svg','stamps/14_cake.svg','stamps/15_rocket.svg','stamps/16_music.svg',
        'stamps/17_crown.svg','stamps/18_lollipop.svg','stamps/19_ribbon.svg','stamps/20_turtle.svg',
        'stamps/21_bee.svg','stamps/22_sparkle.svg','stamps/23_palette.svg','stamps/24_strawberry.svg',
        'stamps/25_fox.svg','stamps/26_penguin.svg','stamps/27_diamond.svg','stamps/28_cloud.svg',
        'stamps/29_lightning.svg','stamps/30_paw.svg',
        'stamps/31_hedgehog.svg','stamps/32_whale.svg','stamps/33_elephant.svg','stamps/34_ladybug.svg',
        'stamps/35_snail.svg','stamps/36_octopus.svg','stamps/37_crab.svg','stamps/38_frog.svg',
        'stamps/39_pig.svg','stamps/40_chick.svg','stamps/41_owl.svg','stamps/42_giraffe.svg',
        'stamps/43_koala.svg','stamps/44_unicorn.svg','stamps/45_hamster.svg',
        'stamps/46_dino.svg','stamps/47_ninja.svg','stamps/48_ufo.svg','stamps/49_shield.svg',
        'stamps/50_flame.svg','stamps/51_gem.svg','stamps/52_trophy.svg','stamps/53_sword.svg',
        'stamps/54_mushroom.svg','stamps/55_thunder.svg','stamps/56_planet.svg','stamps/57_cherry.svg',
        'stamps/58_potion.svg','stamps/59_scroll.svg','stamps/60_dragon.svg'
    ];

    // ===== All avatar images (36 total, unlocked progressively) =====
    const ALL_AVATARS = [
        'images/coco_bear.png','images/barkley_dk.png',
        'images/bear_forest_reward_1773823932111.png','images/gorilla_gaming_reward_1773823949440.png',
        'images/rabbit_icecream_reward_1773823966250.png','images/cat_piano_1773824059476.png',
        'images/dog_balloon_1773824077053.png','images/panda_book_1773824096391.png',
        'images/turtle_spaceship_1773824432588.png','images/fox_campfire_1773824448395.png',
        'images/koala_sleeping_1773824465460.png','images/penguin_ic_1773824638469.png',
        'images/lion_k_1773824654576.png','images/owl_r_1773824673758.png',
        'images/dolphin_t_1773824690102.png',
        'images/gorilla_knight.png','images/bear_dancer.png','images/dragon_cool.png',
        'images/gorilla_pirate.png','images/bear_princess.png','images/ninja_cat.png',
        'images/gorilla_samurai.png','images/bear_fairy.png','images/space_bunny.png',
        'images/gorilla_space.png','images/bear_mermaid.png','images/robot_friend.png',
        'images/gorilla_dragon.png','images/bear_unicorn.png','images/wizard_fox.png',
        'images/gorilla_mecha.png','images/bear_queen.png','images/pirate_penguin.png',
        'images/gorilla_king.png','images/bear_rainbow.png','images/bear_goddess.png'
    ];

    // Unlock tiers: index = tier number (0-based), value = { avatars: [...indices], stamps: [...indices] }
    // Tier 0 = base (start), tier 1 = after 10 stamps total, tier 2 = after 20, etc.
    const UNLOCK_TIERS = [
        { avatars: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], stamps: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29] },
        { avatars: [15,16], stamps: [30,31] },
        { avatars: [17], stamps: [32,33] },
        { avatars: [18,19], stamps: [34] },
        { avatars: [20], stamps: [35,36] },
        { avatars: [21,22], stamps: [37] },
        { avatars: [23], stamps: [38,39] },
        { avatars: [24,25], stamps: [40] },
        { avatars: [26], stamps: [41,42] },
        { avatars: [27,28], stamps: [43] },
        { avatars: [29], stamps: [44,45] },
        { avatars: [30,31], stamps: [46] },
        { avatars: [32], stamps: [47,48] },
        { avatars: [33], stamps: [49] },
        { avatars: [34], stamps: [50,51] },
        { avatars: [35], stamps: [52,53,54,55,56,57,58,59] }
    ];

    const PRAISE_PHRASES = [
        '做得很棒喔！','你好棒！','太厲害了！繼續加油！','哇，真的很棒耶！',
        '好優秀喔！','你是最棒的！','再接再厲！你可以的！','表現得非常好！'
    ];
    const ADVENTURE_TAGLINES = [
        '的冒險旅程','的奇幻挑戰','的星球探險','的寶藏獵人','的英雄任務','的魔法世界',
        '的勇氣之路','的夢國探索','的奇蹟之旅','的太空任務','的叢林冒險','的海底尋寶'
    ];
    const LEVEL_THEMES = [
        {name:'🌿 森林冒險',bg:'linear-gradient(135deg,#e8f5e9,#c8e6c9)'},
        {name:'🌊 海洋探險',bg:'linear-gradient(135deg,#e3f2fd,#bbdefb)'},
        {name:'🏔️ 高山挑戰',bg:'linear-gradient(135deg,#efebe9,#d7ccc8)'},
        {name:'🌋 火山任務',bg:'linear-gradient(135deg,#fbe9e7,#ffccbc)'},
        {name:'❄️ 冰雪世界',bg:'linear-gradient(135deg,#e1f5fe,#b3e5fc)'},
        {name:'🏜️ 沙漠尋寶',bg:'linear-gradient(135deg,#fff8e1,#ffecb3)'},
        {name:'🌙 月球基地',bg:'linear-gradient(135deg,#ede7f6,#d1c4e9)'},
        {name:'🌸 櫻花秘境',bg:'linear-gradient(135deg,#fce4ec,#f8bbd0)'},
        {name:'⚡ 雷霆要塞',bg:'linear-gradient(135deg,#e0f7fa,#b2ebf2)'},
        {name:'👑 傳說殿堂',bg:'linear-gradient(135deg,#fff9c4,#ffe082)'}
    ];
    let taglineIndex = 0;

    // ===== App State =====
    let state = { children: [] };
    let isReadOnlyMode = false;
    let pendingStampOperation = null;
    let currentView = 'stamp';

    // ===== Helpers =====
    function getTotalStamps(child) {
        let total = 0;
        if (child.levels) {
            for (const lvl in child.levels) {
                total += child.levels[lvl].stamps.filter(s => s !== null).length;
            }
        }
        return total;
    }
    function getCurrentLevelStamps(child) {
        const lvl = child.levels?.[child.currentLevel];
        if (!lvl) return 0;
        return lvl.stamps.filter(s => s !== null).length;
    }
    function getUnlockTier(child) {
        return Math.min(Math.floor(getTotalStamps(child) / 10), UNLOCK_TIERS.length - 1);
    }
    function getUnlockedAvatars(child) {
        const tier = getUnlockTier(child);
        const set = new Set();
        for (let i = 0; i <= tier; i++) UNLOCK_TIERS[i].avatars.forEach(a => set.add(a));
        return [...set];
    }
    function getUnlockedStamps(child) {
        const tier = getUnlockTier(child);
        const set = new Set();
        for (let i = 0; i <= tier; i++) UNLOCK_TIERS[i].stamps.forEach(s => set.add(s));
        return [...set];
    }
    function hasNewAvatars(child) {
        const unlocked = getUnlockedAvatars(child);
        return unlocked.length > (child.seenAvatarCount || 15);
    }
    function hasNewStamps(child) {
        const unlocked = getUnlockedStamps(child);
        return unlocked.length > (child.seenStampCount || 30);
    }

    // ===== Initialization =====
    function init() {
        checkUrlForShareMode();
        if (isReadOnlyMode) { setupReadOnlyUI(); } else { loadLocalState(); setupParentUI(); }
        renderAllCharts();
        bindEvents();
        fetchGithubStars();
    }

    function checkUrlForShareMode() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#data=')) {
            try {
                const json = LZString.decompressFromEncodedURIComponent(hash.substring(6));
                if (json) { state = { children: JSON.parse(json).children || [] }; isReadOnlyMode = true; }
            } catch (e) { console.error('分享連結解碼失敗', e); }
        }
    }
    function setupReadOnlyUI() {
        document.getElementById('top-controls').style.display = 'none';
        document.getElementById('github-star-btn').style.display = 'none';
        const mh = document.getElementById('mobile-header'); if (mh) mh.style.display = 'none';
        document.getElementById('readonly-banner').style.display = 'flex';
        document.body.style.paddingTop = '48px';
        const btn = document.getElementById('readonly-start-own');
        if (btn) { try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const p = JSON.parse(s); if (p.children?.length) btn.textContent = '🏠 回到我的蓋章'; } } catch(e){} }
    }
    function setupParentUI() { if (!state.children.length) showWelcomeScreen(true); }
    function showWelcomeScreen(show) {
        document.getElementById('welcome-screen').style.display = show ? 'block' : 'none';
        document.getElementById('main-content').style.display = show ? 'none' : '';
    }

    // ===== Data Model =====
    function createChild(name, avatar, color) {
        const subtitle = name + ADVENTURE_TAGLINES[taglineIndex++ % ADVENTURE_TAGLINES.length];
        return {
            id: 'child_' + Date.now() + Math.random().toString().slice(2,6),
            name, subtitle, avatar, color,
            currentLevel: 1,
            seenAvatarCount: 15,
            seenStampCount: 30,
            levels: { 1: { stamps: new Array(STAMPS_PER_LEVEL).fill(null), milestones: ['故事時間','小點心','超級大獎！'] } }
        };
    }
    function migrateChild(child) {
        if (child.stamps && !child.levels) {
            child.currentLevel = 1;
            child.seenAvatarCount = child.seenAvatarCount || 15;
            child.seenStampCount = child.seenStampCount || 30;
            child.levels = { 1: { stamps: child.stamps, milestones: child.milestones || ['故事時間','小點心','超級大獎！'] } };
            delete child.stamps; delete child.milestones;
        }
        if (!child.currentLevel) child.currentLevel = 1;
        if (!child.levels) child.levels = { 1: { stamps: new Array(STAMPS_PER_LEVEL).fill(null), milestones: ['故事時間','小點心','超級大獎！'] } };
        if (!child.seenAvatarCount) child.seenAvatarCount = 15;
        if (!child.seenStampCount) child.seenStampCount = 30;
        return child;
    }
    function loadLocalState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) { state = { ...state, ...JSON.parse(saved) }; if (!state.children) state.children = []; state.children = state.children.map(migrateChild); }
        } catch (e) { console.warn('載入失敗', e); }
    }
    function saveLocalState() { if (!isReadOnlyMode) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    // ===== Export / Import JSON =====
    function exportJSON() {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'reward_chart_backup_' + new Date().toISOString().slice(0,10) + '.json';
        a.click(); URL.revokeObjectURL(a.href);
    }
    function importJSON() {
        const input = document.getElementById('import-file-input');
        input.value = '';
        input.click();
    }
    function handleImportFile(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.children || !Array.isArray(data.children)) { alert('⚠️ 檔案格式不正確！'); return; }
                if (!confirm('⚠️ 匯入將會覆蓋目前所有資料，確定嗎？')) return;
                state = data;
                state.children = state.children.map(migrateChild);
                saveLocalState(); renderAllCharts(); showWelcomeScreen(false);
                alert('✅ 匯入成功！');
            } catch (err) { alert('⚠️ 檔案讀取失敗：' + err.message); }
        };
        reader.readAsText(file);
    }

    // ===== Render Engine =====
    function renderAllCharts() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        if (!state.children.length) {
            container.innerHTML = '<p style="text-align:center;width:100%;color:#666;">目前沒有設定小朋友，請點擊「家長設定」。</p>';
            return;
        }
        const tpl = document.getElementById('child-panel-template').content;
        state.children.forEach(child => {
            child = migrateChild(child);
            const clone = tpl.cloneNode(true);
            const section = clone.querySelector('.chart-panel');
            section.dataset.childId = child.id;

            // Level info
            const levelInfo = section.querySelector('.level-info');
            const theme = LEVEL_THEMES[(child.currentLevel - 1) % LEVEL_THEMES.length];
            levelInfo.querySelector('.level-number').textContent = `🏰 第 ${child.currentLevel} 關`;
            levelInfo.querySelector('.level-theme').textContent = theme.name;
            if (child.currentLevel > MAX_LEVEL) {
                levelInfo.querySelector('.level-number').textContent = '🏆 全部破關！';
                levelInfo.querySelector('.level-theme').textContent = '🎉 恭喜完成所有關卡！';
            }

            section.querySelector('.child-name-display').textContent = child.name;
            const tagline = (child.subtitle || child.name + '的冒險旅程').replace(child.name, '');
            section.querySelector('.child-subtitle').textContent = tagline;
            section.querySelector('.child-avatar-display').src = child.avatar;

            // Avatar badge (red exclamation)
            const badge = section.querySelector('.avatar-new-badge');
            if (hasNewAvatars(child)) { badge.style.display = 'flex'; } else { badge.style.display = 'none'; }

            const inner = section.querySelector('.panel-inner');
            inner.style.borderColor = child.color;
            inner.style.background = theme.bg;

            // Stamp board for current level
            const board = section.querySelector('.stamp-board');
            const levelData = child.levels[child.currentLevel];
            let stampedCount = 0;
            const isCompleted = child.currentLevel > MAX_LEVEL;

            if (levelData && !isCompleted) {
                levelData.stamps.forEach((stamp, i) => {
                    const cell = document.createElement('div');
                    cell.className = 'stamp-cell';
                    cell.dataset.childId = child.id;
                    cell.dataset.index = i;
                    if (stamp) {
                        cell.classList.add('stamped');
                        const img = document.createElement('img');
                        img.src = ALL_STAMPS[stamp.stampIcon || 0];
                        img.className = 'stamp-img';
                        cell.appendChild(img);
                        cell.style.background = child.color;
                        cell.style.borderColor = child.color;
                        cell.style.boxShadow = `0 3px 10px ${child.color}88`;
                        stampedCount++;
                    } else {
                        cell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
                        cell.style.background = child.color + '22';
                        cell.style.borderColor = child.color + '88';
                        cell.style.color = child.color;
                    }
                    if (MILESTONE_VALUES.includes(i + 1)) {
                        cell.classList.add('milestone-cell');
                        if (!stamp) cell.style.borderStyle = 'dashed';
                    }
                    board.appendChild(cell);
                });
            } else if (isCompleted) {
                board.innerHTML = '<div class="all-complete-message">🏆 全部破關！恭喜你！🎉</div>';
                stampedCount = STAMPS_PER_LEVEL;
            }

            // Level navigation
            const prevBtn = section.querySelector('.level-prev');
            const nextBtn = section.querySelector('.level-next');
            const levelDisplay = section.querySelector('.level-nav-display');
            levelDisplay.textContent = `第 ${child.currentLevel} 關`;
            prevBtn.dataset.childId = child.id;
            nextBtn.dataset.childId = child.id;

            // Disable buttons when not navigable
            const canGoPrev = child.currentLevel > 1;
            const canGoNext = child.levels[child.currentLevel + 1] || stampedCount >= STAMPS_PER_LEVEL;
            prevBtn.disabled = !canGoPrev;
            nextBtn.disabled = !canGoNext;

            // Progress
            const pct = (stampedCount / STAMPS_PER_LEVEL) * 100;
            section.querySelector('.child-progress').style.width = pct + '%';
            section.querySelector('.child-count').textContent = `${stampedCount} / ${STAMPS_PER_LEVEL}`;

            // Total stamps display
            const totalEl = section.querySelector('.total-stamps-display');
            if (totalEl) totalEl.textContent = `累計總印章：${getTotalStamps(child)}`;

            // Milestones
            const milestones = levelData?.milestones || ['里程碑1','里程碑2','終極大獎'];
            const ms = section.querySelector('.child-milestones');
            ms.querySelector('.m10-label').textContent = milestones[0];
            ms.querySelector('.m20-label').textContent = milestones[1];
            ms.querySelector('.m30-label').textContent = milestones[2];
            MILESTONE_VALUES.forEach(val => { if (stampedCount >= val) ms.querySelector(`.m${val}`).classList.add('achieved'); });

            container.appendChild(clone);
        });
    }

    // ===== List View =====
    function renderListView() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        if (!state.children.length) { container.innerHTML = '<p style="text-align:center;width:100%;color:#666;">目前沒有資料。</p>'; return; }
        state.children.forEach(child => {
            child = migrateChild(child);
            const panel = document.createElement('div');
            panel.className = 'list-view-panel';
            panel.style.borderLeft = `4px solid ${child.color}`;
            let allStamps = [];
            for (const lvl in child.levels) {
                child.levels[lvl].stamps.forEach((s, i) => {
                    if (s) allStamps.push({ level: lvl, index: i, ...s });
                });
            }
            let tableHtml = '';
            if (!allStamps.length) {
                tableHtml = '<p style="color:#999;font-style:italic;padding:8px 0;">尚未獲得任何印章 🎯</p>';
            } else {
                tableHtml = '<table class="list-view-table"><thead><tr><th>關卡</th><th>#</th><th>日期時間</th><th>蓋章原因</th></tr></thead><tbody>';
                allStamps.forEach(s => {
                    tableHtml += `<tr><td>第${s.level}關</td><td class="list-stamp-num">⭐ ${s.index+1}</td><td class="list-stamp-time">${s.time||'—'}</td><td>${s.reason||'—'}</td></tr>`;
                });
                tableHtml += '</tbody></table>';
            }
            const tagline = (child.subtitle || child.name+'的冒險旅程').replace(child.name,'');
            panel.innerHTML = `<div class="list-view-header"><img src="${child.avatar}" class="list-view-avatar"><div><span class="list-view-name">${child.name}</span><span class="list-view-tagline">${tagline}</span><div class="list-view-progress">🏰 第 ${child.currentLevel} 關 — 累計 ${getTotalStamps(child)} 個印章</div></div></div>${tableHtml}`;
            container.appendChild(panel);
        });
    }

    function toggleView() {
        currentView = currentView === 'stamp' ? 'list' : 'stamp';
        const isNowList = currentView === 'list';
        // Desktop button
        const btn = document.getElementById('toggle-view-btn');
        if (btn) btn.textContent = isNowList ? '🏆 蓋章' : '📋 清單';
        // Readonly button
        const rb = document.getElementById('readonly-toggle-view');
        if (rb) rb.textContent = isNowList ? '🏆 蓋章模式' : '📋 清單模式';
        // Mobile button
        const mb = document.getElementById('m-toggle-btn');
        if (mb) mb.textContent = isNowList ? '🏆 蓋章模式' : '📋 清單模式';
        isNowList ? renderListView() : renderAllCharts();
    }

    // ===== Event Bindings =====
    function bindEvents() {
        document.getElementById('main-content').addEventListener('click', e => {
            const cell = e.target.closest('.stamp-cell');
            if (cell) { handleStampClick(cell); return; }
            // Level navigation
            const prev = e.target.closest('.level-prev');
            const next = e.target.closest('.level-next');
            if (prev || next) {
                const childId = (prev || next).dataset.childId;
                const child = state.children.find(c => c.id === childId);
                if (!child) return;
                if (prev && child.currentLevel > 1) { child.currentLevel--; saveLocalState(); renderAllCharts(); }
                if (next) {
                    const maxReached = Object.keys(child.levels).length;
                    if (child.currentLevel < maxReached || child.currentLevel <= MAX_LEVEL) {
                        if (child.levels[child.currentLevel + 1] || getCurrentLevelStamps(child) >= STAMPS_PER_LEVEL) {
                            child.currentLevel++;
                            if (!child.levels[child.currentLevel]) child.levels[child.currentLevel] = { stamps: new Array(STAMPS_PER_LEVEL).fill(null), milestones: ['故事時間','小點心','超級大獎！'] };
                            saveLocalState(); renderAllCharts();
                        }
                    }
                }
                return;
            }
            // Avatar badge click
            const badgeClick = e.target.closest('.avatar-new-badge');
            if (badgeClick) {
                const panel = badgeClick.closest('.chart-panel');
                const childId = panel?.dataset?.childId;
                if (childId) openSetupModal();
                return;
            }
        });

        // Modals
        document.getElementById('stamp-cancel').addEventListener('click', () => closeModal('stamp-modal'));
        document.getElementById('stamp-confirm').addEventListener('click', handleStampConfirm);
        document.getElementById('detail-close').addEventListener('click', () => closeModal('stamp-detail-view'));
        document.getElementById('detail-kid-close').addEventListener('click', () => closeModal('stamp-detail-view'));
        document.getElementById('detail-remove').addEventListener('click', handleRemoveStamp);
        document.getElementById('detail-replay-sound').addEventListener('click', replayPraise);
        document.getElementById('celebration-close').addEventListener('click', () => closeModal('celebration-overlay'));

        // Import file handler
        document.getElementById('import-file-input').addEventListener('change', handleImportFile);

        if (!isReadOnlyMode) {
            document.getElementById('setup-btn').addEventListener('click', openSetupModal);
            document.getElementById('setup-cancel').addEventListener('click', () => closeModal('setup-modal'));
            document.getElementById('setup-save').addEventListener('click', saveSetup);
            document.getElementById('setup-add-child').addEventListener('click', addSetupChildField);
            document.getElementById('share-btn').addEventListener('click', openShareModal);
            document.getElementById('export-pdf-btn')?.addEventListener('click', exportToPDF);
            document.getElementById('export-json-btn')?.addEventListener('click', exportJSON);
            document.getElementById('import-json-btn')?.addEventListener('click', importJSON);
            document.getElementById('reset-btn').addEventListener('click', () => {
                if (confirm('⚠️ 確定要重新開始嗎？\n\n所有小朋友的資料、印章紀錄都會被清除！\n\n💡 建議先匯出 JSON 備份！')) {
                    localStorage.removeItem(STORAGE_KEY); state = { children: [] }; renderAllCharts(); showWelcomeScreen(true);
                }
            });
            document.getElementById('toggle-view-btn').addEventListener('click', toggleView);
            document.getElementById('welcome-start-btn').addEventListener('click', () => { showWelcomeScreen(false); openSetupModal(); });
        }

        // Read-only buttons
        document.getElementById('readonly-start-own')?.addEventListener('click', () => { window.location.href = window.location.origin + window.location.pathname; });
        document.getElementById('readonly-export-pdf')?.addEventListener('click', exportToPDF);
        document.getElementById('readonly-toggle-view')?.addEventListener('click', toggleView);
        document.getElementById('readonly-share')?.addEventListener('click', openShareModal);
        document.getElementById('readonly-sync')?.addEventListener('click', syncSharedData);
        document.getElementById('share-close').addEventListener('click', () => closeModal('share-modal'));
        document.getElementById('share-copy-btn')?.addEventListener('click', () => {
            const input = document.getElementById('share-link-input');
            input.select();
            navigator.clipboard.writeText(input.value).then(() => {
                const btn = document.getElementById('share-copy-btn');
                btn.textContent = '✅ 已複製！'; setTimeout(() => btn.textContent = '📋 複製連結', 2000);
            });
        });
        document.getElementById('github-star-btn').addEventListener('click', triggerGithubStar);
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            ['stamp-modal','stamp-detail-view','setup-modal','share-modal','celebration-overlay'].forEach(id => document.getElementById(id)?.classList.remove('active'));
        });

        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');
        function openH() { hamburgerBtn?.classList.add('open'); mobileMenu?.classList.add('open'); backdrop?.classList.add('open'); }
        function closeH() { hamburgerBtn?.classList.remove('open'); mobileMenu?.classList.remove('open'); backdrop?.classList.remove('open'); }
        hamburgerBtn?.addEventListener('click', () => mobileMenu?.classList.contains('open') ? closeH() : openH());
        backdrop?.addEventListener('click', closeH);

        document.getElementById('m-setup-btn')?.addEventListener('click', () => { closeH(); openSetupModal(); });
        document.getElementById('m-toggle-btn')?.addEventListener('click', () => { closeH(); toggleView(); });
        document.getElementById('m-share-btn')?.addEventListener('click', () => { closeH(); openShareModal(); });
        document.getElementById('m-pdf-btn')?.addEventListener('click', () => { closeH(); exportToPDF(); });
        document.getElementById('m-export-json-btn')?.addEventListener('click', () => { closeH(); exportJSON(); });
        document.getElementById('m-import-json-btn')?.addEventListener('click', () => { closeH(); importJSON(); });
        document.getElementById('m-reset-btn')?.addEventListener('click', () => {
            closeH();
            if (confirm('⚠️ 確定要重新開始嗎？\n\n所有資料都會被清除！\n\n💡 建議先匯出 JSON 備份！')) {
                localStorage.removeItem(STORAGE_KEY); state = { children: [] }; renderAllCharts(); showWelcomeScreen(true);
            }
        });
    }

    // ===== Stamp Logic =====
    function handleStampClick(cell) {
        const childId = cell.dataset.childId;
        const index = parseInt(cell.dataset.index, 10);
        const child = state.children.find(c => c.id === childId);
        const levelData = child.levels[child.currentLevel];
        if (!levelData) return;
        if (levelData.stamps[index] !== null) {
            openDetailView(child, index);
        } else {
            if (isReadOnlyMode) { alert('唯讀模式中，只有家長可以蓋印章喔！'); return; }
            openStampModal(childId, index);
        }
    }

    let selectedStampIcon = 0;
    function openStampModal(childId, index) {
        const child = state.children.find(c => c.id === childId);
        document.getElementById('stamp-modal-title').textContent = `${child.name} — 第${child.currentLevel}關 第${index+1}格`;
        const d = new Date();
        document.getElementById('stamp-time').value = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        document.getElementById('stamp-reason').value = '';

        const grid = document.getElementById('stamp-picker-grid');
        grid.innerHTML = '';
        const unlocked = getUnlockedStamps(child);
        selectedStampIcon = unlocked[Math.floor(Math.random() * unlocked.length)];
        unlocked.forEach(idx => {
            const btn = document.createElement('button');
            btn.className = 'stamp-pick-item' + (idx === selectedStampIcon ? ' selected' : '');
            btn.type = 'button';
            btn.innerHTML = `<img src="${ALL_STAMPS[idx]}" alt="stamp ${idx+1}">`;
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.stamp-pick-item').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedStampIcon = idx;
            });
            grid.appendChild(btn);
        });

        // Mark stamps as seen
        child.seenStampCount = Math.max(child.seenStampCount || 0, unlocked.length);
        saveLocalState();

        pendingStampOperation = { childId, index };
        document.getElementById('stamp-modal').classList.add('active');
        const selBtn = grid.querySelector('.selected');
        if (selBtn) selBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function handleStampConfirm() {
        const reason = document.getElementById('stamp-reason').value.trim();
        if (!reason) { alert('⚠️ 請務必填寫蓋章原因喔！'); document.getElementById('stamp-reason').focus(); return; }
        const { childId, index } = pendingStampOperation;
        const child = state.children.find(c => c.id === childId);
        const levelData = child.levels[child.currentLevel];
        levelData.stamps[index] = { time: document.getElementById('stamp-time').value, reason, stampIcon: selectedStampIcon };
        saveLocalState();
        renderAllCharts();
        closeModal('stamp-modal');

        const lvlCount = getCurrentLevelStamps(child);
        const totalCount = getTotalStamps(child);
        speakPraise(child.name, reason, totalCount);

        // Check milestones
        if (MILESTONE_VALUES.includes(lvlCount) && lvlCount < STAMPS_PER_LEVEL) {
            setTimeout(() => showCelebration(`太棒了！${child.name} 在第 ${child.currentLevel} 關達成了 ${lvlCount} 個印章里程碑！`), 500);
        }

        // Check level complete
        if (lvlCount >= STAMPS_PER_LEVEL) {
            setTimeout(() => {
                if (child.currentLevel >= MAX_LEVEL) {
                    showCelebration(`🏆🎉 ${child.name} 完成了全部 ${MAX_LEVEL} 關！！！太厲害了！你是真正的冒險王！🎉🏆`);
                } else {
                    const nextLevel = child.currentLevel + 1;
                    child.currentLevel = nextLevel;
                    if (!child.levels[nextLevel]) child.levels[nextLevel] = { stamps: new Array(STAMPS_PER_LEVEL).fill(null), milestones: ['故事時間','小點心','超級大獎！'] };
                    saveLocalState();
                    showCelebration(`🎊 闖關成功！${child.name} 進入第 ${nextLevel} 關「${LEVEL_THEMES[(nextLevel-1)%LEVEL_THEMES.length].name}」！繼續加油！🎊`);
                    setTimeout(() => renderAllCharts(), 300);
                }
            }, 800);
        }

        // Check unlock notifications
        if (hasNewAvatars(child) || hasNewStamps(child)) {
            setTimeout(() => renderAllCharts(), 200);
        }
    }

    function openDetailView(child, index) {
        const stamp = child.levels[child.currentLevel].stamps[index];
        document.getElementById('detail-title').textContent = `${child.name} — 第${child.currentLevel}關 第${index+1}格`;
        document.getElementById('detail-time').textContent = stamp.time || '未記錄';
        document.getElementById('detail-reason').textContent = stamp.reason || '未記錄原因';
        if (isReadOnlyMode) {
            document.getElementById('detail-parent-buttons').style.display = 'none';
            document.getElementById('detail-kid-buttons').style.display = 'flex';
        } else {
            document.getElementById('detail-parent-buttons').style.display = 'flex';
            document.getElementById('detail-kid-buttons').style.display = 'none';
        }
        pendingStampOperation = { childId: child.id, index };
        document.getElementById('stamp-detail-view').classList.add('active');
    }

    function handleRemoveStamp() {
        if (!confirm('確定要取消這個印章嗎？')) return;
        const { childId, index } = pendingStampOperation;
        const child = state.children.find(c => c.id === childId);
        child.levels[child.currentLevel].stamps[index] = null;
        saveLocalState(); renderAllCharts(); closeModal('stamp-detail-view');
    }

    // ===== Setup Modal =====
    function openSetupModal() {
        const list = document.getElementById('setup-children-list');
        list.innerHTML = '';
        state.children.forEach(child => list.appendChild(createSetupChildElement(child)));
        document.getElementById('setup-modal').classList.add('active');
    }

    function createSetupChildElement(child) {
        if (!child) child = { id: 'new_'+Date.now(), name: '', color: '#ffeb3b', avatar: ALL_AVATARS[2], currentLevel: 1, seenAvatarCount: 15, seenStampCount: 30, levels: {} };
        const div = document.createElement('div');
        div.className = 'setup-child-item';
        div.style.cssText = 'border:1px solid #ddd;padding:10px;margin-bottom:10px;border-radius:8px;';
        div.dataset.id = child.id;

        const levelData = child.levels?.[child.currentLevel];
        const m1 = levelData?.milestones?.[0] || '故事時間';
        const m2 = levelData?.milestones?.[1] || '小點心';
        const m3 = levelData?.milestones?.[2] || '超級大獎！';

        const unlockedAvatarIds = getUnlockedAvatars(child);
        let avatarOptions = unlockedAvatarIds.map(idx => {
            const src = ALL_AVATARS[idx];
            const isNew = idx >= 15 && (child.seenAvatarCount || 15) <= idx;
            return `<div class="avatar-opt-wrap"><img src="${src}" class="avatar-carousel-item setup-avatar-opt ${src === child.avatar ? 'selected' : ''}" data-src="${src}">${isNew ? '<span class="avatar-new-tag">NEW!</span>' : ''}</div>`;
        }).join('');

        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <input type="text" class="setup-child-name" value="${child.name}" placeholder="小朋友名字" style="padding:6px;flex:1;margin-right:8px;">
                <input type="color" class="setup-child-color" value="${child.color}" style="width:40px;height:30px;">
                <button class="setup-child-del" style="background:#f44336;color:white;border:none;border-radius:4px;margin-left:8px;padding:0 8px;">刪除</button>
            </div>
            <div style="margin-bottom:8px;">
                <label style="font-size:0.8rem;">自訂三個里程碑獎勵：</label>
                <div style="display:flex;gap:4px;margin-top:4px;">
                    <input type="text" class="setup-m1" value="${m1}" placeholder="10格獎勵" style="width:33%;font-size:0.8rem;padding:4px;">
                    <input type="text" class="setup-m2" value="${m2}" placeholder="20格獎勵" style="width:33%;font-size:0.8rem;padding:4px;">
                    <input type="text" class="setup-m3" value="${m3}" placeholder="30格獎勵" style="width:33%;font-size:0.8rem;padding:4px;">
                </div>
            </div>
            <div>
                <label style="font-size:0.8rem;">選擇大頭貼（左右滑動瀏覽）：</label>
                <div class="avatar-carousel">${avatarOptions}</div>
            </div>`;

        div.querySelectorAll('.setup-avatar-opt').forEach(opt => {
            opt.addEventListener('click', e => {
                div.querySelectorAll('.setup-avatar-opt').forEach(o => o.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });
        div.querySelector('.setup-child-del').addEventListener('click', () => div.remove());

        // Mark avatars as seen when opening setup
        child.seenAvatarCount = Math.max(child.seenAvatarCount || 0, unlockedAvatarIds.length);
        saveLocalState();

        return div;
    }

    function addSetupChildField() {
        const items = document.querySelectorAll('.setup-child-item');
        if (items.length >= 5) { alert('太多啦！真的塞不下了🤣'); return; }
        if (items.length === 3) alert('沒辦法！現在生四個的小朋友真的不多了😅');
        if (items.length === 4) alert('哇塞！生五個！你真的很神！🙇‍♂️');
        document.getElementById('setup-children-list').appendChild(createSetupChildElement());
    }

    function saveSetup() {
        const newChildren = [];
        document.querySelectorAll('.setup-child-item').forEach(el => {
            const name = el.querySelector('.setup-child-name').value || 'Unknown';
            const color = el.querySelector('.setup-child-color').value;
            const m1 = el.querySelector('.setup-m1').value || '里程碑1';
            const m2 = el.querySelector('.setup-m2').value || '里程碑2';
            const m3 = el.querySelector('.setup-m3').value || '終極大獎';
            const selAvatar = el.querySelector('.setup-avatar-opt.selected') || el.querySelector('.setup-avatar-opt');
            const avatar = selAvatar ? selAvatar.dataset.src : ALL_AVATARS[0];
            const id = el.dataset.id;
            const existing = state.children.find(c => c.id === id);
            const subtitle = existing?.subtitle || (name + ADVENTURE_TAGLINES[newChildren.length % ADVENTURE_TAGLINES.length]);
            const currentLevel = existing?.currentLevel || 1;
            const levels = existing?.levels || { 1: { stamps: new Array(STAMPS_PER_LEVEL).fill(null), milestones: [m1,m2,m3] } };
            if (levels[currentLevel]) levels[currentLevel].milestones = [m1,m2,m3];
            newChildren.push({
                id, name, subtitle, color, avatar, currentLevel,
                seenAvatarCount: existing?.seenAvatarCount || 15,
                seenStampCount: existing?.seenStampCount || 30,
                levels
            });
        });
        if (!newChildren.length) { alert('請至少新增一位小朋友！'); return; }
        state.children = newChildren;
        saveLocalState(); renderAllCharts(); showWelcomeScreen(false); closeModal('setup-modal');
    }

    // ===== Share =====
    function openShareModal() {
        const json = JSON.stringify({ children: state.children });
        const compressed = LZString.compressToEncodedURIComponent(json);
        const link = window.location.origin + window.location.pathname + '#data=' + compressed;
        document.getElementById('share-link-input').value = link;
        document.getElementById('qrcode-wrapper').innerHTML = '';
        QRCode.toCanvas(document.createElement('canvas'), link, { width: 200, margin: 2 }, (err, canvas) => { if (!err) document.getElementById('qrcode-wrapper').appendChild(canvas); });
        document.getElementById('share-modal').classList.add('active');
    }
    function syncSharedData() {
        let msg = '💾 確定要同步這份資料嗎？\n\n📥 分享資料：\n';
        state.children.forEach(c => { msg += `  ・${c.name}：累計 ${getTotalStamps(c)} 個印章\n`; });
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) { const p = JSON.parse(saved); if (p.children?.length) { msg += '\n⚠️ 此裝置目前已有資料（將被覆蓋）\n'; } }
        } catch(e){}
        if (!confirm(msg)) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ children: state.children }));
        window.location.href = window.location.origin + window.location.pathname;
    }

    // ===== TTS =====
    function speakPraise(name, reason, num) {
        if (!('speechSynthesis' in window)) return;
        const praise = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
        let text = `${name}，第${num}個印章！${praise}`;
        if (reason) text += `因為${reason}，得到了這個印章！`;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-TW';
        window.speechSynthesis.speak(u);
    }
    function replayPraise() {
        const { childId, index } = pendingStampOperation;
        const child = state.children.find(c => c.id === childId);
        speakPraise(child.name, child.levels[child.currentLevel].stamps[index].reason, getTotalStamps(child));
    }

    // ===== GitHub Star =====
    function triggerGithubStar() {
        const container = document.getElementById('star-burst-container');
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div'); star.textContent = '⭐';
            star.style.cssText = 'position:fixed;left:50%;top:50%;pointer-events:none;z-index:9999;font-size:' + (Math.random()*20+10) + 'px;';
            container.appendChild(star);
            const a = Math.random()*Math.PI*2, v = Math.random()*100+50;
            star.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*v}px,${Math.sin(a)*v}px) scale(0)`,opacity:0}],{duration:1000,easing:'ease-out'}).onfinish = () => star.remove();
        }
        setTimeout(() => window.open('https://github.com/CocoChang928/Reward_Chart','_blank'), 600);
    }
    async function fetchGithubStars() {
        try { const r = await fetch('https://api.github.com/repos/CocoChang928/Reward_Chart'); if (r.ok) { const d = await r.json(); const el = document.querySelector('.github-star-btn .star-text'); if (el) el.textContent = `GitHub ⭐ ${d.stargazers_count??0}`; } } catch(e){}
    }

    // ===== PDF Export =====
    function exportToPDF() {
        const rpt = document.createElement('div');
        rpt.id = 'pdf-report';
        rpt.style.cssText = 'padding:20px;font-family:sans-serif;color:#333;background:white;';
        rpt.innerHTML = `<h1 style="text-align:center;color:#5d4037;margin-bottom:4px;">🌟 冒險蓋章挑戰 🌟</h1><p style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:24px;">匯出日期：${new Date().toLocaleDateString('zh-TW')}</p>`;
        state.children.forEach(child => {
            child = migrateChild(child);
            let allStamps = [];
            for (const lvl in child.levels) {
                child.levels[lvl].stamps.forEach((s, i) => { if (s) allStamps.push({ level: lvl, index: i, ...s }); });
            }
            let listHtml = '';
            if (!allStamps.length) { listHtml = '<p style="color:#999;font-style:italic;">尚未獲得任何印章</p>'; }
            else {
                listHtml = '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;"><tr style="background:#fff3e0;"><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ffe0b2;">關卡</th><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ffe0b2;">#</th><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ffe0b2;">日期時間</th><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #ffe0b2;">蓋章原因</th></tr>';
                allStamps.forEach(s => { listHtml += `<tr style="border-bottom:1px solid #f5f5f5;"><td style="padding:5px 10px;color:#666;">第${s.level}關</td><td style="padding:5px 10px;color:#ff8f00;font-weight:bold;">⭐ 第${s.index+1}格</td><td style="padding:5px 10px;color:#666;">${s.time||'未記錄'}</td><td style="padding:5px 10px;">${s.reason||'未記錄原因'}</td></tr>`; });
                listHtml += '</table>';
            }
            const sec = document.createElement('div');
            sec.style.cssText = 'margin-bottom:28px;page-break-inside:avoid;';
            sec.innerHTML = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;border-bottom:3px solid ${child.color};padding-bottom:8px;"><img src="${child.avatar}" style="width:48px;height:48px;border-radius:50%;border:2px solid ${child.color};"><div><h2 style="margin:0;color:${child.color};font-size:1.3rem;">${child.name}</h2><span style="font-size:0.8rem;color:#888;">🏰 第${child.currentLevel}關 — 累計 ${getTotalStamps(child)} 個印章</span></div></div>${listHtml}`;
            rpt.appendChild(sec);
        });
        document.body.appendChild(rpt);
        html2pdf().set({ margin:0.3, filename:'Reward_Charts_Report.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'in',format:'a4',orientation:'portrait'} }).from(rpt).save().then(() => rpt.remove());
    }

    // ===== Utils =====
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }
    function showCelebration(msg) {
        document.getElementById('celebration-message').textContent = msg;
        document.getElementById('celebration-overlay').classList.add('active');
        for (let i = 0; i < 30; i++) {
            let c = document.createElement('div'); c.className = 'confetti';
            c.style.left = Math.random()*100+'vw';
            c.style.backgroundColor = ['#ff6b9d','#ffd54f','#81c784','#64b5f6'][Math.floor(Math.random()*4)];
            c.style.animationDuration = (2+Math.random()*3)+'s';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 5000);
        }
    }

    init();
})();
