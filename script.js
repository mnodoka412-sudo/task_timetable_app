// スケジュール設定
const times = [
    { period: 1, text: "08:50\n10:20" },
    { period: 2, text: "10:30\n12:00" },
    { period: 3, text: "13:00\n14:30" },
    { period: 4, text: "14:40\n16:10" },
    { period: 5, text: "16:20\n17:50" }
];
const days = ["月", "火", "水", "木", "金"];

// データ保持
let timetableData = JSON.parse(localStorage.getItem('myTimetable')) || {};
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// 選択中のコマ保持・選択カラーの初期値
let activeCellKey = null;
let selectedColor = "#F38181";

// 要素取得
const tabTimetableBtn = document.getElementById('tabTimetableBtn');
const tabTaskBtn = document.getElementById('tabTaskBtn');
const viewTimetable = document.getElementById('viewTimetable');
const viewTask = document.getElementById('viewTask');
const timetableBody = document.getElementById('timetableBody');

// モーダル関連要素
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

// カラーサークル要素
const colorCircles = document.querySelectorAll('.color-circle');

// タスク要素
const taskInput = document.getElementById('taskInput');
const subjectSelect = document.getElementById('subjectSelect');
const hasDueCheckbox = document.getElementById('hasDueCheckbox');
const dueDateInputArea = document.getElementById('dueDateInputArea');
const dueDateTimeInput = document.getElementById('dueDateTimeInput');
const repeatTypeSelect = document.getElementById('repeatTypeSelect');
const repeatSubArea = document.getElementById('repeatSubArea');
const repeatUntilInput = document.getElementById('repeatUntilInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const messageArea = document.getElementById('messageArea');
const taskList = document.getElementById('taskList');

// 初期表示処理
window.addEventListener('DOMContentLoaded', () => {
    renderTimetable();
    updateSubjectSelectOptions();
    renderTasks();
    setupColorPicker();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    }
});

// カラーピッカー初期化とクリックハンドラ
function setupColorPicker() {
    colorCircles.forEach(circle => {
        circle.addEventListener('click', () => {
            colorCircles.forEach(c => c.classList.remove('active'));
            circle.classList.add('active');
            selectedColor = circle.getAttribute('data-color');
        });
    });
}

// カラー選択状態の表示反映関数
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

// タブ切り替え処理
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

// モーダル閉じる
modalCloseBtn.onclick = closeModal;
modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
};

function closeModal() {
    modalOverlay.style.display = 'none';
    activeCellKey = null;
}

// 時間割の描画
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
                const cardColor = cellData.color || "#F38181"; // デフォルトピンク

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

// コマタップ時にモーダルを開く
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

// 編集ボタン押下時
modalEditBtn.onclick = () => {
    const cellData = timetableData[activeCellKey] || {};
    const [day, period] = activeCellKey.split('_');
    showEditForm(day, period, cellData.subject || '', cellData.color || "#F38181", cellData.teacher || '', cellData.email || '', cellData.room || '');
};

// 編集フォーム表示の切り替え
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

// 科目データの保存
saveSubjectBtn.onclick = () => {
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
        color: selectedColor, // 選んだカラーを確実に登録
        teacher, email, room,
        memos: currentCell.memos || []
    };

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    renderTimetable();
    updateSubjectSelectOptions();
    closeModal();
    messageArea.textContent = '💾 科目を保存しました！';
};

// 科目コマの削除
deleteSubjectBtn.onclick = () => {
    if (confirm('このコマの科目を削除しますか？')) {
        delete timetableData[activeCellKey];
        localStorage.setItem('myTimetable', JSON.stringify(timetableData));
        renderTimetable();
        updateSubjectSelectOptions();
        closeModal();
        messageArea.textContent = '🗑️ コマを削除しました。';
    }
};

// メモ機能の処理
addMemoBtn.onclick = () => {
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
    renderMemos(timetableData[activeCellKey].memos);
    renderTimetable();
    memoTextInput.value = '';
};

function deleteMemo(memoId) {
    if (!timetableData[activeCellKey] || !timetableData[activeCellKey].memos) return;
    timetableData[activeCellKey].memos = timetableData[activeCellKey].memos.filter(m => m.id !== memoId);
    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
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

// ドロップダウン更新
function updateSubjectSelectOptions() {
    subjectSelect.innerHTML = '<option value="">(科目なし)</option>';
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

// タスク管理機能
hasDueCheckbox.addEventListener('change', (e) => {
    dueDateInputArea.style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) dueDateTimeInput.value = '';
});

repeatTypeSelect.addEventListener('change', (e) => {
    repeatSubArea.style.display = e.target.value === 'none' ? 'none' : 'block';
});

addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
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

    tasks.push({
        id: Date.now(),
        text: text,
        subject: selectedSubject,
        completed: false,
        dueDate: dueDateTime,
        repeat: { type: repeatType, days: repeatDays, until: repeatUntil }
    });

    localStorage.setItem('myTasks', JSON.stringify(tasks));
    renderTasks();

    taskInput.value = '';
    hasDueCheckbox.checked = false;
    dueDateInputArea.style.display = 'none';
    dueDateTimeInput.value = '';
    repeatTypeSelect.value = 'none';
    repeatSubArea.style.display = 'none';
    document.querySelectorAll('.repeat-day-cb').forEach(cb => cb.checked = false);
    repeatUntilInput.value = '';

    messageArea.textContent = '💾 タスクを追加しました！';
});

function toggleTask(id) {
    if (!Array.isArray(tasks)) return;
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    renderTasks();
}

function deleteTask(id) {
    if (!Array.isArray(tasks)) return;
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('myTasks', JSON.stringify(tasks));
    renderTasks();
}

function formatDueDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return `⏰ ${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

function formatRepeatInfo(repeat) {
    if (!repeat || repeat.type === 'none') return '';
    const typeText = repeat.type === 'weekly' ? '毎週' : '隔週';
    const untilText = repeat.until ? ` ~${new Date(repeat.until).getMonth()+1}/${new Date(repeat.until).getDate()}` : '';
    return `🔄 ${typeText}(${repeat.days.join(',')})${untilText}`;
}

function renderTasks() {
    taskList.innerHTML = '';
    if (!Array.isArray(tasks) || tasks.length === 0) {
        taskList.innerHTML = '<li style="color:#aaa; border:none;">タスクはありません</li>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        const leftDiv = document.createElement('div');
        leftDiv.className = 'task-left';

        const checkbox = document.createElement('div');
        checkbox.className = `custom-checkbox ${task.completed ? 'checked' : ''}`;
        checkbox.onclick = () => toggleTask(task.id);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'task-tags';

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
            repeatTag.textContent = formatRepeatInfo(task.repeat);
            tagsDiv.appendChild(repeatTag);
        }

        if (tagsDiv.children.length > 0) infoDiv.appendChild(tagsDiv);

        const textSpan = document.createElement('span');
        textSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
        textSpan.textContent = task.text;
        infoDiv.appendChild(textSpan);

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(infoDiv);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = () => deleteTask(task.id);

        li.appendChild(leftDiv);
        li.appendChild(delBtn);
        taskList.appendChild(li);
    });
}