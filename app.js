/**
 * 🌟 冒險蓋章挑戰 - 純前端版
 * 100% 前端，所有資料存在 localStorage，分享透過壓縮 URL 參數。
 */

(function () {
    'use strict';

    // ===== Constants & Config =====
    const TOTAL_STAMPS = 30;
    const STORAGE_KEY = 'rewardChart_v3';
    const MILESTONE_VALUES = [10, 20, 30];

    const AVATAR_IMAGES = [
        'images/coco_bear.png',
        'images/barkley_dk.png',
        'images/bear_forest_reward_1773823932111.png',
        'images/gorilla_gaming_reward_1773823949440.png',
        'images/rabbit_icecream_reward_1773823966250.png',
        'images/cat_piano_1773824059476.png',
        'images/dog_balloon_1773824077053.png',
        'images/panda_book_1773824096391.png',
        'images/turtle_spaceship_1773824432588.png',
        'images/fox_campfire_1773824448395.png',
        'images/koala_sleeping_1773824465460.png',
        'images/penguin_ic_1773824638469.png',
        'images/lion_k_1773824654576.png',
        'images/owl_r_1773824673758.png',
        'images/dolphin_t_1773824690102.png'
    ];
    
    const PRAISE_PHRASES = [
        '做得很棒喔！', '你好棒！', '太厲害了！繼續加油！', '哇，真的很棒耶！', 
        '好優秀喔！', '你是最棒的！', '再接再厲！你可以的！', '表現得非常好！'
    ];

    const ADVENTURE_TAGLINES = [
        '的冒險旅程', '的奇幻挑戰', '的星球探險',
        '的寶藏獵人', '的英雄任務', '的魔法世界',
        '的勇氣之路', '的夢國探索', '的奇蹟之旅',
        '的太空任務', '的叢林冒險', '的海底尋寶'
    ];
    let taglineIndex = 0;

    // ===== App State =====
    let state = { children: [] };
    let isReadOnlyMode = false;
    let pendingStampOperation = null;
    let currentView = 'stamp'; // 'stamp' or 'list'

    // ===== Initialization =====
    function init() {
        checkUrlForShareMode();
        
        if (isReadOnlyMode) {
            setupReadOnlyUI();
        } else {
            loadLocalState();
            setupParentUI();
        }
        
        renderAllCharts();
        bindEvents();
        fetchGithubStars();
    }

    // ===== URL & State Management =====
    function checkUrlForShareMode() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#data=')) {
            try {
                const compressed = hash.substring(6);
                const json = LZString.decompressFromEncodedURIComponent(compressed);
                if (json) {
                    const sharedState = JSON.parse(json);
                    state.children = sharedState.children || [];
                    isReadOnlyMode = true;
                }
            } catch (e) {
                console.error('分享連結解碼失敗', e);
            }
        }
    }

    function setupReadOnlyUI() {
        document.getElementById('top-controls').style.display = 'none';
        document.getElementById('github-star-btn').style.display = 'none';
        const banner = document.getElementById('readonly-banner');
        banner.style.display = 'flex';
        document.body.style.paddingTop = '48px';

        // Check if user has their own data
        const startOwnBtn = document.getElementById('readonly-start-own');
        if (startOwnBtn) {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.children && parsed.children.length > 0) {
                        startOwnBtn.textContent = '🏠 回到我的蓋章';
                    }
                }
            } catch(e) {}
        }
    }

    function setupParentUI() {
        if (state.children.length === 0) {
            showWelcomeScreen(true);
        }
    }

    function showWelcomeScreen(show) {
        document.getElementById('welcome-screen').style.display = show ? 'block' : 'none';
        document.getElementById('main-content').style.display = show ? 'none' : '';
    }

    function createChild(name, avatar, color) {
        const subtitle = name + ADVENTURE_TAGLINES[taglineIndex % ADVENTURE_TAGLINES.length];
        taglineIndex++;
        return {
            id: 'child_' + Date.now() + Math.random().toString().slice(2,6),
            name, subtitle, avatar, color,
            milestones: ['故事時間', '小點心', '超級大獎！'],
            stamps: new Array(TOTAL_STAMPS).fill(null)
        };
    }

    function loadLocalState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
                if (!state.children) state.children = [];
            }
        } catch (e) {
             console.warn('載入失敗', e);
        }
    }

    function saveLocalState() {
        if (isReadOnlyMode) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    // ===== Render Engine =====
    function renderAllCharts() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';

        if (state.children.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#666;">目前沒有設定小朋友，請點擊「家長設定」。</p>';
            return;
        }

        const template = document.getElementById('child-panel-template').content;

        state.children.forEach(child => {
            const clone = template.cloneNode(true);
            const section = clone.querySelector('.chart-panel');
            section.dataset.childId = child.id;

            section.querySelector('.child-name-display').textContent = child.name;
            const tagline = (child.subtitle || child.name + '的冒險旅程').replace(child.name, '');
            section.querySelector('.child-subtitle').textContent = tagline;
            section.querySelector('.child-avatar-display').src = child.avatar;
            
            const inner = section.querySelector('.panel-inner');
            inner.style.borderColor = child.color;
            
            const board = section.querySelector('.stamp-board');
            let stampedCount = 0;
            child.stamps.forEach((stamp, i) => {
                const cell = document.createElement('div');
                cell.className = 'stamp-cell';
                cell.dataset.childId = child.id;
                cell.dataset.index = i;
                
                if (stamp) {
                    cell.classList.add('stamped');
                    cell.innerHTML = `<span class="stamp-icon">⭐</span>`;
                    stampedCount++;
                } else {
                    cell.innerHTML = `<span class="cell-number">${i + 1}</span>`;
                }
                
                // Milestone markers
                if (MILESTONE_VALUES.includes(i + 1)) {
                    cell.classList.add('milestone-cell');
                }
                board.appendChild(cell);
            });

            // Progress
            const pct = (stampedCount / TOTAL_STAMPS) * 100;
            section.querySelector('.child-progress').style.width = pct + '%';
            section.querySelector('.child-count').textContent = `${stampedCount} / ${TOTAL_STAMPS}`;

            // Milestones
            const milestones = child.milestones || ['里程碑1', '里程碑2', '終極大獎'];
            const ms = section.querySelector('.child-milestones');
            ms.querySelector('.m10-label').textContent = milestones[0];
            ms.querySelector('.m20-label').textContent = milestones[1];
            ms.querySelector('.m30-label').textContent = milestones[2];
            
            MILESTONE_VALUES.forEach((val, idx) => {
                if (stampedCount >= val) {
                    ms.querySelector(`.m${val}`).classList.add('achieved');
                }
            });

            container.appendChild(clone);
        });
    }

    // ===== List View =====
    function renderListView() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';

        if (state.children.length === 0) {
            container.innerHTML = '<p style="text-align:center; width:100%; color:#666;">目前沒有資料。</p>';
            return;
        }

        state.children.forEach(child => {
            const panel = document.createElement('div');
            panel.className = 'list-view-panel';
            panel.style.borderLeft = `4px solid ${child.color}`;

            const stampedList = child.stamps
                .map((s, i) => s ? { index: i, ...s } : null)
                .filter(Boolean);
            const total = stampedList.length;

            let tableHtml = '';
            if (total === 0) {
                tableHtml = '<p style="color:#999; font-style:italic; padding:8px 0;">尚未獲得任何印章 🎯</p>';
            } else {
                tableHtml = '<table class="list-view-table"><thead><tr><th>#</th><th>日期時間</th><th>蓋章原因</th></tr></thead><tbody>';
                stampedList.forEach(s => {
                    tableHtml += `<tr>
                        <td class="list-stamp-num">⭐ ${s.index + 1}</td>
                        <td class="list-stamp-time">${s.time || '—'}</td>
                        <td>${s.reason || '—'}</td>
                    </tr>`;
                });
                tableHtml += '</tbody></table>';
            }

            const tagline = (child.subtitle || child.name + '的冒險旅程').replace(child.name, '');
            panel.innerHTML = `
                <div class="list-view-header">
                    <img src="${child.avatar}" class="list-view-avatar">
                    <div>
                        <span class="list-view-name">${child.name}</span>
                        <span class="list-view-tagline">${tagline}</span>
                        <div class="list-view-progress">進度 ${total} / ${TOTAL_STAMPS}</div>
                    </div>
                </div>
                ${tableHtml}
            `;
            container.appendChild(panel);
        });
    }

    function toggleView() {
        currentView = (currentView === 'stamp') ? 'list' : 'stamp';
        const isNowList = currentView === 'list';

        // Update toggle-view-btn icon + label
        const parentBtn = document.getElementById('toggle-view-btn');
        if (parentBtn) {
            const icon = parentBtn.querySelector('.btn-icon');
            const lbl  = parentBtn.querySelector('.btn-label');
            if (icon) icon.textContent = isNowList ? '🏆' : '📋';
            if (lbl)  lbl.textContent  = isNowList ? '印章' : '清單';
            parentBtn.classList.toggle('active-tab', isNowList);
        }

        // Update readonly toggle btn text
        const readonlyBtn = document.getElementById('readonly-toggle-view');
        if (readonlyBtn) readonlyBtn.textContent = isNowList ? '🏆 印章模式' : '📋 清單模式';

        if (isNowList) {
            renderListView();
        } else {
            renderAllCharts();
        }
    }


    // ===== Event Bindings =====
    function bindEvents() {
        document.getElementById('main-content').addEventListener('click', e => {
            const cell = e.target.closest('.stamp-cell');
            if (cell) handleStampClick(cell);
        });

        // Modals
        document.getElementById('stamp-cancel').addEventListener('click', () => closeModal('stamp-modal'));
        document.getElementById('stamp-confirm').addEventListener('click', handleStampConfirm);
        
        document.getElementById('detail-close').addEventListener('click', () => closeModal('stamp-detail-view'));
        document.getElementById('detail-kid-close').addEventListener('click', () => closeModal('stamp-detail-view'));
        document.getElementById('detail-remove').addEventListener('click', handleRemoveStamp);
        document.getElementById('detail-replay-sound').addEventListener('click', replayPraise);

        document.getElementById('celebration-close').addEventListener('click', () => closeModal('celebration-overlay'));

        // Parent Controls
        if (!isReadOnlyMode) {
            document.getElementById('setup-btn').addEventListener('click', openSetupModal);
            document.getElementById('setup-cancel').addEventListener('click', () => closeModal('setup-modal'));
            document.getElementById('setup-save').addEventListener('click', saveSetup);
            document.getElementById('setup-add-child').addEventListener('click', addSetupChildField);

            document.getElementById('share-btn').addEventListener('click', openShareModal);

            const exportBtn = document.getElementById('export-pdf-btn');
            if (exportBtn) exportBtn.addEventListener('click', exportToPDF);

            // Reset button
            document.getElementById('reset-btn').addEventListener('click', () => {
                if (confirm('⚠️ 確定要重新開始嗎？\n\n所有小朋友的資料、印章紀錄都會被清除！')) {
                    localStorage.removeItem(STORAGE_KEY);
                    state = { children: [] };
                    renderAllCharts();
                    showWelcomeScreen(true);
                }
            });
            document.getElementById('toggle-view-btn').addEventListener('click', toggleView);

            // Welcome Start button
            document.getElementById('welcome-start-btn').addEventListener('click', () => {
                showWelcomeScreen(false);
                openSetupModal();
            });
        }

        // Read-only buttons
        const startOwnBtn = document.getElementById('readonly-start-own');
        if (startOwnBtn) {
            startOwnBtn.addEventListener('click', () => {
                window.location.href = window.location.origin + window.location.pathname;
            });
        }
        const readonlyExportBtn = document.getElementById('readonly-export-pdf');
        if (readonlyExportBtn) readonlyExportBtn.addEventListener('click', exportToPDF);
        const readonlyToggleBtn = document.getElementById('readonly-toggle-view');
        if (readonlyToggleBtn) readonlyToggleBtn.addEventListener('click', toggleView);
        
        const readonlyShareBtn = document.getElementById('readonly-share');
        if (readonlyShareBtn) readonlyShareBtn.addEventListener('click', openShareModal);

        // Share modal close (works in both modes)
        document.getElementById('share-close').addEventListener('click', () => closeModal('share-modal'));

        // Share copy button
        const copyBtn = document.getElementById('share-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const input = document.getElementById('share-link-input');
                input.select();
                navigator.clipboard.writeText(input.value).then(() => {
                    copyBtn.textContent = '✅ 已複製！';
                    setTimeout(() => copyBtn.textContent = '📋 複製連結', 2000);
                });
            });
        }
        
        // GitHub Star
        document.getElementById('github-star-btn').addEventListener('click', triggerGithubStar);

        // ===== Hamburger Menu =====
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const backdrop = document.getElementById('mobile-menu-backdrop');

        function openHamburger() {
            hamburgerBtn.classList.add('open');
            mobileMenu.classList.add('open');
            backdrop.classList.add('open');
        }
        function closeHamburger() {
            hamburgerBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
            backdrop.classList.remove('open');
        }

        if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.contains('open') ? closeHamburger() : openHamburger();
        });
        if (backdrop) backdrop.addEventListener('click', closeHamburger);

        // Mobile menu items — mirror desktop actions
        const mSetup = document.getElementById('m-setup-btn');
        const mToggle = document.getElementById('m-toggle-btn');
        const mShare  = document.getElementById('m-share-btn');
        const mPdf    = document.getElementById('m-pdf-btn');
        const mReset  = document.getElementById('m-reset-btn');

        if (mSetup)  mSetup.addEventListener('click',  () => { closeHamburger(); openSetupModal(); });
        if (mToggle) mToggle.addEventListener('click', () => {
            closeHamburger();
            toggleView();
            // sync label
            mToggle.textContent = currentView === 'list' ? '🏆 印章模式' : '📋 清單模式';
        });
        if (mShare)  mShare.addEventListener('click',  () => { closeHamburger(); openShareModal(); });
        if (mPdf)    mPdf.addEventListener('click',    () => { closeHamburger(); exportToPDF(); });
        if (mReset)  mReset.addEventListener('click',  () => {
            closeHamburger();
            if (confirm('⚠️ 確定要重新開始嗎？\n\n所有小朋友的資料、印章紀錄都會被清除！')) {
                localStorage.removeItem(STORAGE_KEY);
                state = { children: [] };
                renderAllCharts();
                showWelcomeScreen(true);
            }
        });
    }

    // ===== Stamp Logic =====
    function handleStampClick(cell) {
        const childId = cell.dataset.childId;
        const index = parseInt(cell.dataset.index, 10);
        const child = state.children.find(c => c.id === childId);
        
        if (child.stamps[index] !== null) {
            openDetailView(child, index);
        } else {
            if (isReadOnlyMode) {
                alert("唯讀模式中，只有家長可以蓋印章喔！");
                return;
            }
            openStampModal(childId, index);
        }
    }

    function openStampModal(childId, index) {
        const child = state.children.find(c => c.id === childId);
        document.getElementById('stamp-modal-title').textContent = `${child.name} — 第 ${index + 1} 格蓋章`;
        
        const d = new Date();
        document.getElementById('stamp-time').value = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        document.getElementById('stamp-reason').value = '';
        
        pendingStampOperation = { childId, index };
        document.getElementById('stamp-modal').classList.add('active');
    }

    function handleStampConfirm() {
        const reasonInput = document.getElementById('stamp-reason').value.trim();
        if (!reasonInput) {
            alert('⚠️ 請務必填寫蓋章原因喔！這是給小朋友的鼓勵！');
            document.getElementById('stamp-reason').focus();
            return;
        }

        const { childId, index } = pendingStampOperation;
        const child = state.children.find(c => c.id === childId);
        
        child.stamps[index] = {
            time: document.getElementById('stamp-time').value,
            reason: reasonInput
        };
        
        saveLocalState();
        renderAllCharts();
        closeModal('stamp-modal');
        
        const stampedCount = child.stamps.filter(s => s !== null).length;
        speakPraise(child.name, child.stamps[index].reason, stampedCount);
        
        if (MILESTONE_VALUES.includes(stampedCount)) {
            setTimeout(() => {
                showCelebration(`太棒了！${child.name} 達成了 ${stampedCount} 個印章里程碑！`);
            }, 500);
        }
    }

    function openDetailView(child, index) {
        const stamp = child.stamps[index];
        document.getElementById('detail-title').textContent = `${child.name} — 第 ${index + 1} 格`;
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
        child.stamps[index] = null;
        saveLocalState();
        renderAllCharts();
        closeModal('stamp-detail-view');
    }

    // ===== Setup =====
    function openSetupModal() {
        const list = document.getElementById('setup-children-list');
        list.innerHTML = '';
        state.children.forEach(child => {
            list.appendChild(createSetupChildElement(child));
        });
        document.getElementById('setup-modal').classList.add('active');
    }

    function createSetupChildElement(child = { id: 'new_'+Date.now(), name: '', color: '#ffeb3b', avatar: AVATAR_IMAGES[2], milestones: ['故事時間','小點心','超級大獎！'] }) {
        const div = document.createElement('div');
        div.className = 'setup-child-item';
        div.style.border = '1px solid #ddd';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';
        div.style.borderRadius = '8px';
        div.dataset.id = child.id;
        
        const m1 = child.milestones?.[0] || '故事時間';
        const m2 = child.milestones?.[1] || '小點心';
        const m3 = child.milestones?.[2] || '超級大獎！';

        let avatarOptions = AVATAR_IMAGES.map((src, i) => 
            `<img src="${src}" class="avatar-carousel-item setup-avatar-opt ${src === child.avatar ? 'selected' : ''}" data-src="${src}">`
        ).join('');

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <input type="text" class="setup-child-name" value="${child.name}" placeholder="小朋友名字" style="padding:6px; flex:1; margin-right:8px;">
                <input type="color" class="setup-child-color" value="${child.color}" style="width:40px; height:30px;">
                <button class="setup-child-del" style="background:#f44336; color:white; border:none; border-radius:4px; margin-left:8px; padding:0 8px;">刪除</button>
            </div>
            <div style="margin-bottom:8px;">
                <label style="font-size:0.8rem;">自訂三個里程碑獎勵：</label>
                <div style="display:flex; gap:4px; margin-top:4px;">
                    <input type="text" class="setup-m1" value="${m1}" placeholder="10格獎勵" style="width:33%; font-size:0.8rem; padding:4px;">
                    <input type="text" class="setup-m2" value="${m2}" placeholder="20格獎勵" style="width:33%; font-size:0.8rem; padding:4px;">
                    <input type="text" class="setup-m3" value="${m3}" placeholder="30格獎勵" style="width:33%; font-size:0.8rem; padding:4px;">
                </div>
            </div>
            <div>
                <label style="font-size:0.8rem;">選擇大頭貼（左右滑動瀏覽）：</label>
                <div class="avatar-carousel">
                    ${avatarOptions}
                </div>
            </div>
        `;

        div.querySelectorAll('.setup-avatar-opt').forEach(opt => {
            opt.addEventListener('click', (e) => {
                div.querySelectorAll('.setup-avatar-opt').forEach(o => o.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        div.querySelector('.setup-child-del').addEventListener('click', () => div.remove());
        return div;
    }

    function addSetupChildField() {
        const items = document.querySelectorAll('.setup-child-item');
        if (items.length === 3) {
            alert('沒辦法！現在生四個的小朋友真的不多了，真的是辛苦你了！😅');
        } else if (items.length === 4) {
            alert('哇塞！生五個！你真的很神！簡直是國家級的生育英雄，請受我一拜！🙇‍♂️');
        } else if (items.length >= 5) {
            alert('太多啦！真的塞不下了🤣');
            return;
        }
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
            const selectedAvatar = el.querySelector('.setup-avatar-opt.selected') || el.querySelector('.setup-avatar-opt');
            const avatar = selectedAvatar ? selectedAvatar.dataset.src : AVATAR_IMAGES[0];
            const id = el.dataset.id;
            
            let existingChild = state.children.find(c => c.id === id);
            const subtitle = existingChild?.subtitle || (name + ADVENTURE_TAGLINES[newChildren.length % ADVENTURE_TAGLINES.length]);
            newChildren.push({
                id, name, subtitle, color, avatar,
                milestones: [m1, m2, m3],
                stamps: existingChild ? existingChild.stamps : new Array(TOTAL_STAMPS).fill(null)
            });
        });

        if (newChildren.length === 0) {
            alert('請至少新增一位小朋友！');
            return;
        }

        state.children = newChildren;
        saveLocalState();
        renderAllCharts();
        showWelcomeScreen(false);
        closeModal('setup-modal');
    }

    // ===== Share via URL =====
    function openShareModal() {
        // Compress state into URL
        const shareData = { children: state.children };
        const json = JSON.stringify(shareData);
        const compressed = LZString.compressToEncodedURIComponent(json);
        const shareLink = window.location.origin + window.location.pathname + '#data=' + compressed;
        
        document.getElementById('share-link-input').value = shareLink;
        
        // Generate QR
        document.getElementById('qrcode-wrapper').innerHTML = '';
        QRCode.toCanvas(document.createElement('canvas'), shareLink, { width: 200, margin: 2 }, function (err, canvas) {
            if (!err) {
                document.getElementById('qrcode-wrapper').appendChild(canvas);
            }
        });

        document.getElementById('share-modal').classList.add('active');
    }

    // ===== TTS =====
    function speakPraise(childName, reason, stampNumber) {
        if (!('speechSynthesis' in window)) return;
        const praise = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
        let text = `${childName}，第${stampNumber}個印章！${praise}`;
        if (reason) text += `因為${reason}，得到了這個印章！`;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-TW';
        window.speechSynthesis.speak(utterance);
    }

    function replayPraise() {
        const { childId, index } = pendingStampOperation;
        const child = state.children.find(c => c.id === childId);
        speakPraise(child.name, child.stamps[index].reason, index + 1);
    }

    // ===== GitHub Star =====
    function triggerGithubStar() {
        // Star burst animation
        const container = document.getElementById('star-burst-container');
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div');
            star.textContent = '⭐';
            star.style.position = 'fixed';
            star.style.left = '50%';
            star.style.top = '50%';
            star.style.fontSize = Math.random() * 20 + 10 + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            container.appendChild(star);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            star.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], { duration: 1000, easing: 'ease-out' }).onfinish = () => star.remove();
        }

        // Open GitHub repo in new tab
        setTimeout(() => {
            window.open('https://github.com/CocoChang928/Reward_Chart', '_blank');
        }, 600);
    }

    async function fetchGithubStars() {
        try {
            const res = await fetch('https://api.github.com/repos/CocoChang928/Reward_Chart');
            if (res.ok) {
                const data = await res.json();
                const textEl = document.querySelector('.github-star-btn .star-text');
                if (textEl) textEl.textContent = `GitHub ⭐ ${data.stargazers_count ?? 0}`;
            }
        } catch (e) {
            console.error('GitHub API error', e);
        }
    }

    // ===== PDF Export =====
    function exportToPDF() {
        const reportDiv = document.createElement('div');
        reportDiv.id = 'pdf-report';
        reportDiv.style.cssText = 'padding:20px; font-family:sans-serif; color:#333; background:white;';

        reportDiv.innerHTML = `
            <h1 style="text-align:center; color:#5d4037; margin-bottom:4px;">🌟 我們的冒險蓋章挑戰 🌟</h1>
            <p style="text-align:center; color:#888; font-size:0.85rem; margin-bottom:24px;">匯出日期：${new Date().toLocaleDateString('zh-TW')}</p>
        `;

        state.children.forEach(child => {
            const stampedList = child.stamps
                .map((s, i) => s ? { index: i, ...s } : null)
                .filter(Boolean);
            const total = stampedList.length;

            const section = document.createElement('div');
            section.style.cssText = 'margin-bottom:28px; page-break-inside:avoid;';

            let listHtml = '';
            if (total === 0) {
                listHtml = '<p style="color:#999; font-style:italic; padding-left:12px;">尚未獲得任何印章</p>';
            } else {
                listHtml = '<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">';
                listHtml += '<tr style="background:#fff3e0;"><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #ffe0b2;">#</th><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #ffe0b2;">日期時間</th><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #ffe0b2;">蓋章原因</th></tr>';
                stampedList.forEach(s => {
                    listHtml += `<tr style="border-bottom:1px solid #f5f5f5;">
                        <td style="padding:5px 10px; color:#ff8f00; font-weight:bold;">⭐ 第${s.index + 1}格</td>
                        <td style="padding:5px 10px; color:#666;">${s.time || '未記錄'}</td>
                        <td style="padding:5px 10px;">${s.reason || '未記錄原因'}</td>
                    </tr>`;
                });
                listHtml += '</table>';
            }

            section.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px; border-bottom:3px solid ${child.color}; padding-bottom:8px;">
                    <img src="${child.avatar}" style="width:48px; height:48px; border-radius:50%; border:2px solid ${child.color};">
                    <div>
                        <h2 style="margin:0; color:${child.color}; font-size:1.3rem;">${child.name}</h2>
                        <span style="font-size:0.8rem; color:#888;">${child.subtitle || child.name + '的冒險旅程'} — 進度 ${total} / ${TOTAL_STAMPS}</span>
                    </div>
                </div>
                ${listHtml}
            `;
            reportDiv.appendChild(section);
        });

        document.body.appendChild(reportDiv);

        html2pdf().set({
            margin: 0.3,
            filename: 'Reward_Charts_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }).from(reportDiv).save().then(() => reportDiv.remove());
    }

    // ===== Utils =====
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    function showCelebration(msg) {
        document.getElementById('celebration-message').textContent = msg;
        document.getElementById('celebration-overlay').classList.add('active');
        for (let i=0; i<30; i++) {
            let conf = document.createElement('div');
            conf.className = 'confetti';
            conf.style.left = Math.random() * 100 + 'vw';
            conf.style.backgroundColor = ['#ff6b9d','#ffd54f','#81c784','#64b5f6'][Math.floor(Math.random()*4)];
            conf.style.animationDuration = (2 + Math.random()*3) + 's';
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 5000);
        }
    }

    // Go!
    init();

})();
