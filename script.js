// スケジュール設定
const times = [
    { period: 1, text: "08:50\n10:20" },
    { period: 2, text: "10:30\n12:00" },
    { period: 3, text: "13:00\n14:30" },
    { period: 4, text: "14:40\n16:10" },
    { period: 5, text: "16:20\n17:50" }
];
const days = ["月", "火", "水", "木", "金"];
const dayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };

// データ保持
let timetableData = JSON.parse(localStorage.getItem('myTimetable')) || {};
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];
let customCategories = JSON.parse(localStorage.getItem('myCategories')) || ["未分類", "提出物", "買い物"];
let activeCategoryFilter = "すべて";
let editingTaskId = null;
let editingMemoTaskId = null; // 現在メモ編集中のタスクID

// 選択中のコマ保持・選択カラーの初期値
let activeCellKey = null;
let selectedColor = "#F38181";

// ログインユーザー保持
let currentUser = null;

// 要素取得
const tabTimetableBtn = document.getElementById('tabTimetableBtn');
const tabTaskBtn = document.getElementById('tabTaskBtn');
const viewTimetable = document.getElementById('viewTimetable');
const viewTask = document.getElementById('viewTask');
const timetableBody = document.getElementById('timetableBody');

// モーダル1 (時間割)
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalDetailView = document.getElementById('modalDetailView');
const modalEditView = document.getElementById('modalEditView');
const modalSubjectTitle = document.getElementById('modalSubjectTitle');
const modalSubjectMeta = document.getElementById('modalSubjectMeta');
const modalTeacherEmail = document.getElementById('modalTeacherEmail');
const modalEditBtn = document.getElementById('modalEditBtn');
const memoTextInput = document.getElementById('memoTextInput');
const addMemoBtn = document.getElementById('addMemoBtn');
const memoList = document.getElementById('memoList');
const modalFormTitle = document.getElementById('modalFormTitle');
const modalSubjectInput = document.getElementById('modalSubjectInput');
const modalTeacherInput = document.getElementById('modalTeacherInput');
const modalEmailInput = document.getElementById('modalEmailInput');
const modalRoomInput = document.getElementById('modalRoomInput');
const saveSubjectBtn = document.getElementById('saveSubjectBtn');
const deleteSubjectBtn = document.getElementById('deleteSubjectBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const colorCircles = document.querySelectorAll('.color-circle');

// モーダル2 (リスト管理)
const listManageModalOverlay = document.getElementById('listManageModalOverlay');
const manageListBtn = document.getElementById('manageListBtn');
const listManageCloseBtn = document.getElementById('listManageCloseBtn');
const newListNameInput = document.getElementById('newListNameInput');
const addNewListBtn = document.getElementById('addNewListBtn');
const customCategoryList = document.getElementById('customCategoryList');

// タスク・トグル要素
const toggleTaskFormBtn = document.getElementById('toggleTaskFormBtn');
const taskFormContent = document.getElementById('taskFormContent');
const toggleFormIcon = document.getElementById('toggleFormIcon');
const toggleFormText = document.getElementById('toggleFormText');
const addTaskFromBottomBtn = document.getElementById('addTaskFromBottomBtn');

// タスクフォーム要素
const taskFormHeading = document.getElementById('taskFormHeading');
const taskInput = document.getElementById('taskInput');
const taskCategorySelect = document.getElementById('taskCategorySelect');
const subjectSelect = document.getElementById('subjectSelect');
const hasDueCheckbox = document.getElementById('hasDueCheckbox');
const dueDateInputArea = document.getElementById('dueDateInputArea');
const dueDateTimeInput = document.getElementById('dueDateTimeInput');
const repeatTypeSelect = document.getElementById('repeatTypeSelect');
const repeatSubArea = document.getElementById('repeatSubArea');
const repeatUntilInput = document.getElementById('repeatUntilInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const cancelTaskEditBtn = document.getElementById('cancelTaskEditBtn');
const messageArea = document.getElementById('messageArea');
const taskList = document.getElementById('taskList');
const listTabContainer = document.getElementById('listTabContainer');

// 初期表示
window.addEventListener('DOMContentLoaded', () => {
    checkAndResetClassTasks();
    renderTimetable();
    updateSubjectSelectOptions();
    renderCategoryFilterTabs();
    updateCategorySelectOptions();
    renderTasks();
    setupColorPicker();
    setupAuthListeners();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    }
});

// タスクフォーム開閉（アコーディオン）処理
toggleTaskFormBtn.addEventListener('click', () => {
    toggleTaskForm();
});

function toggleTaskForm(openState = null) {
    const isCurrentlyHidden = taskFormContent.style.display === 'none';
    const shouldOpen = openState !== null ? openState : isCurrentlyHidden;

    if (shouldOpen) {
        taskFormContent.style.display = 'block';
        toggleFormIcon.textContent = '▲';
    } else {
        taskFormContent.style.display = 'none';
        toggleFormIcon.textContent = '▼';
    }
}

// リスト最下部の新規追加ボタン
addTaskFromBottomBtn.addEventListener('click', () => {
    resetTaskForm();
    if (activeCategoryFilter !== 'すべて') {
        taskCategorySelect.value = activeCategoryFilter;
    }
    toggleTaskForm(true);
    taskInput.focus();
    window.scrollTo({ top: taskFormContent.offsetTop - 60, behavior: 'smooth' });
});

// 毎授業用タスクの自動復活判定
function checkAndResetClassTasks() {
    if (!Array.isArray(tasks)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let isUpdated = false;

    tasks = tasks.map(task => {
        if (task.completed && task.repeat && task.repeat.type === 'class_reset' && task.resetDate) {
            if (task.repeat.until && todayStr > task.repeat.until) {
                return task;
            }

            if (todayStr >= task.resetDate) {
                isUpdated = true;
                return {
                    ...task,
                    completed: false,
                    resetDate: null
                };
            }
        }
        return task;
    });

    if (isUpdated) {
        localStorage.setItem('myTasks', JSON.stringify(tasks));
        saveUserDataToCloud();
    }
}

// 次の指定曜日（YYYY-MM-DD）を取得
function getNextClassDate(targetDays) {
    const today = new Date();
    const currentDayNum = today.getDay();
    const targetNums = targetDays.map(d => dayMap[d]).sort((a, b) => a - b);
    
    let daysUntilNext = null;
    for (let targetNum of targetNums) {
        let diff = targetNum - currentDayNum;
        if (diff <= 0) diff += 7;
        if (daysUntilNext === null || diff < daysUntilNext) {
            daysUntilNext = diff;
        }
    }

    if (daysUntilNext === null) daysUntilNext = 7;

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);

    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Firebase 認証
function setupAuthListeners() {
    if (!window.firebaseAuth) {
        setTimeout(setupAuthListeners, 100);
        return;
    }

    const { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = window.firebaseAuth;

    onAuthStateChanged(auth, async (user) => {
        const loginBtn = document.getElementById('googleLoginBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');

        if (user) {
            currentUser = user;
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'block';
            if (userName) userName.textContent = `${user.displayName} さん`;

            await loadUserDataFromCloud(user.uid);
        } else {
            currentUser = null;
            if (loginBtn) loginBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    });

    const loginBtn = document.getElementById('googleLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider).catch(error => console.error("ログインエラー:", error));
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth);
        });
    }
}

// クラウドへデータ同期
async function saveUserDataToCloud() {
    if (!currentUser || !window.firebaseDb) return;

    const { db, doc, setDoc, serverTimestamp } = window.firebaseDb;

    const dataToSave = {
        timetable: JSON.parse(localStorage.getItem('myTimetable')) || {},
        tasks: JSON.parse(localStorage.getItem('myTasks')) || [],
        categories: JSON.parse(localStorage.getItem('myCategories')) || ["未分類", "提出物", "買い物"],
        updatedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, 'users', currentUser.uid), dataToSave, { merge: true });
        console.log("☁️ クラウドへ自動バックアップ完了");
    } catch (error) {
        console.error("クラウドバックアップエラー:", error);
    }
}

