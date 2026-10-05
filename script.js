// 30色のくすみパステルカラー定義（6系 × 濃淡5段階）
const pastel30Colors = [
    // レッド・ピンク系
    "#FADBD8", "#F5B7B1", "#F1948A", "#EC7063", "#E74C3C",
    // オレンジ・イエロー系
    "#FDEBD0", "#F8C471", "#F39C12", "#FCF3CF", "#F7DC6F",
    // グリーン系
    "#D4EFDF", "#A9DFBF", "#7DCEA0", "#D5F5E3", "#52BE80",
    // ブルー・アクア系
    "#D4E6F1", "#A9CCE3", "#7FB3D5", "#E8F8F5", "#A3E4D7",
    // パープル・ピンク系
    "#E8DAEF", "#BB8FCE", "#9B59B6", "#FDEDEC", "#F5EEF8",
    // ブラウン・グレー系
    "#E5E8E8", "#CCD1D1", "#BDC3C7", "#EDBB99", "#DC7633"
];

// 日時＆カレンダー用の定数
const times = [
    { period: 1, text: "08:50\n10:20", startMin: 8 * 60 + 50, endMin: 10 * 60 + 20 },
    { period: 2, text: "10:30\n12:00", startMin: 10 * 60 + 30, endMin: 12 * 60 + 0 },
    { period: 3, text: "13:00\n14:30", startMin: 13 * 60 + 0, endMin: 14 * 60 + 30 },
    { period: 4, text: "14:40\n16:10", startMin: 14 * 60 + 40, endMin: 16 * 60 + 10 },
    { period: 5, text: "16:20\n17:50", startMin: 16 * 60 + 20, endMin: 17 * 60 + 50 }
];
const days = ["月", "火", "水", "木", "金"];
const dayMap = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };
const dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

// データ保持
let timetableData = JSON.parse(localStorage.getItem('myTimetable')) || {};
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];
let customCategories = JSON.parse(localStorage.getItem('myCategories')) || ["未分類", "提出物", "買い物"];
let dailySchedules = JSON.parse(localStorage.getItem('myDailySchedules')) || {};
let savedSchedulePresets = JSON.parse(localStorage.getItem('mySchedulePresets')) || [
    { title: "睡眠", color: "#A9CCE3" },
    { title: "仕事", color: "#F8C471" },
    { title: "読書", color: "#A9DFBF" },
    { title: "風呂", color: "#F5B7B1" }
];

let activeCategoryFilter = "すべて";
let editingTaskId = null;
let editingMemoTaskId = null;
let activeCellKey = null;
let selectedColor = "#F38181";
let schedSelectedColor = pastel30Colors[0];
let currentUser = null;

// 1日スケジュールの選択中日付
let selectedSchedDate = new Date().toISOString().split('T')[0];

// 要素取得
const tabScheduleBtn = document.getElementById('tabScheduleBtn');
const tabTimetableBtn = document.getElementById('tabTimetableBtn');
const tabTaskBtn = document.getElementById('tabTaskBtn');
const viewSchedule = document.getElementById('viewSchedule');
const viewTimetable = document.getElementById('viewTimetable');
const viewTask = document.getElementById('viewTask');

// スケジュール要素
const scheduleDateInput = document.getElementById('scheduleDateInput');
const prevDateBtn = document.getElementById('prevDateBtn');
const nextDateBtn = document.getElementById('nextDateBtn');
const scheduleDayOfWeekText = document.getElementById('scheduleDayOfWeekText');
const scheduleCanvas = document.getElementById('scheduleCanvas');
const presetScheduleButtons = document.getElementById('presetScheduleButtons');
const toggleScheduleFormBtn = document.getElementById('toggleScheduleFormBtn');
const scheduleFormContent = document.getElementById('scheduleFormContent');
const toggleScheduleText = document.getElementById('toggleScheduleText');
const toggleScheduleIcon = document.getElementById('toggleScheduleIcon');
const schedTitleInput = document.getElementById('schedTitleInput');
const schedStartTime = document.getElementById('schedStartTime');
const schedEndTime = document.getElementById('schedEndTime');
const schedStartTimeDur = document.getElementById('schedStartTimeDur');
const schedDurationHours = document.getElementById('schedDurationHours');
const schedDurationMinutes = document.getElementById('schedDurationMinutes');
const modeRangeArea = document.getElementById('modeRangeArea');
const modeDurationArea = document.getElementById('modeDurationArea');
const schedRepeatType = document.getElementById('schedRepeatType');
const saveSchedBtn = document.getElementById('saveSchedBtn');
const scheduleList = document.getElementById('scheduleList');
const repeatOptionModalOverlay = document.getElementById('repeatOptionModalOverlay');
const applySingleDayBtn = document.getElementById('applySingleDayBtn');
const applyAllRepeatBtn = document.getElementById('applyAllRepeatBtn');
const cancelRepeatOptionBtn = document.getElementById('cancelRepeatOptionBtn');

