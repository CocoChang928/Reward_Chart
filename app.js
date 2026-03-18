/**
 * 🌟 冒險蓋章挑戰 - 繁體中文改版
 * 包含：動態小朋友設定、隱藏彩蛋、臉部辨識把關、雲端唯讀分享模式、GitHub 星星。
 */

(function () {
    'use strict';

    // ===== Constants & Config =====
    const TOTAL_STAMPS = 30;
    const STORAGE_KEY = 'rewardChart_v3';
    const MILESTONE_VALUES = [10, 20, 30];
    const NPOINT_API_BASE = 'https://api.npoint.io';
    const FACE_API_MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

    // Default Images / Icons
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
    
    // TTS phrases (Traditional Chinese)
    const PRAISE_PHRASES = [
        '做得很棒喔！', '你好棒！', '太厲害了！繼續加油！', '哇，真的很棒耶！', 
        '好優秀喔！', '你是最棒的！', '再接再厲！你可以的！', '表現得非常好！'
    ];

    // ===== App State =====
    let state = {
        children: [], 
        shareId: null, // ID used for npoint cloud save
        parentFaceDescriptors: [] // Array of Float32Array representations
    };
    
    let isReadOnlyMode = false;
    let pendingStampOperation = null; // { childId, index }
    let audioCtx = null;
    let faceApiLoaded = false;

    // ===== Initialization =====
    async function init() {
        checkUrlForShareMode();
        
        if (isReadOnlyMode) {
            setupReadOnlyUI();
            await fetchCloudState();
        } else {
            loadLocalState();
            setupParentUI();
        }
        
        renderAllCharts();
        bindEvents();
        fetchGithubStars();

        if (!isReadOnlyMode) {
            // Load Face API in background for parent mode
            loadFaceApiModels();
        }
    }

    // ===== URL & State Management =====
    function checkUrlForShareMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share_id');
        if (shareId) {
            isReadOnlyMode = true;
            state.shareId = shareId;
        }
    }

    function setupReadOnlyUI() {
        document.getElementById('top-controls').style.display = 'none';
        document.getElementById('readonly-banner').style.display = 'block';
    }

    function setupParentUI() {
        if (state.children.length === 0) {
            // Default demo data if first time
            state.children.push(createChild('Coco', AVATAR_IMAGES[0], '#f48fb1'));
            state.children.push(createChild('Barkley', AVATAR_IMAGES[1], '#81c784'));
            saveLocalState();
        }
    }

    const ADVENTURE_TAGLINES = [
        '的冒險旅程', '的奇幻挑戰', '的星球探險',
        '的寶藏獵人', '的英雄任務', '的魔法世界',
        '的勇氣之路', '的壓國探索', '的奇蹟之旅',
        '的太空任務', '的叢林冒險', '的海底尋寶'
    ];
    let taglineIndex = 0;

    function createChild(name, avatar, color) {
        const subtitle = name + ADVENTURE_TAGLINES[taglineIndex % ADVENTURE_TAGLINES.length];
        taglineIndex++;
        return {
            id: 'child_' + Date.now() + Math.random().toString().slice(2,6),
            name: name,
            subtitle: subtitle,
            avatar: avatar,
            color: color,
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
                // Ensure arrays
                if (!state.children) state.children = [];
                // Migration
                if (state.parentFaceDescriptor) {
                    state.parentFaceDescriptors = [state.parentFaceDescriptor];
                    delete state.parentFaceDescriptor;
                    saveLocalState();
                }
                if (!state.parentFaceDescriptors) state.parentFaceDescriptors = [];
            }
        } catch (e) {
             console.warn('載入失敗', e);
        }
    }

    function saveLocalState() {
        if (isReadOnlyMode) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        syncToCloud();
    }

    // ===== Cloud Sync (nPoint) =====
    const fetchWithTimeout = async (url, options = {}) => {
        const { timeout = 8000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    };

    async function syncToCloud() {
        if (!state.shareId) return; // Only sync if parent has created a share link
        
        try {
            // Background sync (fire and forget)
            fetchWithTimeout(`${NPOINT_API_BASE}/${state.shareId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            }).catch(e => console.error('Cloud Sync Error', e));
        } catch(e) {
            console.error('雲端同步例外', e);
        }
    }

    async function fetchCloudState(isBackground = false) {
        if (!isBackground) showSyncOverlay(true);
        try {
            const res = await fetchWithTimeout(`${NPOINT_API_BASE}/${state.shareId}`, { timeout: 8000 });
            if (res.ok) {
                const cloudState = await res.json();
                state = cloudState;
                renderAllCharts();
            }
        } catch (e) {
            if (!isBackground) console.error('無法從雲端讀取資料。', e);
        }
        if (!isBackground) showSyncOverlay(false);
        
        // Auto refresh every 10 seconds in read only mode
        setTimeout(() => fetchCloudState(true), 10000);
    }

    function showSyncOverlay(show) {
        document.getElementById('sync-overlay').style.display = show ? 'flex' : 'none';
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
            const clone = document.importNode(template, true);
            const section = clone.querySelector('.chart-panel');
            section.dataset.childId = child.id;
            
            // Apply colors
            const inner = clone.querySelector('.panel-inner');
            inner.style.border = `3px solid ${child.color}`;
            inner.style.background = `linear-gradient(160deg, rgba(255,255,255,0.9), ${child.color}33)`;
            
            clone.querySelector('.child-name-display').textContent = child.name;
            clone.querySelector('.child-name-display').style.color = child.color;
            clone.querySelector('.child-subtitle').textContent = child.subtitle || (child.name + '的冒險旅程');
            clone.querySelector('.child-avatar-display').src = child.avatar;
            clone.querySelector('.character-glow').style.background = `radial-gradient(circle, ${child.color}80, transparent 70%)`;
            clone.querySelector('.child-progress').style.background = child.color;
            
            // Set Milestones
            clone.querySelector('.m10-label').textContent = child.milestones?.[0] || '故事時間';
            clone.querySelector('.m20-label').textContent = child.milestones?.[1] || '小點心';
            clone.querySelector('.m30-label').textContent = child.milestones?.[2] || '超級大獎！';
            
            // Build Board
            const board = clone.querySelector('.stamp-board');
            for (let i = 0; i < TOTAL_STAMPS; i++) {
                const cell = document.createElement('div');
                cell.className = 'stamp-cell';
                cell.dataset.index = i;
                cell.dataset.childId = child.id;
                
                // Color tweaks based on child color
                cell.style.borderColor = child.color;
                
                if (MILESTONE_VALUES.includes(i + 1)) {
                    cell.classList.add('milestone-cell');
                }

                const stampData = child.stamps[i];
                if (stampData) {
                    cell.classList.add('stamped');
                    if (stampData.reason) cell.classList.add('has-detail');
                    cell.style.background = child.color;
                    cell.style.color = 'white';
                    cell.innerHTML = '<span class="stamp-icon">⭐</span>';
                    cell.title = `#${i+1} | ${stampData.time || ''} \n${stampData.reason || ''}`;
                } else {
                    cell.style.background = `${child.color}22`;
                    cell.innerHTML = `<span class="stamp-number">${i+1}</span>`;
                }
                
                board.appendChild(cell);
            }

            container.appendChild(clone);
            updateChildProgressUI(child.id);
        });
    }

    function updateChildProgressUI(childId) {
        const child = state.children.find(c => c.id === childId);
        if (!child) return;
        
        const stampedCount = child.stamps.filter(s => s !== null).length;
        const panel = document.querySelector(`.chart-panel[data-child-id="${childId}"]`);
        if (!panel) return;

        panel.querySelector('.child-progress').style.width = `${(stampedCount / TOTAL_STAMPS) * 100}%`;
        panel.querySelector('.child-count').textContent = `${stampedCount} / ${TOTAL_STAMPS}`;

        MILESTONE_VALUES.forEach(val => {
            const m = panel.querySelector(`.m${val}`);
            if (m) {
                m.classList.toggle('reached', stampedCount >= val);
            }
        });
    }

    // ===== Events =====
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
            document.getElementById('share-close').addEventListener('click', () => closeModal('share-modal'));

            const exportBtn = document.getElementById('export-pdf-btn');
            if (exportBtn) exportBtn.addEventListener('click', exportToPDF);

            // Face Auth
            document.getElementById('face-auth-cancel').addEventListener('click', cancelFaceAuth);
            document.getElementById('face-auth-register').addEventListener('click', () => registerFace());
            document.getElementById('face-auth-register-2nd').addEventListener('click', () => registerFace());
            document.getElementById('face-auth-reset').addEventListener('click', resetFaceAuth);
        }
        
        // GitHub Star
        document.getElementById('github-star-btn').addEventListener('click', triggerGithubStar);
    }

    // ===== Face Authentication (Parent Only) =====
    async function loadFaceApiModels() {
        if (faceApiLoaded) return;
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODELS);
            await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODELS);
            await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODELS);
            faceApiLoaded = true;
            console.log("Face API models loaded.");
        } catch (e) {
            console.error("Failed to load Face API models:", e);
        }
    }

    let faceVideoStream = null;
    let faceAuthInterval = null;
    let faceAuthMode = 'verify'; // 'verify' or 'register'

    async function promptFaceAuth(mode, onSuccessCallback) {
        if (!faceApiLoaded) {
            alert("臉部辨識模型載入中，請稍候...");
            return;
        }

        faceAuthMode = mode;
        const modal = document.getElementById('face-auth-modal');
        const statusEl = document.getElementById('face-status');
        const regBtn = document.getElementById('face-auth-register');
        const reg2Btn = document.getElementById('face-auth-register-2nd');
        const resBtn = document.getElementById('face-auth-reset');
        
        statusEl.textContent = "請看著鏡頭...";
        
        if (state.parentFaceDescriptors.length > 0 && mode !== 'register') {
            regBtn.style.display = 'none';
            reg2Btn.style.display = 'none';
            resBtn.style.display = 'inline-block';
        } else {
            if (state.parentFaceDescriptors.length === 0) {
                regBtn.style.display = 'inline-block';
                reg2Btn.style.display = 'none';
            } else if (state.parentFaceDescriptors.length === 1) {
                regBtn.style.display = 'none';
                reg2Btn.style.display = 'inline-block';
            } else {
                regBtn.style.display = 'none';
                reg2Btn.style.display = 'none';
            }
            resBtn.style.display = (state.parentFaceDescriptors.length > 0) ? 'inline-block' : 'none';
        }

        modal.classList.add('active');

        // Start video
        const video = document.getElementById('face-video');
        try {
            faceVideoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
            video.srcObject = faceVideoStream;
            
            // Polling for detection
            if (mode === 'verify') {
                faceAuthInterval = setInterval(async () => {
                    if (video.paused || video.ended) return;
                    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                                  .withFaceLandmarks()
                                                  .withFaceDescriptor();
                    if (detection) {
                        if (state.parentFaceDescriptors.length > 0) {
                            let verified = false;
                            for (let desc of state.parentFaceDescriptors) {
                                const savedDescriptor = new Float32Array(desc);
                                const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);
                                if (distance < 0.5) { verified = true; break; }
                            }
                            if (verified) {
                                statusEl.textContent = "辨識成功！✓";
                                statusEl.style.color = "#4caf50";
                                clearInterval(faceAuthInterval);
                                setTimeout(() => {
                                    cancelFaceAuth(); // closes modal and stops video
                                    if (onSuccessCallback) onSuccessCallback();
                                }, 500);
                            } else {
                                statusEl.textContent = "未能辨識為家長，請重試！";
                                statusEl.style.color = "#f44336";
                            }
                        } else {
                            // Quick register
                            statusEl.textContent = "尚未註冊，請點擊「註冊為家長臉孔」";
                        }
                    }
                }, 500);
            }
        } catch (err) {
            console.error(err);
            statusEl.textContent = "無法存取攝影機！";
        }
    }

    async function registerFace() {
        const video = document.getElementById('face-video');
        const statusEl = document.getElementById('face-status');
        statusEl.textContent = "正在捕捉臉部...";
        
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                      .withFaceLandmarks()
                                      .withFaceDescriptor();
        if (detection) {
            // Save as array to stringify
            state.parentFaceDescriptors.push(Array.from(detection.descriptor));
            saveLocalState();
            statusEl.textContent = "註冊成功！";
            statusEl.style.color = "#4caf50";
            setTimeout(() => {
                cancelFaceAuth();
            }, 1000);
        } else {
            statusEl.textContent = "找不到臉部，請正對鏡頭！";
            statusEl.style.color = "#f44336";
        }
    }

    function resetFaceAuth() {
        if(confirm("確定要重設所有家長臉孔資料嗎？")) {
            state.parentFaceDescriptors = [];
            saveLocalState();
            cancelFaceAuth();
            setTimeout(() => promptFaceAuth('register'), 300);
        }
    }

    function cancelFaceAuth() {
        if (faceAuthInterval) clearInterval(faceAuthInterval);
        if (faceVideoStream) {
            faceVideoStream.getTracks().forEach(t => t.stop());
        }
        document.getElementById('face-auth-modal').classList.remove('active');
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
            // Require face auth to stamp!
            if (state.parentFaceDescriptors.length === 0) {
                alert("初次使用，請先設定家長臉孔。");
                promptFaceAuth('register');
            } else {
                promptFaceAuth('verify', () => {
                    openStampModal(childId, index);
                });
            }
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
        
        // Check milestone
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
        
        // Require face auth to remove stamp
        promptFaceAuth('verify', () => {
            const { childId, index } = pendingStampOperation;
            const child = state.children.find(c => c.id === childId);
            child.stamps[index] = null;
            
            saveLocalState();
            renderAllCharts();
            closeModal('stamp-detail-view');
        });
    }

    // ===== Easter Egg & Setup =====
    function openSetupModal() {
        promptFaceAuth('verify', () => {
            const list = document.getElementById('setup-children-list');
            list.innerHTML = '';
            state.children.forEach(child => {
                list.appendChild(createSetupChildElement(child));
            });
            document.getElementById('setup-modal').classList.add('active');
        });
    }

    function createSetupChildElement(child = { id: 'new_'+Date.now(), name: '', color: '#ffeb3b', avatar: AVATAR_IMAGES[2], milestones: ['故事時間','小點心','超級大獎！'] }) {
        const div = document.createElement('div');
        div.className = 'setup-child-item';
        div.style.border = '1px solid #ddd';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';
        div.style.borderRadius = '8px';
        div.dataset.id = child.id;
        
        // Populate default milestones if array missing
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

        // Avatar select logic
        div.querySelectorAll('.setup-avatar-opt').forEach(opt => {
            opt.addEventListener('click', (e) => {
                div.querySelectorAll('.setup-avatar-opt').forEach(o => o.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // Delete logic
        div.querySelector('.setup-child-del').addEventListener('click', () => {
            div.remove();
        });

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
            
            // Retain old stamps if child existed
            let existingChild = state.children.find(c => c.id === id);
            newChildren.push({
                id: id,
                name: name,
                color: color,
                avatar: avatar,
                milestones: [m1, m2, m3],
                stamps: existingChild ? existingChild.stamps : new Array(TOTAL_STAMPS).fill(null)
            });
        });

        state.children = newChildren;
        saveLocalState();
        renderAllCharts();
        closeModal('setup-modal');
    }

    async function openShareModal() {
        if (!state.shareId) {
            showSyncOverlay(true);
            try {
                // Create new bin
                const res = await fetchWithTimeout(`${NPOINT_API_BASE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(state),
                    timeout: 8000
                });
                const data = await res.json();
                state.shareId = data.id || data.url.split('/').pop(); // Handle missing id property
                saveLocalState();
            } catch(e) {
                alert("目前無法連接免費雲端伺服器 nPoint，分享功能暫時無法使用。請稍後再試！");
                showSyncOverlay(false);
                return;
            }
            showSyncOverlay(false);
        } else {
            // Background update
            fetchWithTimeout(`${NPOINT_API_BASE}/${state.shareId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            }).catch(e => console.error("Update fail:", e));
        }

        const shareLink = window.location.origin + window.location.pathname + '?share_id=' + state.shareId;
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

    // ===== Github Star =====
    function triggerGithubStar() {
        // Animation
        const container = document.getElementById('star-burst-container');
        for (let i = 0; i < 20; i++) {
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

        setTimeout(() => {
            alert('感謝您的支持！⭐✨\n\n您的鼓勵是我們最大的動力！');
        }, 800);
    }

    async function fetchGithubStars() {
        try {
            const res = await fetch('https://api.github.com/repos/vc103/Reward_Chart');
            if (!res.ok) {
                const textEl = document.querySelector('.github-star-btn .star-text');
                if (textEl) textEl.textContent = `（尚未上傳 GitHub）`;
                return;
            }
            const data = await res.json();
            if (data.stargazers_count !== undefined) {
                const textEl = document.querySelector('.github-star-btn .star-text');
                if (textEl) textEl.textContent = `被按星數：${data.stargazers_count}`;
            }
        } catch (e) {
            console.error('Fetch Github stars error', e);
        }
    }

    // ===== Utils =====
    function exportToPDF() {
        // Build a clean list-style report
        const reportDiv = document.createElement('div');
        reportDiv.id = 'pdf-report';
        reportDiv.style.cssText = 'padding:20px; font-family:sans-serif; color:#333; background:white;';

        // Title
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

        // Append temporarily to body (hidden)
        document.body.appendChild(reportDiv);

        const opt = {
            margin:       0.3,
            filename:     'Reward_Charts_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(reportDiv).save().then(() => {
            reportDiv.remove();
        });
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    function showCelebration(msg) {
        document.getElementById('celebration-message').textContent = msg;
        document.getElementById('celebration-overlay').classList.add('active');
        // Simple confetti (reused from initial code)
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