// クラウドからデータ読み込み
async function loadUserDataFromCloud(uid) {
    if (!window.firebaseDb) return;

    const { db, doc, getDoc } = window.firebaseDb;

    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.timetable) localStorage.setItem('myTimetable', JSON.stringify(data.timetable));
            if (data.tasks) localStorage.setItem('myTasks', JSON.stringify(data.tasks));
            if (data.categories) localStorage.setItem('myCategories', JSON.stringify(data.categories));

            timetableData = data.timetable || {};
            tasks = data.tasks || [];
            customCategories = data.categories || ["未分類", "提出物", "買い物"];

            checkAndResetClassTasks();
            renderTimetable();
            updateSubjectSelectOptions();
            renderCategoryFilterTabs();
            updateCategorySelectOptions();
            renderTasks();
            console.log("☁️️ クラウドからデータを同期しました");
        }
    } catch (error) {
        console.error("データ同期エラー:", error);
    }
}

// カラーピッカー
function setupColorPicker() {
    colorCircles.forEach(circle => {
        circle.addEventListener('click', () => {
            colorCircles.forEach(c => c.classList.remove('active'));
            circle.classList.add('active');
            selectedColor = circle.getAttribute('data-color');
        });
    });
}

function setSelectedColorInPicker(colorCode) {
    selectedColor = colorCode || "#F38181";
    colorCircles.forEach(circle => {
        if (circle.getAttribute('data-color') === selectedColor) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });
}