// その他の既存要素
const timetableBody = document.getElementById('timetableBody');
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

const listManageModalOverlay = document.getElementById('listManageModalOverlay');
const manageListBtn = document.getElementById('manageListBtn');
const listManageCloseBtn = document.getElementById('listManageCloseBtn');
const newListNameInput = document.getElementById('newListNameInput');
const addNewListBtn = document.getElementById('addNewListBtn');
const customCategoryList = document.getElementById('customCategoryList');

const toggleTaskFormBtn = document.getElementById('toggleTaskFormBtn');
const taskFormContent = document.getElementById('taskFormContent');
const toggleFormIcon = document.getElementById('toggleFormIcon');
const toggleFormText = document.getElementById('toggleFormText');
const addTaskFromBottomBtn = document.getElementById('addTaskFromBottomBtn');
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

// アプリ初期化
window.addEventListener('DOMContentLoaded', () => {
    scheduleDateInput.value = selectedSchedDate;
    init30ColorPicker();
    initDurationSelectOptions();
    renderPresetButtons();
    setupInputModeSwitch();
    updateScheduleView();

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

// オンライン復帰時の同期
window.addEventListener('online', async () => {
    if (messageArea) messageArea.textContent = '🌐 オンラインに復帰しました。同期中...';
    await saveUserDataToCloud();
    setTimeout(() => {
        if (messageArea) messageArea.textContent = '☁️ クラウドへ自動バックアップしました！';
    }, 1500);
});

// 30色カラーパレット初期生成
function init30ColorPicker() {
    const grid = document.getElementById('schedColorPicker');
    grid.innerHTML = '';

    pastel30Colors.forEach((color, idx) => {
        const circle = document.createElement('div');
        circle.className = `color-circle-small ${idx === 0 ? 'active' : ''}`;
        circle.style.backgroundColor = color;
        circle.setAttribute('data-color', color);

        circle.addEventListener('click', () => {
            document.querySelectorAll('.color-circle-small').forEach(c => c.classList.remove('active'));
            circle.classList.add('active');
            schedSelectedColor = color;
        });

        grid.appendChild(circle);
    });
}

// 所要時間セレクトボックス（時間・分）の生成
function initDurationSelectOptions() {
    schedDurationHours.innerHTML = '';
    for (let h = 0; h <= 23; h++) {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        if (h === 1) opt.selected = true;
        schedDurationHours.appendChild(opt);
    }

    schedDurationMinutes.innerHTML = '';
    for (let m = 0; m < 60; m += 5) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        schedDurationMinutes.appendChild(opt);
    }
}

// 入力モード（範囲指定 / 所要時間）切替設定
function setupInputModeSwitch() {
    document.querySelectorAll('input[name="timeInputMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'range') {
                modeRangeArea.style.display = 'flex';
                modeDurationArea.style.display = 'none';
            } else {
                modeRangeArea.style.display = 'none';
                modeDurationArea.style.display = 'flex';
            }
        });
    });
}

// 登録済み・履歴予定のプリセットボタン描画
function renderPresetButtons() {
    presetScheduleButtons.innerHTML = '';
    if (!savedSchedulePresets || savedSchedulePresets.length === 0) {
        presetScheduleButtons.innerHTML = '<span style="font-size:0.8rem; color:#aaa;">まだ履歴がありません</span>';
        return;
    }

    savedSchedulePresets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.style.backgroundColor = preset.color;
        btn.textContent = `＋ ${preset.title}`;

        btn.onclick = () => {
            // 予定名とカラーを自動セットしてフォームを開く
            schedTitleInput.value = preset.title;
            schedSelectedColor = preset.color;

            // カラーパレットの選択状態を更新
            document.querySelectorAll('.color-circle-small').forEach(circle => {
                if (circle.getAttribute('data-color') === preset.color) {
                    circle.classList.add('active');
                } else {
                    circle.classList.remove('active');
                }
            });

            scheduleFormContent.style.display = 'block';
            toggleScheduleIcon.textContent = '▲';
            schedStartTime.focus();
        };

        presetScheduleButtons.appendChild(btn);
    });
}

// 履歴プリセットへの追加・更新
function addOrUpdateSchedulePreset(title, color) {
    if (!title) return;
    const existingIndex = savedSchedulePresets.findIndex(p => p.title === title);

    if (existingIndex >= 0) {
        savedSchedulePresets[existingIndex].color = color; // カラー更新
    } else {
        savedSchedulePresets.unshift({ title, color }); // 先頭に追加
    }

    // 最大15個まで保存
    if (savedSchedulePresets.length > 15) {
        savedSchedulePresets = savedSchedulePresets.slice(0, 15);
    }

    localStorage.setItem('mySchedulePresets', JSON.stringify(savedSchedulePresets));
    renderPresetButtons();
}

// ナビゲーションタブ切り替え
tabScheduleBtn.addEventListener('click', () => { setActiveTab(tabScheduleBtn, viewSchedule); });
tabTimetableBtn.addEventListener('click', () => { setActiveTab(tabTimetableBtn, viewTimetable); });
tabTaskBtn.addEventListener('click', () => { setActiveTab(tabTaskBtn, viewTask); });

function setActiveTab(btn, view) {
    [tabScheduleBtn, tabTimetableBtn, tabTaskBtn].forEach(b => b.classList.remove('active'));
    [viewSchedule, viewTimetable, viewTask].forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    view.classList.add('active');
    if (messageArea) messageArea.textContent = '';
}

// スケジュール日付コントロール
scheduleDateInput.addEventListener('change', (e) => {
    selectedSchedDate = e.target.value;
    updateScheduleView();
});

prevDateBtn.addEventListener('click', () => {
    const d = new Date(selectedSchedDate);
    d.setDate(d.getDate() - 1);
    selectedSchedDate = d.toISOString().split('T')[0];
    scheduleDateInput.value = selectedSchedDate;
    updateScheduleView();
});

nextDateBtn.addEventListener('click', () => {
    const d = new Date(selectedSchedDate);
    d.setDate(d.getDate() + 1);
    selectedSchedDate = d.toISOString().split('T')[0];
    scheduleDateInput.value = selectedSchedDate;
    updateScheduleView();
});

toggleScheduleFormBtn.addEventListener('click', () => {
    const isHidden = scheduleFormContent.style.display === 'none';
    scheduleFormContent.style.display = isHidden ? 'block' : 'none';
    toggleScheduleIcon.textContent = isHidden ? '▲' : '▼';
});

// 1日スケジュールのビュー更新
function updateScheduleView() {
    const d = new Date(selectedSchedDate);
    const dayOfWeek = d.getDay();
    const dayName = dayNames[dayOfWeek];
    scheduleDayOfWeekText.textContent = `${dayName}`;
    schedRepeatType.options[1].textContent = `毎週同じ曜日 (${dayName}) に繰り返す`;

    const items = getScheduleForDate(selectedSchedDate);
    draw24HourChart(items);
    renderScheduleList(items);
}

function getScheduleForDate(dateStr) {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    const dayStrMap = ["日", "月", "火", "水", "木", "金", "土"];
    const currentDayChar = dayStrMap[dayOfWeek];
    const weeklyKey = `weekly_${dayOfWeek}`;

    let baseItems = [];
    if (dailySchedules[dateStr]) {
        baseItems = [...dailySchedules[dateStr]];
    } else if (dailySchedules[weeklyKey]) {
        baseItems = [...dailySchedules[weeklyKey]];
    }

    const classItems = getClassSchedulesForDay(currentDayChar, dateStr);

    const finalItems = [...baseItems];
    classItems.forEach(cItem => {
        const exists = finalItems.some(item => item.id === cItem.id || (item.startMin === cItem.startMin && item.endMin === cItem.endMin));
        if (!exists) {
            finalItems.push(cItem);
        }
    });

    return finalItems;
}