// タブ切り替え
tabTimetableBtn.addEventListener('click', () => {
    tabTimetableBtn.classList.add('active');
    tabTaskBtn.classList.remove('active');
    viewTimetable.classList.add('active');
    viewTask.classList.remove('active');
    messageArea.textContent = '';
});

tabTaskBtn.addEventListener('click', () => {
    tabTaskBtn.classList.add('active');
    tabTimetableBtn.classList.remove('active');
    viewTask.classList.add('active');
    viewTimetable.classList.remove('active');
    messageArea.textContent = '';
});

// モーダル1 (時間割) 閉じる
modalCloseBtn.onclick = closeModal;
modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
};

function closeModal() {
    modalOverlay.style.display = 'none';
    activeCellKey = null;
}

// モーダル2 (リスト管理) 閉じる
listManageCloseBtn.onclick = () => { listManageModalOverlay.style.display = 'none'; };
manageListBtn.onclick = () => {
    renderCustomCategoryManageList();
    listManageModalOverlay.style.display = 'flex';
};

// リスト（カテゴリ）タブのレンダリング
function renderCategoryFilterTabs() {
    listTabContainer.innerHTML = '';
    const allTabList = ["すべて", ...customCategories];

    allTabList.forEach(catName => {
        const chip = document.createElement('div');
        chip.className = `list-filter-chip ${activeCategoryFilter === catName ? 'active' : ''}`;
        chip.textContent = catName;
        chip.onclick = () => {
            activeCategoryFilter = catName;
            renderCategoryFilterTabs();
            renderTasks();
        };
        listTabContainer.appendChild(chip);
    });

    if (activeCategoryFilter === 'すべて') {
        addTaskFromBottomBtn.textContent = '➕ タスクを新規追加';
    } else {
        addTaskFromBottomBtn.textContent = `➕ 「${activeCategoryFilter}」にタスクを追加`;
    }
}

function updateCategorySelectOptions() {
    taskCategorySelect.innerHTML = '';
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        taskCategorySelect.appendChild(option);
    });
}

function renderCustomCategoryManageList() {
    customCategoryList.innerHTML = '';
    customCategories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.textContent = cat;

        const delBtn = document.createElement('button');
        delBtn.className = 'memo-del-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = async () => {
            if (customCategories.length <= 1) {
                alert('リストは最低1つ残す必要があります。');
                return;
            }
            customCategories.splice(index, 1);
            localStorage.setItem('myCategories', JSON.stringify(customCategories));
            await saveUserDataToCloud();
            renderCategoryFilterTabs();
            updateCategorySelectOptions();
            renderCustomCategoryManageList();
            renderTasks();
        };

        li.appendChild(delBtn);
        customCategoryList.appendChild(li);
    });
}