function getClassSchedulesForDay(dayChar, dateStr) {
    if (!days.includes(dayChar)) return [];

    const result = [];
    let previousEndMin = null;

    times.forEach(t => {
        const key = `${dayChar}_${t.period}`;
        const cellData = timetableData[key];

        if (cellData && cellData.subject) {
            if (previousEndMin !== null && t.startMin > previousEndMin) {
                result.push({
                    id: `auto_rest_${dateStr}_${t.period}`,
                    title: '☕ 休憩時間',
                    startMin: previousEndMin,
                    endMin: t.startMin,
                    color: '#E0DACF',
                    isWeekly: false,
                    isAutoClass: true
                });
            }

            result.push({
                id: `auto_class_${dateStr}_${key}`,
                title: `🏫 ${cellData.subject}`,
                startMin: t.startMin,
                endMin: t.endMin,
                color: cellData.color || '#F38181',
                isWeekly: false,
                isAutoClass: true
            });

            previousEndMin = t.endMin;
        }
    });

    return result;
}

// 24時間円グラフ描画（大型化＆各扇形への文字入れ対応）
function draw24HourChart(items) {
    const ctx = scheduleCanvas.getContext('2d');
    const width = scheduleCanvas.width;
    const height = scheduleCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 160; // グラフサイズを拡大

    ctx.clearRect(0, 0, width, height);

    // ベースの円盤
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ece1';
    ctx.fill();

    items.forEach(item => {
        const startAngle = (item.startMin / 1440) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (item.endMin / 1440) * Math.PI * 2 - Math.PI / 2;

        // 扇形描画
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = item.color || '#4A90E2';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 予定テキストを扇形内部に書き込む (15分以上 = 角度0.065rad以上)
        const durationMin = item.endMin - item.startMin;
        if (durationMin >= 15) {
            const midAngle = (startAngle + endAngle) / 2;
            const textRadius = radius * 0.7; // 文字の配置場所
            const textX = centerX + Math.cos(midAngle) * textRadius;
            const textY = centerY + Math.sin(midAngle) * textRadius;

            ctx.save();
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 予定名をカットオフして描画
            let labelText = item.title.replace(/^🏫\s*/, ''); // 🏫アイコンを省略して見やすく
            if (labelText.length > 5 && durationMin < 60) {
                labelText = labelText.substring(0, 4) + '..';
            }
            ctx.fillText(labelText, textX, textY);
            ctx.restore();
        }
    });

    // 24時間の目盛り線と数字
    for (let h = 0; h < 24; h += 3) {
        const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
        const lineX1 = centerX + Math.cos(angle) * (radius - 8);
        const lineY1 = centerY + Math.sin(angle) * (radius - 8);
        const lineX2 = centerX + Math.cos(angle) * radius;
        const lineY2 = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(lineX1, lineY1);
        ctx.lineTo(lineX2, lineY2);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const textX = centerX + Math.cos(angle) * (radius + 15);
        const textY = centerY + Math.sin(angle) * (radius + 15);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${h}`, textX, textY);
    }

    // ドーナツ型の中心円
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e0dacf';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#4a4238';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('24H Schedule', centerX, centerY);
}

function renderScheduleList(items) {
    scheduleList.innerHTML = '';
    if (items.length === 0) {
        scheduleList.innerHTML = '<li style="color:#aaa; border:none; background:none;">予定はありません</li>';
        return;
    }

    const sortedItems = [...items].sort((a, b) => a.startMin - b.startMin);

    sortedItems.forEach(item => {
        const li = document.createElement('li');
        
        const startStr = minToTimeStr(item.startMin);
        const endStr = minToTimeStr(item.endMin);

        const colorBadge = `<span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${item.color}; margin-right:6px;"></span>`;

        li.innerHTML = `
            <div>
                ${colorBadge}<strong>${item.title}</strong>
                <span style="font-size:0.8rem; color:#777; margin-left:8px;">${startStr} - ${endStr}</span>
                ${item.isWeekly ? '<span style="font-size:0.7rem; background:#e8f8f0; color:#27ae60; padding:1px 4px; border-radius:4px; margin-left:6px;">🔄 毎週</span>' : ''}
                ${item.isAutoClass ? '<span style="font-size:0.7rem; background:#f0f7ff; color:#2980b9; padding:1px 4px; border-radius:4px; margin-left:6px;">🏫 時間割自動</span>' : ''}
            </div>
        `;

        const delBtn = document.createElement('button');
        delBtn.className = 'memo-del-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = () => deleteScheduleItem(item);

        li.appendChild(delBtn);
        scheduleList.appendChild(li);
    });
}