addNewListBtn.onclick = async () => {
    const newCat = newListNameInput.value.trim();
    if (!newCat) return;

    if (customCategories.includes(newCat)) {
        alert('すでに同じ名前のリストが存在します。');
        return;
    }

    customCategories.push(newCat);
    localStorage.setItem('myCategories', JSON.stringify(customCategories));
    await saveUserDataToCloud();
    
    newListNameInput.value = '';
    renderCategoryFilterTabs();
    updateCategorySelectOptions();
    renderCustomCategoryManageList();
    renderTasks();
};

// 時間割描画
function renderTimetable() {
    timetableBody.innerHTML = '';
    times.forEach(t => {
        const tr = document.createElement('tr');
        
        const timeTd = document.createElement('td');
        timeTd.className = 'time-cell';
        timeTd.innerHTML = `<span class="time-num">${t.period}</span>${t.text.replace('\n', '<br>')}`;
        tr.appendChild(timeTd);

        days.forEach(day => {
            const td = document.createElement('td');
            const key = `${day}_${t.period}`;
            const cellData = timetableData[key];

            td.onclick = () => openCellModal(key, day, t.period);

            if (cellData && cellData.subject) {
                const memoCount = (cellData.memos && cellData.memos.length > 0) ? `📝${cellData.memos.length}` : '';
                const cardColor = cellData.color || "#F38181";

                const card = document.createElement('div');
                card.className = 'subject-card';
                card.style.backgroundColor = cardColor;
                card.innerHTML = `
                    <div class="subject-name">${cellData.subject}</div>
                    ${cellData.teacher ? `<div class="teacher-name">👤 ${cellData.teacher}</div>` : ''}
                    <div>
                        ${cellData.room ? `<span class="room-badge">${cellData.room}</span>` : ''}
                        ${memoCount ? `<span class="memo-count-badge">${memoCount}</span>` : ''}
                    </div>
                `;
                td.appendChild(card);
            } else {
                td.innerHTML = `<div class="empty-cell-placeholder">＋</div>`;
            }
            tr.appendChild(td);
        });
        timetableBody.appendChild(tr);
    });
}

function openCellModal(key, day, period) {
    activeCellKey = key;
    const cellData = timetableData[key];

    if (cellData && cellData.subject) {
        modalSubjectTitle.textContent = cellData.subject;
        modalSubjectMeta.textContent = `${day}曜 ${period}限 | 👤 ${cellData.teacher || '教員未登録'} | 🏫 ${cellData.room || '教室未登録'}`;
        
        if (cellData.email) {
            modalTeacherEmail.innerHTML = `✉️ <a href="mailto:${cellData.email}">${cellData.email}</a>`;
        } else {
            modalTeacherEmail.textContent = '✉️ メールアドレス未登録';
        }

        renderMemos(cellData.memos || []);

        modalDetailView.style.display = 'block';
        modalEditView.style.display = 'none';
    } else {
        showEditForm(day, period, '', "#F38181", '', '', '');
    }

    modalOverlay.style.display = 'flex';
}

modalEditBtn.onclick = () => {
    const cellData = timetableData[activeCellKey] || {};
    const [day, period] = activeCellKey.split('_');
    showEditForm(day, period, cellData.subject || '', cellData.color || "#F38181", cellData.teacher || '', cellData.email || '', cellData.room || '');
};

function showEditForm(day, period, subject, color, teacher, email, room) {
    modalFormTitle.textContent = `📚 科目の編集 (${day}曜 ${period}限)`;
    modalSubjectInput.value = subject;
    modalTeacherInput.value = teacher;
    modalEmailInput.value = email;
    modalRoomInput.value = room;

    setSelectedColorInPicker(color);

    modalDetailView.style.display = 'none';
    modalEditView.style.display = 'block';
    modalSubjectInput.focus();
}