function minToTimeStr(min) {
    const h = String(Math.floor((min % 1440) / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
}

function timeStrToMin(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}

// 予定の保存処理（二種類の入力モード対応）
saveSchedBtn.addEventListener('click', async () => {
    const title = schedTitleInput.value.trim();
    const isWeekly = schedRepeatType.value === 'weekly';
    const inputMode = document.querySelector('input[name="timeInputMode"]:checked').value;

    let startMin = 0;
    let endMin = 0;

    if (inputMode === 'range') {
        const startStr = schedStartTime.value;
        const endStr = schedEndTime.value;
        if (!title || !startStr || !endStr) {
            alert('予定名と時間を指定してください。');
            return;
        }
        startMin = timeStrToMin(startStr);
        endMin = timeStrToMin(endStr);
        if (endMin <= startMin) endMin += 1440;
    } else {
        const startStr = schedStartTimeDur.value;
        const durH = parseInt(schedDurationHours.value) || 0;
        const durM = parseInt(schedDurationMinutes.value) || 0;

        if (!title || !startStr) {
            alert('予定名と開始時刻を指定してください。');
            return;
        }
        startMin = timeStrToMin(startStr);
        const totalDurationMin = durH * 60 + durM;
        if (totalDurationMin <= 0) {
            alert('所要時間を1分以上指定してください。');
            return;
        }
        endMin = startMin + totalDurationMin;
    }

    const newItem = {
        id: Date.now(),
        title: title,
        startMin: startMin,
        endMin: endMin,
        color: schedSelectedColor,
        isWeekly: isWeekly
    };

    // 予定履歴（プリセット）へ登録・更新
    addOrUpdateSchedulePreset(title, schedSelectedColor);

    const d = new Date(selectedSchedDate);
    const weeklyKey = `weekly_${d.getDay()}`;

    if (isWeekly) {
        if (!dailySchedules[weeklyKey]) dailySchedules[weeklyKey] = [];
        dailySchedules[weeklyKey].push(newItem);
    } else {
        if (!dailySchedules[selectedSchedDate]) {
            dailySchedules[selectedSchedDate] = [...getScheduleForDate(selectedSchedDate)];
        }
        dailySchedules[selectedSchedDate].push(newItem);
    }

    localStorage.setItem('myDailySchedules', JSON.stringify(dailySchedules));
    await saveUserDataToCloud();

    schedTitleInput.value = '';
    schedStartTime.value = '';
    schedEndTime.value = '';
    schedStartTimeDur.value = '';
    scheduleFormContent.style.display = 'none';
    toggleScheduleIcon.textContent = '▼';

    updateScheduleView();
    if (messageArea) messageArea.textContent = '💾 予定を保存しました！';
});

// 予定削除時の単日/全体選択対応
let targetItemToDelete = null;

function deleteScheduleItem(item) {
    targetItemToDelete = item;

    if (item.isWeekly) {
        repeatOptionModalOverlay.style.display = 'flex';
    } else {
        executeDeleteSchedule(false);
    }
}

applySingleDayBtn.onclick = () => {
    executeDeleteSchedule(true);
    repeatOptionModalOverlay.style.display = 'none';
};

applyAllRepeatBtn.onclick = () => {
    executeDeleteSchedule(false);
    repeatOptionModalOverlay.style.display = 'none';
};

cancelRepeatOptionBtn.onclick = () => {
    targetItemToDelete = null;
    repeatOptionModalOverlay.style.display = 'none';
};

async function executeDeleteSchedule(singleDayOnly) {
    if (!targetItemToDelete) return;

    const d = new Date(selectedSchedDate);
    const weeklyKey = `weekly_${d.getDay()}`;

    if (singleDayOnly) {
        if (!dailySchedules[selectedSchedDate]) {
            dailySchedules[selectedSchedDate] = getScheduleForDate(selectedSchedDate).filter(i => i.id !== targetItemToDelete.id);
        } else {
            dailySchedules[selectedSchedDate] = dailySchedules[selectedSchedDate].filter(i => i.id !== targetItemToDelete.id);
        }
    } else {
        if (dailySchedules[weeklyKey]) {
            dailySchedules[weeklyKey] = dailySchedules[weeklyKey].filter(i => i.id !== targetItemToDelete.id);
        }
        if (dailySchedules[selectedSchedDate]) {
            dailySchedules[selectedSchedDate] = dailySchedules[selectedSchedDate].filter(i => i.id !== targetItemToDelete.id);
        }
    }

    localStorage.setItem('myDailySchedules', JSON.stringify(dailySchedules));
    await saveUserDataToCloud();
    updateScheduleView();
    targetItemToDelete = null;
    if (messageArea) messageArea.textContent = '🗑 予定を削除しました。';
}

// 時間割・タスク管理などの既存処理
function checkAndResetClassTasks() {
    if (!Array.isArray(tasks)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let isUpdated = false;

    tasks = tasks.map(task => {
        if (task.completed && task.repeat && task.repeat.type === 'class_reset' && task.resetDate) {
            if (task.repeat.until && todayStr > task.repeat.until) return task;
            if (todayStr >= task.resetDate) {
                isUpdated = true;
                return { ...task, completed: false, resetDate: null };
            }
        }
        return task;
    });

    if (isUpdated) {
        localStorage.setItem('myTasks', JSON.stringify(tasks));
        saveUserDataToCloud();
    }
}

function getNextClassDate(targetDays) {
    const today = new Date();
    const currentDayNum = today.getDay();
    const targetNums = targetDays.map(d => dayMap[d]).sort((a, b) => a - b);
    
    let daysUntilNext = null;
    for (let targetNum of targetNums) {
        let diff = targetNum - currentDayNum;
        if (diff <= 0) diff += 7;
        if (daysUntilNext === null || diff < daysUntilNext) daysUntilNext = diff;
    }
    if (daysUntilNext === null) daysUntilNext = 7;

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
        logoutBtn.addEventListener('click', () => signOut(auth));
    }
}

async function saveUserDataToCloud() {
    if (!currentUser || !window.firebaseDb) return;
    const { db, doc, setDoc, serverTimestamp } = window.firebaseDb;

    const dataToSave = {
        timetable: JSON.parse(localStorage.getItem('myTimetable')) || {},
        tasks: JSON.parse(localStorage.getItem('myTasks')) || [],
        categories: JSON.parse(localStorage.getItem('myCategories')) || ["未分類", "提出物", "買い物"],
        dailySchedules: JSON.parse(localStorage.getItem('myDailySchedules')) || {},
        schedulePresets: JSON.parse(localStorage.getItem('mySchedulePresets')) || [],
        updatedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, 'users', currentUser.uid), dataToSave, { merge: true });
        console.log("☁️ クラウドへ自動バックアップ完了");
    } catch (error) {
        console.error("クラウドバックアップエラー:", error);
    }
}

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
            if (data.dailySchedules) localStorage.setItem('myDailySchedules', JSON.stringify(data.dailySchedules));
            if (data.schedulePresets) localStorage.setItem('mySchedulePresets', JSON.stringify(data.schedulePresets));

            timetableData = data.timetable || {};
            tasks = data.tasks || [];
            customCategories = data.categories || ["未分類", "提出物", "買い物"];
            dailySchedules = data.dailySchedules || {};
            savedSchedulePresets = data.schedulePresets || [];

            checkAndResetClassTasks();
            renderPresetButtons();
            updateScheduleView();
            renderTimetable();
            updateSubjectSelectOptions();
            renderCategoryFilterTabs();
            updateCategorySelectOptions();
            renderTasks();
            console.log("☁️ クラウドからデータを同期しました");
        }
    } catch (error) {
        console.error("データ同期エラー:", error);
    }
}

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
        if (circle.getAttribute('data-color') === selectedColor) circle.classList.add('active');
        else circle.classList.remove('active');
    });
}