cancelEditBtn.onclick = () => {
    const cellData = timetableData[activeCellKey];
    if (cellData && cellData.subject) {
        modalDetailView.style.display = 'block';
        modalEditView.style.display = 'none';
    } else {
        closeModal();
    }
};

saveSubjectBtn.onclick = async () => {
    const subject = modalSubjectInput.value.trim();
    const teacher = modalTeacherInput.value.trim();
    const email = modalEmailInput.value.trim();
    const room = modalRoomInput.value.trim();

    if (!subject) {
        alert('科目名を入力してください。');
        return;
    }

    const currentCell = timetableData[activeCellKey] || {};

    timetableData[activeCellKey] = {
        subject,
        color: selectedColor,
        teacher, email, room,
        memos: currentCell.memos || []
    };

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderTimetable();
    updateSubjectSelectOptions();
    closeModal();
    messageArea.textContent = '💾 科目を保存しました！';
};

deleteSubjectBtn.onclick = async () => {
    if (confirm('このコマの科目を削除しますか？')) {
        delete timetableData[activeCellKey];
        localStorage.setItem('myTimetable', JSON.stringify(timetableData));
        await saveUserDataToCloud();
        renderTimetable();
        updateSubjectSelectOptions();
        closeModal();
        messageArea.textContent = '🗑 コマを削除しました。';
    }
};

addMemoBtn.onclick = async () => {
    const text = memoTextInput.value.trim();
    if (!text) return;

    if (!timetableData[activeCellKey].memos) {
        timetableData[activeCellKey].memos = [];
    }

    const now = new Date();
    const timeStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    timetableData[activeCellKey].memos.unshift({
        id: Date.now(),
        text: text,
        date: timeStr
    });

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderMemos(timetableData[activeCellKey].memos);
    renderTimetable();
    memoTextInput.value = '';
};

async function deleteMemo(memoId) {
    if (!timetableData[activeCellKey] || !timetableData[activeCellKey].memos) return;
    timetableData[activeCellKey].memos = timetableData[activeCellKey].memos.filter(m => m.id !== memoId);
    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderMemos(timetableData[activeCellKey].memos);
    renderTimetable();
}

function renderMemos(memos) {
    memoList.innerHTML = '';
    if (memos.length === 0) {
        memoList.innerHTML = '<li style="color:#aaa; border:none; background:none;">メモはありません</li>';
        return;
    }

    memos.forEach(memo => {
        const li = document.createElement('li');
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `<span class="memo-date">🕒 ${memo.date}</span><div>${memo.text}</div>`;

        const delBtn = document.createElement('button');
        delBtn.className = 'memo-del-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = () => deleteMemo(memo.id);

        li.appendChild(contentDiv);
        li.appendChild(delBtn);
        memoList.appendChild(li);
    });
}

function updateSubjectSelectOptions() {
    subjectSelect.innerHTML = '<option value="">(関連科目なし)</option>';
    const subjectList = [];
    Object.values(timetableData).forEach(item => {
        if (item && item.subject && !subjectList.includes(item.subject)) {
            subjectList.push(item.subject);
        }
    });

    subjectList.forEach(subj => {
        const option = document.createElement('option');
        option.value = subj;
        option.textContent = subj;
        subjectSelect.appendChild(option);
    });
}

// タスク追加 / 編集のコントロール
hasDueCheckbox.addEventListener('change', (e) => {
    dueDateInputArea.style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) dueDateTimeInput.value = '';
});

repeatTypeSelect.addEventListener('change', (e) => {
    repeatSubArea.style.display = e.target.value === 'none' ? 'none' : 'block';
});

// タスク追加・更新処理
addTaskBtn.addEventListener('click', async () => {
    const text = taskInput.value.trim();
    const selectedCategory = taskCategorySelect.value || "未分類";
    const selectedSubject = subjectSelect.value;
    const hasDue = hasDueCheckbox.checked;
    const dueDateTime = hasDue ? dueDateTimeInput.value : null;
    const repeatType = repeatTypeSelect.value;
    let repeatDays = [];
    let repeatUntil = null;

    if (!text) {
        messageArea.textContent = '⚠ やることを入力してください。';
        return;
    }

    if (hasDue && !dueDateTime) {
        messageArea.textContent = '⚠ 期限の日時を選択してください。';
        return;
    }

    if (repeatType !== 'none') {
        document.querySelectorAll('.repeat-day-cb:checked').forEach(cb => repeatDays.push(cb.value));
        if (repeatDays.length === 0) {
            messageArea.textContent = '⚠ 繰り返す曜日を選択してください。';
            return;
        }
        repeatUntil = repeatUntilInput.value;
        if (!repeatUntil) {
            messageArea.textContent = '⚠ いつまで繰り返すかを選択してください。';
            return;
        }
    }

    if (!Array.isArray(tasks)) tasks = [];

    if (editingTaskId) {
        tasks = tasks.map(t => {
            if (t.id === editingTaskId) {
                return {
                    ...t,
                    text: text,
                    category: selectedCategory,
                    subject: selectedSubject,
                    dueDate: dueDateTime,
                    repeat: { type: repeatType, days: repeatDays, until: repeatUntil }
                };
            }
            return t;
        });
        messageArea.textContent = '💾 タスクを更新しました！';
        resetTaskForm();
    } else {
        tasks.push({
            id: Date.now(),
            text: text,
            category: selectedCategory,
            subject: selectedSubject,
            completed: false,
            dueDate: dueDateTime,
            resetDate: null,
            note: '',
            repeat: { type: repeatType, days: repeatDays, until: repeatUntil }
        });
        messageArea.textContent = '💾 タスクを追加しました！';
        resetTaskForm();
    }

    localStorage.setItem('myTasks', JSON.stringify(tasks));
    await saveUserDataToCloud();
    renderTasks();
    toggleTaskForm(false);
});

cancelTaskEditBtn.addEventListener('click', () => {
    resetTaskForm();
    toggleTaskForm(false);
});

function resetTaskForm() {
    editingTaskId = null;
    taskFormHeading.textContent = '➕ タスクの追加';
    toggleFormText.textContent = '➕ 新しいタスクを追加';
    addTaskBtn.textContent = '💾 タスク追加';
    cancelTaskEditBtn.style.display = 'none';

    taskInput.value = '';
    hasDueCheckbox.checked = false;
    dueDateInputArea.style.display = 'none';
    dueDateTimeInput.value = '';
    repeatTypeSelect.value = 'none';
    repeatSubArea.style.display = 'none';
    document.querySelectorAll('.repeat-day-cb').forEach(cb => cb.checked = false);
    repeatUntilInput.value = '';
}

function startEditingTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    taskFormHeading.textContent = '✏️ タスクの編集';
    toggleFormText.textContent = '✏️ タスクを編集（開いています）';
    addTaskBtn.textContent = '💾 変更を保存';
    cancelTaskEditBtn.style.display = 'block';

    taskInput.value = task.text;
    taskCategorySelect.value = task.category || "未分類";
    subjectSelect.value = task.subject || "";

    if (task.dueDate) {
        hasDueCheckbox.checked = true;
        dueDateInputArea.style.display = 'block';
        dueDateTimeInput.value = task.dueDate;
    } else {
        hasDueCheckbox.checked = false;
        dueDateInputArea.style.display = 'none';
        dueDateTimeInput.value = '';
    }

    if (task.repeat && task.repeat.type !== 'none') {
        repeatTypeSelect.value = task.repeat.type;
        repeatSubArea.style.display = 'block';
        document.querySelectorAll('.repeat-day-cb').forEach(cb => {
            cb.checked = task.repeat.days.includes(cb.value);
        });
        repeatUntilInput.value = task.repeat.until || '';
    } else {
        repeatTypeSelect.value = 'none';
        repeatSubArea.style.display = 'none';
        document.querySelectorAll('.repeat-day-cb').forEach(cb => cb.checked = false);
        repeatUntilInput.value = '';
    }

    toggleTaskForm(true);
    window.scrollTo({ top: viewTask.offsetTop, behavior: 'smooth' });
}