modalCloseBtn.onclick = closeModal;
modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };
function closeModal() { modalOverlay.style.display = 'none'; activeCellKey = null; }

listManageCloseBtn.onclick = () => { listManageModalOverlay.style.display = 'none'; };
manageListBtn.onclick = () => {
    renderCustomCategoryManageList();
    listManageModalOverlay.style.display = 'flex';
};

toggleTaskFormBtn.addEventListener('click', () => { toggleTaskForm(); });
function toggleTaskForm(openState = null) {
    const isCurrentlyHidden = taskFormContent.style.display === 'none';
    const shouldOpen = openState !== null ? openState : isCurrentlyHidden;
    taskFormContent.style.display = shouldOpen ? 'block' : 'none';
    toggleFormIcon.textContent = shouldOpen ? '▲' : '▼';
}

addTaskFromBottomBtn.addEventListener('click', () => {
    resetTaskForm();
    if (activeCategoryFilter !== 'すべて') taskCategorySelect.value = activeCategoryFilter;
    toggleTaskForm(true);
    taskInput.focus();
    window.scrollTo({ top: taskFormContent.offsetTop - 60, behavior: 'smooth' });
});

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

    if (activeCategoryFilter === 'すべて') addTaskFromBottomBtn.textContent = '➕ タスクを新規追加';
    else addTaskFromBottomBtn.textContent = `➕ 「${activeCategoryFilter}」にタスクを追加`;
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
        if (cellData.email) modalTeacherEmail.innerHTML = `✉️ <a href="mailto:${cellData.email}">${cellData.email}</a>`;
        else modalTeacherEmail.textContent = '✉️ メールアドレス未登録';

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
    } else closeModal();
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
        subject, color: selectedColor, teacher, email, room, memos: currentCell.memos || []
    };

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderTimetable();
    updateSubjectSelectOptions();
    updateScheduleView();
    closeModal();
    if (messageArea) messageArea.textContent = '💾 科目を保存しました！';
};