// タスク個別メモの保存 (ボタン明示クリック時のみ更新)
async function saveTaskNote(id, noteText) {
    if (!Array.isArray(tasks)) return;

    tasks = tasks.map(t => {
        if (t.id === id) {
            return { ...t, note: noteText.trim() };
        }
        return t;
    });

    editingMemoTaskId = null; // 編集完了
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    await saveUserDataToCloud();
    renderTasks();
}

async function toggleTask(id) {
    if (!Array.isArray(tasks)) return;

    tasks = tasks.map(task => {
        if (task.id === id) {
            const nextCompletedState = !task.completed;
            let nextResetDate = task.resetDate;

            if (nextCompletedState && task.repeat && task.repeat.type === 'class_reset' && task.repeat.days.length > 0) {
                nextResetDate = getNextClassDate(task.repeat.days);
            } else if (!nextCompletedState) {
                nextResetDate = null;
            }

            return {
                ...task,
                completed: nextCompletedState,
                resetDate: nextResetDate
            };
        }
        return task;
    });

    localStorage.setItem('myTasks', JSON.stringify(tasks));
    await saveUserDataToCloud();
    renderTasks();
}

async function deleteTask(id) {
    if (!Array.isArray(tasks)) return;
    tasks = tasks.filter(task => task.id !== id);
    if (editingTaskId === id) resetTaskForm();

    localStorage.setItem('myTasks', JSON.stringify(tasks));
    await saveUserDataToCloud();
    renderTasks();
}

function formatDueDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return `⏰ ${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function formatRepeatInfo(repeat, resetDate) {
    if (!repeat || repeat.type === 'none') return '';
    
    let typeText = '毎週';
    if (repeat.type === 'biweekly') typeText = '隔週';
    if (repeat.type === 'class_reset') typeText = '🏫 毎授業';

    const untilText = repeat.until ? ` ~${new Date(repeat.until).getMonth()+1}/${new Date(repeat.until).getDate()}` : '';
    const resetInfo = resetDate ? ` (次回復活: ${resetDate.split('-')[1]}/${resetDate.split('-')[2]})` : '';

    return `🔄 ${typeText}(${repeat.days.join(',')})${untilText}${resetInfo}`;
}

function renderTasks() {
    taskList.innerHTML = '';
    if (!Array.isArray(tasks) || tasks.length === 0) {
        taskList.innerHTML = '<li style="color:#aaa; border:none;">タスクはありません</li>';
        return;
    }

    const filteredTasks = tasks.filter(task => {
        if (activeCategoryFilter === 'すべて') return true;
        return (task.category || '未分類') === activeCategoryFilter;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<li style="color:#aaa; border:none;">「${activeCategoryFilter}」のタスクはありません</li>`;
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');

        const headerRow = document.createElement('div');
        headerRow.className = 'task-header-row';

        const leftDiv = document.createElement('div');
        leftDiv.className = 'task-left';

        const checkbox = document.createElement('div');
        checkbox.className = `custom-checkbox ${task.completed ? 'checked' : ''}`;
        checkbox.onclick = () => toggleTask(task.id);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'task-tags';

        const categoryTag = document.createElement('span');
        categoryTag.className = 'category-tag';
        categoryTag.textContent = task.category || '未分類';
        tagsDiv.appendChild(categoryTag);

        if (task.subject) {
            const subjectTag = document.createElement('span');
            subjectTag.className = 'task-tag';
            subjectTag.textContent = task.subject;
            tagsDiv.appendChild(subjectTag);
        }

        if (task.dueDate) {
            const dueTag = document.createElement('span');
            dueTag.className = 'due-tag';
            dueTag.textContent = formatDueDate(task.dueDate);
            tagsDiv.appendChild(dueTag);
        }

        if (task.repeat && task.repeat.type !== 'none') {
            const repeatTag = document.createElement('span');
            repeatTag.className = 'repeat-tag';
            repeatTag.textContent = formatRepeatInfo(task.repeat, task.resetDate);
            tagsDiv.appendChild(repeatTag);
        }

        infoDiv.appendChild(tagsDiv);

        const textSpan = document.createElement('span');
        textSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
        textSpan.textContent = task.text;
        infoDiv.appendChild(textSpan);

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.textContent = '✏️ 編集';
        editBtn.onclick = () => startEditingTask(task.id);

        const delBtn = document.createElement('button');
        delBtn.className = 'action-btn delete-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = () => deleteTask(task.id);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        headerRow.appendChild(leftDiv);
        headerRow.appendChild(actionsDiv);

        // 明示的な編集ボタンが必要なメモ領域
        const memoArea = document.createElement('div');
        memoArea.className = 'task-memo-area';

        const isEditingThisMemo = (editingMemoTaskId === task.id);

        if (isEditingThisMemo) {
            // 編集モード表示 (入力欄 ＋ 保存・キャンセルボタン)
            const editModeDiv = document.createElement('div');
            editModeDiv.className = 'task-memo-edit-mode';

            const noteTextarea = document.createElement('textarea');
            noteTextarea.placeholder = 'メモを入力 (改行できます)...';
            noteTextarea.value = task.note || '';

            const btnGroup = document.createElement('div');
            btnGroup.className = 'task-memo-btn-group';

            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn-primary';
            saveBtn.textContent = '💾 保存';
            saveBtn.onclick = () => saveTaskNote(task.id, noteTextarea.value);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = 'キャンセル';
            cancelBtn.onclick = () => {
                editingMemoTaskId = null;
                renderTasks();
            };

            btnGroup.appendChild(saveBtn);
            btnGroup.appendChild(cancelBtn);

            editModeDiv.appendChild(noteTextarea);
            editModeDiv.appendChild(btnGroup);
            memoArea.appendChild(editModeDiv);
        } else {
            // 閲覧モード表示 (テキスト表示 ＋ 編集ボタン)
            const viewModeDiv = document.createElement('div');
            viewModeDiv.className = 'task-memo-view-mode';

            if (task.note) {
                const noteDisplay = document.createElement('div');
                noteDisplay.className = 'task-memo-text';
                noteDisplay.textContent = task.note;
                viewModeDiv.appendChild(noteDisplay);

                const editMemoBtn = document.createElement('button');
                editMemoBtn.className = 'task-memo-edit-btn';
                editMemoBtn.textContent = '✏️ メモを編集';
                editMemoBtn.onclick = () => {
                    editingMemoTaskId = task.id;
                    renderTasks();
                };
                viewModeDiv.appendChild(editMemoBtn);
            } else {
                const addMemoBtn = document.createElement('button');
                addMemoBtn.className = 'task-memo-edit-btn';
                addMemoBtn.textContent = '➕ メモを追加';
                addMemoBtn.onclick = () => {
                    editingMemoTaskId = task.id;
                    renderTasks();
                };
                viewModeDiv.appendChild(addMemoBtn);
            }

            memoArea.appendChild(viewModeDiv);
        }

        // ==========================================
// 🌐 オンライン復帰時の自動バックアップ処理
// ==========================================
window.addEventListener('online', async () => {
    console.log("🌐 インターネットに接続されました。クラウドへデータを自動同期します...");
    messageArea.textContent = '🌐 オンラインに復帰しました。データを同期中...';
    
    // オフライン中に溜まったローカルデータをクラウドへ同期
    await saveUserDataToCloud();
    
    setTimeout(() => {
        messageArea.textContent = '☁️ クラウドへデータを同期しました！';
    }, 1500);
});

        li.appendChild(headerRow);
        li.appendChild(memoArea);
        taskList.appendChild(li);
    });
}