deleteSubjectBtn.onclick = async () => {
    if (confirm('このコマの科目を削除しますか？')) {
        delete timetableData[activeCellKey];
        localStorage.setItem('myTimetable', JSON.stringify(timetableData));
        await saveUserDataToCloud();
        renderTimetable();
        updateSubjectSelectOptions();
        updateScheduleView();
        closeModal();
        if (messageArea) messageArea.textContent = '🗑 コマを削除しました。';
    }
};

addMemoBtn.onclick = async () => {
    const text = memoTextInput.value.trim();
    if (!text) return;

    if (!timetableData[activeCellKey].memos) timetableData[activeCellKey].memos = [];
    const now = new Date();
    const timeStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    timetableData[activeCellKey].memos.unshift({ id: Date.now(), text: text, date: timeStr });
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

hasDueCheckbox.addEventListener('change', (e) => {
    dueDateInputArea.style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) dueDateTimeInput.value = '';
});

repeatTypeSelect.addEventListener('change', (e) => {
    repeatSubArea.style.display = e.target.value === 'none' ? 'none' : 'block';
});

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
        if (messageArea) messageArea.textContent = '⚠ やることを入力してください。';
        return;
    }

    if (hasDue && !dueDateTime) {
        if (messageArea) messageArea.textContent = '⚠ 期限の日時を選択してください。';
        return;
    }

    if (repeatType !== 'none') {
        document.querySelectorAll('.repeat-day-cb:checked').forEach(cb => repeatDays.push(cb.value));
        if (repeatDays.length === 0) {
            if (messageArea) messageArea.textContent = '⚠ 繰り返す曜日を選択してください。';
            return;
        }
        repeatUntil = repeatUntilInput.value;
        if (!repeatUntil) {
            if (messageArea) messageArea.textContent = '⚠ いつまで繰り返すかを選択してください。';
            return;
        }
    }

    if (!Array.isArray(tasks)) tasks = [];

    if (editingTaskId) {
        tasks = tasks.map(t => {
            if (t.id === editingTaskId) {
                return {
                    ...t, text: text, category: selectedCategory, subject: selectedSubject, dueDate: dueDateTime,
                    repeat: { type: repeatType, days: repeatDays, until: repeatUntil }
                };
            }
            return t;
        });
        if (messageArea) messageArea.textContent = '💾 タスクを更新しました！';
        resetTaskForm();
    } else {
        tasks.push({
            id: Date.now(), text: text, category: selectedCategory, subject: selectedSubject, completed: false,
            dueDate: dueDateTime, resetDate: null, note: '',
            repeat: { type: repeatType, days: repeatDays, until: repeatUntil }
        });
        if (messageArea) messageArea.textContent = '💾 タスクを追加しました！';
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

async function saveTaskNote(id, noteText) {
    if (!Array.isArray(tasks)) return;

    tasks = tasks.map(t => {
        if (t.id === id) return { ...t, note: noteText.trim() };
        return t;
    });

    editingMemoTaskId = null;
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

            return { ...task, completed: nextCompletedState, resetDate: nextResetDate };
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

        const memoArea = document.createElement('div');
        memoArea.className = 'task-memo-area';

        const isEditingThisMemo = (editingMemoTaskId === task.id);

        if (isEditingThisMemo) {
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

        li.appendChild(headerRow);
        li.appendChild(memoArea);
        taskList.appendChild(li);
    });
}