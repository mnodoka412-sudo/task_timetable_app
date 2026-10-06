// 30色のくすみパステルカラー（スケジュール・登録用）
const pastel30Colors = [
    "#FADBD8", "#F5B7B1", "#F1948A", "#EC7063", "#E74C3C",
    "#FDEBD0", "#F8C471", "#F39C12", "#FCF3CF", "#F7DC6F",
    "#D4EFDF", "#A9DFBF", "#7DCEA0", "#D5F5E3", "#52BE80",
    "#D4E6F1", "#A9CCE3", "#7FB3D5", "#E8F8F5", "#A3E4D7",
    "#E8DAEF", "#BB8FCE", "#9B59B6", "#FDEDEC", "#F5EEF8",
    "#E5E8E8", "#CCD1D1", "#BDC3C7", "#EDBB99", "#DC7633"
];

// 時間割科目用 厳選15カラーパレット
const pastel15ModalColors = [
    "#F38181", "#FCE38A", "#EAFFD0", "#95E1D3", "#A9CCE3",
    "#F8C471", "#A9DFBF", "#BB8FCE", "#F5B7B1", "#7DCEA0",
    "#F1948A", "#FCF3CF", "#A3E4D7", "#BDC3C7", "#EDBB99"
];

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

// 祝日データ (簡易定義)
const japaneseHolidays = {
    "2026-01-01": "元旦", "2026-01-12": "成人の日", "2026-02-11": "建国記念の日",
    "2026-02-23": "天皇誕生日", "2026-03-20": "春分の日", "2026-04-29": "昭和の日",
    "2026-05-03": "憲法記念日", "2026-05-04": "みどりの日", "2026-05-05": "こどもの日",
    "2026-07-20": "海の日", "2026-08-11": "山の日", "2026-09-21": "敬老の日",
    "2026-09-23": "秋分の日", "2026-10-12": "スポーツの日", "2026-11-03": "文化の日",
    "2026-11-23": "勤労感謝の日"
};

const monthNamesEnglish = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// データ保持
let timetableData = JSON.parse(localStorage.getItem('myTimetable')) || {};
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];
let customCategories = JSON.parse(localStorage.getItem('myCategories')) || ["未分類", "提出物", "買い物"];
let customFocusSubjects = JSON.parse(localStorage.getItem('myCustomFocusSubjects')) || [];
let dailySchedules = JSON.parse(localStorage.getItem('myDailySchedules')) || {};
let savedSchedulePresets = JSON.parse(localStorage.getItem('mySchedulePresets')) || [
    { title: "睡眠", color: "#A9CCE3" },
    { title: "仕事", color: "#F8C471" },
    { title: "読書", color: "#A9DFBF" },
    { title: "風呂", color: "#F5B7B1" }
];
let focusLogs = JSON.parse(localStorage.getItem('myFocusLogs')) || [];
let externalIcalUrl = localStorage.getItem('myExternalIcalUrl') || "";
let fetchedIcalEvents = [];

let activeCategoryFilter = "すべて";
let editingTaskId = null;
let editingMemoTaskId = null;
let editingSchedItemId = null;
let activeCellKey = null;
let selectedColor = pastel15ModalColors[0];
let schedSelectedColor = pastel30Colors[0];
let currentUser = null;

// 今日の現在日付を取得
function getTodayIsoString() {
    return new Date().toISOString().split('T')[0];
}

let selectedSchedDate = getTodayIsoString();
let currentViewYear = new Date().getFullYear();
let currentViewMonth = new Date().getMonth();

// タイマー状態変数
let timerInterval = null;
let timerSeconds = 25 * 60;
let initialTargetSeconds = 25 * 60;
let timerStartTime = null;
let isTimerRunning = false;
let timerMode = 'pomodoro';
let pomodoroPhase = 'work';
let pomodoroCycleCount = 1;
let timerElapsedSeconds = 0;

let weeklyChartInstance = null;
let categoryChartInstance = null;

// 要素参照
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

const currentScheduleText = document.getElementById('currentScheduleText');
const nextScheduleText = document.getElementById('nextScheduleText');
const dueThisWeekTaskList = document.getElementById('dueThisWeekTaskList');
const todayAttendanceContainer = document.getElementById('todayAttendanceContainer');

// カレンダー新機能参照
const cuteMonthTitle = document.getElementById('cuteMonthTitle');
const monthPrevBtn = document.getElementById('monthPrevBtn');
const monthNextBtn = document.getElementById('monthNextBtn');
const cuteCalendarDaysGrid = document.getElementById('cuteCalendarDaysGrid');
const externalIcalUrlInput = document.getElementById('externalIcalUrlInput');
const saveIcalUrlBtn = document.getElementById('saveIcalUrlBtn');
const icalStatusText = document.getElementById('icalStatusText');
const dayDetailModalOverlay = document.getElementById('dayDetailModalOverlay');
const dayDetailCloseBtn = document.getElementById('dayDetailCloseBtn');
const dayDetailTitle = document.getElementById('dayDetailTitle');
const dayDetailContentList = document.getElementById('dayDetailContentList');
const goToSchedulePageBtn = document.getElementById('goToSchedulePageBtn');

const scheduleDateInput = document.getElementById('scheduleDateInput');
const prevDateBtn = document.getElementById('prevDateBtn');
const nextDateBtn = document.getElementById('nextDateBtn');
const scheduleDayOfWeekText = document.getElementById('scheduleDayOfWeekText');
const scheduleCanvas = document.getElementById('scheduleCanvas');
const scheduleOverlayLabels = document.getElementById('scheduleOverlayLabels');
const presetScheduleButtons = document.getElementById('presetScheduleButtons');

// 予定追加/編集モーダル＆FAB要素
const addSchedFabBtn = document.getElementById('addSchedFabBtn');
const schedModalOverlay = document.getElementById('schedModalOverlay');
const schedModalCloseBtn = document.getElementById('schedModalCloseBtn');
const schedFormHeading = document.getElementById('schedFormHeading');
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
const cancelSchedEditBtn = document.getElementById('cancelSchedEditBtn');
const scheduleList = document.getElementById('scheduleList');
const repeatOptionModalOverlay = document.getElementById('repeatOptionModalOverlay');
const applySingleDayBtn = document.getElementById('applySingleDayBtn');
const applyAllRepeatBtn = document.getElementById('applyAllRepeatBtn');
const cancelRepeatOptionBtn = document.getElementById('cancelRepeatOptionBtn');

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

const countPresent = document.getElementById('countPresent');
const countLate = document.getElementById('countLate');
const countAbsent = document.getElementById('countAbsent');
const countCancel = document.getElementById('countCancel');
const manualAttDateInput = document.getElementById('manualAttDateInput');
const manualAttStatusSelect = document.getElementById('manualAttStatusSelect');
const saveManualAttBtn = document.getElementById('saveManualAttBtn');
const attendanceHistoryList = document.getElementById('attendanceHistoryList');

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

const focusTargetSelect = document.getElementById('focusTargetSelect');
const customSubjectInputArea = document.getElementById('customSubjectInputArea');
const customSubjectInput = document.getElementById('customSubjectInput');
const saveCustomSubjectBtn = document.getElementById('saveCustomSubjectBtn');
const pomodoroInfoArea = document.getElementById('pomodoroInfoArea');
const countdownSettingsArea = document.getElementById('countdownSettingsArea');
const countdownCustomMinutes = document.getElementById('countdownCustomMinutes');
const pomodoroPhaseBadge = document.getElementById('pomodoroPhaseBadge');
const timerDisplayBox = document.getElementById('timerDisplayBox');
const timerClockText = document.getElementById('timerClockText');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');

// アプリ初期化
window.addEventListener('DOMContentLoaded', () => {
    selectedSchedDate = getTodayIsoString();
    scheduleDateInput.value = selectedSchedDate;
    manualAttDateInput.value = selectedSchedDate;
    
    setupSidebarEvents();
    init30ColorPicker();
    initModal15ColorPicker();
    initDurationSelectOptions();
    renderPresetButtons();
    setupInputModeSwitch();

    checkAndResetClassTasks();
    renderTimetable();
    updateSubjectSelectOptions();
    renderCategoryFilterTabs();
    updateCategorySelectOptions();
    renderTasks();
    setupAuthListeners();
    setupFocusTimerEvents();

    setupCuteCalendarEvents();
    if (externalIcalUrl) {
        externalIcalUrlInput.value = externalIcalUrl;
        fetchAndParseIcal(externalIcalUrl);
    }
    renderCuteCalendar(currentViewYear, currentViewMonth);

    scheduleCanvas.addEventListener('click', handleCanvasClick);
    setupSchedModalEvents();
    updateDashboard();

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

function setupSidebarEvents() {
    openSidebarBtn.onclick = () => {
        sidebar.classList.add('open');
        sidebarOverlay.style.display = 'block';
    };

    closeSidebarBtn.onclick = closeSidebar;
    sidebarOverlay.onclick = closeSidebar;

    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            document.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
            const targetSec = document.getElementById(targetId);
            if (targetSec) targetSec.classList.add('active');

            if (targetId === 'viewHome') updateDashboard();
            if (targetId === 'viewMonthCalendar') renderCuteCalendar(currentViewYear, currentViewMonth);
            if (targetId === 'viewSchedule') {
                selectedSchedDate = getTodayIsoString();
                scheduleDateInput.value = selectedSchedDate;
                updateScheduleView();
            }
            if (targetId === 'viewFocus') {
                updateFocusTargetOptions();
                renderFocusCharts();
            }

            closeSidebar();
        });
    });
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
}

// 🌸 かわいい月間カレンダー制御ロジック
function setupCuteCalendarEvents() {
    monthPrevBtn.onclick = () => {
        currentViewMonth--;
        if (currentViewMonth < 0) {
            currentViewMonth = 11;
            currentViewYear--;
        }
        renderCuteCalendar(currentViewYear, currentViewMonth);
    };

    monthNextBtn.onclick = () => {
        currentViewMonth++;
        if (currentViewMonth > 11) {
            currentViewMonth = 0;
            currentViewYear++;
        }
        renderCuteCalendar(currentViewYear, currentViewMonth);
    };

    saveIcalUrlBtn.onclick = () => {
        const url = externalIcalUrlInput.value.trim();
        if (!url) return;
        externalIcalUrl = url;
        localStorage.setItem('myExternalIcalUrl', externalIcalUrl);
        fetchAndParseIcal(url);
    };

    dayDetailCloseBtn.onclick = () => dayDetailModalOverlay.style.display = 'none';
}

function renderCuteCalendar(year, month) {
    cuteMonthTitle.textContent = monthNamesEnglish[month];
    cuteCalendarDaysGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const todayIso = getTodayIsoString();

    // 前月の日付埋め
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const cell = createCuteDayCell(dayNum, true, year, month - 1, todayIso);
        cuteCalendarDaysGrid.appendChild(cell);
    }

    // 当月の日付
    for (let day = 1; day <= totalDays; day++) {
        const cell = createCuteDayCell(day, false, year, month, todayIso);
        cuteCalendarDaysGrid.appendChild(cell);
    }

    // 翌月の日付埋め
    const totalCells = startingDayOfWeek + totalDays;
    const remainingCells = (42 - totalCells) % 7;
    for (let day = 1; day <= remainingCells; day++) {
        const cell = createCuteDayCell(day, true, year, month + 1, todayIso);
        cuteCalendarDaysGrid.appendChild(cell);
    }
}

function createCuteDayCell(dayNum, isOtherMonth, year, month, todayIso) {
    const targetDate = new Date(year, month, dayNum);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateIso = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = targetDate.getDay();

    const cell = document.createElement('div');
    cell.className = `cute-day-cell ${isOtherMonth ? 'other-month' : ''}`;
    if (dayOfWeek === 0) cell.classList.add('sun');
    if (dayOfWeek === 6) cell.classList.add('sat');
    if (dateIso === todayIso) cell.classList.add('today');

    const numSpan = document.createElement('span');
    numSpan.className = 'cute-day-number';
    numSpan.textContent = dayNum;
    cell.appendChild(numSpan);

    // 祝日チェック
    if (japaneseHolidays[dateIso]) {
        const holidaySpan = document.createElement('span');
        holidaySpan.className = 'cute-holiday-label';
        holidaySpan.textContent = japaneseHolidays[dateIso];
        cell.appendChild(holidaySpan);
    }

    // 予定ドットマーカー
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'cute-events-dots';

    const schedItems = getScheduleForDate(dateIso);
    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateIso) && !t.completed);
    const dayIcalEvents = fetchedIcalEvents.filter(e => e.date === dateIso);

    if (schedItems.length > 0) {
        const dot = document.createElement('div');
        dot.className = 'cute-event-dot';
        dotsContainer.appendChild(dot);
    }
    if (dayTasks.length > 0) {
        const dot = document.createElement('div');
        dot.className = 'cute-event-dot task-dot';
        dotsContainer.appendChild(dot);
    }
    if (dayIcalEvents.length > 0) {
        const dot = document.createElement('div');
        dot.className = 'cute-event-dot ical-dot';
        dotsContainer.appendChild(dot);
    }

    cell.appendChild(dotsContainer);

    cell.onclick = () => openDayDetailModal(dateIso, schedItems, dayTasks, dayIcalEvents);

    return cell;
}

function openDayDetailModal(dateIso, schedItems, dayTasks, dayIcalEvents) {
    dayDetailTitle.textContent = `${dateIso} の予定一覧`;
    dayDetailContentList.innerHTML = '';

    if (schedItems.length === 0 && dayTasks.length === 0 && dayIcalEvents.length === 0) {
        dayDetailContentList.innerHTML = '<li style="color:#aaa; border:none; background:none;">予定やタスクはありません</li>';
    } else {
        schedItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<div>🕐 <strong>${item.title}</strong> (${minToTimeStr(item.startMin)} - ${minToTimeStr(item.endMin)})</div>`;
            dayDetailContentList.appendChild(li);
        });

        dayTasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `<div>📝 <strong>[タスク] ${task.text}</strong></div>`;
            dayDetailContentList.appendChild(li);
        });

        dayIcalEvents.forEach(evt => {
            const li = document.createElement('li');
            li.innerHTML = `<div>📅 <strong>[外部] ${evt.summary}</strong></div>`;
            dayDetailContentList.appendChild(li);
        });
    }

    goToSchedulePageBtn.onclick = () => {
        selectedSchedDate = dateIso;
        scheduleDateInput.value = selectedSchedDate;
        updateScheduleView();
        dayDetailModalOverlay.style.display = 'none';

        document.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-target="viewSchedule"]').classList.add('active');
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById('viewSchedule').classList.add('active');
    };

    dayDetailModalOverlay.style.display = 'flex';
}

async function fetchAndParseIcal(url) {
    icalStatusText.textContent = '⏳ 外部カレンダーを同期中...';
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        const text = await res.text();

        fetchedIcalEvents = [];
        const lines = text.split(/\r\n|\n/);
        let inEvent = false;
        let currentSummary = '';
        let currentDate = '';

        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) {
                inEvent = true;
                currentSummary = '';
                currentDate = '';
            } else if (line.startsWith('END:VEVENT')) {
                if (inEvent && currentDate && currentSummary) {
                    fetchedIcalEvents.push({ date: currentDate, summary: currentSummary });
                }
                inEvent = false;
            } else if (inEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentSummary = line.replace('SUMMARY:', '').trim();
                } else if (line.startsWith('DTSTART')) {
                    const match = line.match(/\:(\d{4})(\d{2})(\d{2})/);
                    if (match) {
                        currentDate = `${match[1]}-${match[2]}-${match[3]}`;
                    }
                }
            }
        });

        icalStatusText.textContent = `✅ 外部カレンダーから ${fetchedIcalEvents.length} 件の予定を同期しました！`;
        renderCuteCalendar(currentViewYear, currentViewMonth);
        renderGoogleCalendarListDashboard();
    } catch (e) {
        console.error(e);
        icalStatusText.textContent = '⚠ 連携に失敗しました。URLまたはCORS設定をご確認ください。';
    }
}

function renderGoogleCalendarListDashboard() {
    const listEl = document.getElementById('googleCalendarList');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (fetchedIcalEvents.length === 0) {
        listEl.innerHTML = '<li style="color:#aaa; border:none; background:none;">同期された外部カレンダーの予定はありません</li>';
        return;
    }

    const todayIso = getTodayIsoString();
    const upcoming = fetchedIcalEvents.filter(e => e.date >= todayIso).slice(0, 5);

    upcoming.forEach(e => {
        const li = document.createElement('li');
        li.innerHTML = `<div>📅 <strong>${e.summary}</strong> (${e.date})</div>`;
        listEl.appendChild(li);
    });
}

function updateDashboard() {
    const todayStr = getTodayIsoString();
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const todayItems = getScheduleForDate(todayStr).sort((a, b) => a.startMin - b.startMin);

    let currentItem = null;
    let nextItem = null;

    for (let item of todayItems) {
        if (currentMin >= item.startMin && currentMin < item.endMin) {
            currentItem = item;
        } else if (currentMin < item.startMin && !nextItem) {
            nextItem = item;
        }
    }

    if (currentItem) {
        currentScheduleText.innerHTML = `<span style="color:#27ae60;">●</span> <strong>${currentItem.title}</strong> (${minToTimeStr(currentItem.startMin)} - ${minToTimeStr(currentItem.endMin)})`;
    } else {
        currentScheduleText.innerHTML = `<span style="color:#aaa;">現在進行中の予定はありません</span>`;
    }

    if (nextItem) {
        nextScheduleText.innerHTML = `⏳ <strong>${nextItem.title}</strong> (${minToTimeStr(nextItem.startMin)} 〜)`;
    } else {
        nextScheduleText.innerHTML = `<span style="color:#aaa;">本日これ以降の予定はありません</span>`;
    }

    renderDueThisWeekTasks();
    renderTodayAttendanceCard();
}

function renderTodayAttendanceCard() {
    todayAttendanceContainer.innerHTML = '';
    const now = new Date();
    const dayStrMap = ["日", "月", "火", "水", "木", "金", "土"];
    const todayChar = dayStrMap[now.getDay()];
    const todayIsoStr = getTodayIsoString();

    if (!days.includes(todayChar)) {
        todayAttendanceContainer.innerHTML = '<p style="font-size:0.85rem; color:#888; margin:0;">本日は休校日（土日）です。</p>';
        return;
    }

    const todayClasses = times.map(t => {
        const key = `${todayChar}_${t.period}`;
        const cellData = timetableData[key];
        return cellData && cellData.subject ? { key, period: t.period, subject: cellData.subject, cellData } : null;
    }).filter(Boolean);

    if (todayClasses.length === 0) {
        todayAttendanceContainer.innerHTML = '<p style="font-size:0.85rem; color:#888; margin:0;">本日の時間割授業はありません。</p>';
        return;
    }

    todayClasses.forEach(item => {
        const history = item.cellData.attendance || {};
        const currentStatus = history[todayIsoStr] || null;

        const card = document.createElement('div');
        card.className = 'today-att-card';

        const info = document.createElement('div');
        info.innerHTML = `<strong>${item.period}限: ${item.subject}</strong>`;

        const btnsGroup = document.createElement('div');
        btnsGroup.className = 'today-att-btns';

        const statuses = [
            { text: '出席', color: '#27ae60' },
            { text: '遅刻', color: '#f39c12' },
            { text: '欠席', color: '#e74c3c' },
            { text: '休講', color: '#7f8c8d' }
        ];

        statuses.forEach(st => {
            const btn = document.createElement('button');
            btn.className = `today-att-btn ${currentStatus === st.text ? 'active' : ''}`;
            btn.style.backgroundColor = currentStatus === st.text ? st.color : '#f0ece1';
            btn.style.color = currentStatus === st.text ? '#ffffff' : '#555555';
            btn.textContent = st.text;

            btn.onclick = () => saveAttendanceStatus(item.key, todayIsoStr, st.text);
            btnsGroup.appendChild(btn);
        });

        card.appendChild(info);
        card.appendChild(btnsGroup);
        todayAttendanceContainer.appendChild(card);
    });
}

async function saveAttendanceStatus(cellKey, dateStr, statusStr) {
    if (!timetableData[cellKey]) return;
    if (!timetableData[cellKey].attendance) timetableData[cellKey].attendance = {};

    if (timetableData[cellKey].attendance[dateStr] === statusStr) {
        delete timetableData[cellKey].attendance[dateStr];
    } else {
        timetableData[cellKey].attendance[dateStr] = statusStr;
    }

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderTodayAttendanceCard();
    if (activeCellKey === cellKey) updateAttendanceModalView();
    if (messageArea) messageArea.textContent = '💾 出欠状況を保存しました！';
}

function renderDueThisWeekTasks() {
    dueThisWeekTaskList.innerHTML = '';
    if (!Array.isArray(tasks) || tasks.length === 0) {
        dueThisWeekTaskList.innerHTML = '<li style="color:#aaa; border:none;">今週期限のタスクはありません</li>';
        return;
    }

    const now = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + 7);

    const dueTasks = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= endOfWeek;
    });

    if (dueTasks.length === 0) {
        dueThisWeekTaskList.innerHTML = '<li style="color:#aaa; border:none;">今週期限のタスクはありません</li>';
        return;
    }

    dueTasks.forEach(task => {
        const li = document.createElement('li');
        li.style.borderBottom = '1px solid #eae5db';
        li.style.padding = '8px 0';

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div>
                    <span class="due-tag">${formatDueDate(task.dueDate)}</span>
                    <strong style="font-size:0.92rem; margin-left:6px;">${task.text}</strong>
                </div>
                <button class="btn-secondary" style="font-size:0.75rem; padding:2px 6px;" onclick="toggleTask(${task.id})">完了にする</button>
            </div>
        `;
        dueThisWeekTaskList.appendChild(li);
    });
}

function init30ColorPicker() {
    const grid = document.getElementById('schedColorPicker');
    grid.innerHTML = '';

    pastel30Colors.forEach((color, idx) => {
        const circle = document.createElement('div');
        circle.className = `color-circle-small ${idx === 0 ? 'active' : ''}`;
        circle.style.backgroundColor = color;
        circle.setAttribute('data-color', color);

        circle.addEventListener('click', () => {
            document.querySelectorAll('#schedColorPicker .color-circle-small').forEach(c => c.classList.remove('active'));
            circle.classList.add('active');
            schedSelectedColor = color;
        });

        grid.appendChild(circle);
    });
}

function initModal15ColorPicker() {
    const grid = document.getElementById('modal15ColorPicker');
    if (!grid) return;
    grid.innerHTML = '';

    pastel15ModalColors.forEach((color, idx) => {
        const circle = document.createElement('div');
        circle.className = `color-circle-small ${idx === 0 ? 'active' : ''}`;
        circle.style.backgroundColor = color;
        circle.setAttribute('data-color', color);

        circle.addEventListener('click', () => {
            document.querySelectorAll('#modal15ColorPicker .color-circle-small').forEach(c => c.classList.remove('active'));
            circle.classList.add('active');
            selectedColor = color;
        });

        grid.appendChild(circle);
    });
}

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
            schedTitleInput.value = preset.title;
            schedSelectedColor = preset.color;

            document.querySelectorAll('#schedColorPicker .color-circle-small').forEach(circle => {
                if (circle.getAttribute('data-color') === preset.color) {
                    circle.classList.add('active');
                } else {
                    circle.classList.remove('active');
                }
            });

            openSchedModal();
            schedStartTime.focus();
        };

        presetScheduleButtons.appendChild(btn);
    });
}

function addOrUpdateSchedulePreset(title, color) {
    if (!title) return;
    const existingIndex = savedSchedulePresets.findIndex(p => p.title === title);

    if (existingIndex >= 0) {
        savedSchedulePresets[existingIndex].color = color;
    } else {
        savedSchedulePresets.unshift({ title, color });
    }

    if (savedSchedulePresets.length > 15) {
        savedSchedulePresets = savedSchedulePresets.slice(0, 15);
    }

    localStorage.setItem('mySchedulePresets', JSON.stringify(savedSchedulePresets));
    renderPresetButtons();
}

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

function setupSchedModalEvents() {
    if (addSchedFabBtn) {
        addSchedFabBtn.onclick = () => {
            resetSchedForm();
            openSchedModal();
        };
    }

    if (schedModalCloseBtn) {
        schedModalCloseBtn.onclick = closeSchedModal;
    }

    if (schedModalOverlay) {
        schedModalOverlay.onclick = (e) => {
            if (e.target === schedModalOverlay) closeSchedModal();
        };
    }

    if (cancelSchedEditBtn) {
        cancelSchedEditBtn.onclick = closeSchedModal;
    }
}

function openSchedModal() {
    schedModalOverlay.style.display = 'flex';
}

function closeSchedModal() {
    schedModalOverlay.style.display = 'none';
    resetSchedForm();
}

function resetSchedForm() {
    editingSchedItemId = null;
    schedFormHeading.textContent = '➕ 予定の登録';
    saveSchedBtn.textContent = '💾 予定を保存';

    schedTitleInput.value = '';
    schedStartTime.value = '';
    schedEndTime.value = '';
    schedStartTimeDur.value = '';
}

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

function handleCanvasClick(e) {
    const rect = scheduleCanvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    const x = e.clientX - rect.left - (cssWidth / 2);
    const y = e.clientY - rect.top - (cssHeight / 2);

    const radius = Math.sqrt(x * x + y * y);
    // グラフ半径 (142/320)
    const chartRadius = cssWidth * (142 / 320);

    if (radius < chartRadius * 0.4 || radius > chartRadius) return;

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const clickedMin = Math.floor((angle / (Math.PI * 2)) * 1440);

    const items = getScheduleForDate(selectedSchedDate);
    const clickedItem = items.find(item => clickedMin >= item.startMin && clickedMin < item.endMin);

    if (clickedItem) {
        startEditingSchedItem(clickedItem);
    } else {
        let nextStart = 1440;
        items.forEach(item => {
            if (item.startMin > clickedMin && item.startMin < nextStart) {
                nextStart = item.startMin;
            }
        });

        resetSchedForm();
        schedStartTime.value = minToTimeStr(clickedMin);
        schedEndTime.value = minToTimeStr(nextStart);
        schedStartTimeDur.value = minToTimeStr(clickedMin);

        openSchedModal();
        schedTitleInput.focus();
    }
}

function startEditingSchedItem(item) {
    editingSchedItemId = item.id;
    schedFormHeading.textContent = '✏️ 予定の編集';
    saveSchedBtn.textContent = '💾 変更を保存';

    schedTitleInput.value = item.title.replace(/^🏫\s*/, '');
    schedStartTime.value = minToTimeStr(item.startMin);
    schedEndTime.value = minToTimeStr(item.endMin);
    schedStartTimeDur.value = minToTimeStr(item.startMin);
    schedSelectedColor = item.color || pastel30Colors[0];

    document.querySelectorAll('#schedColorPicker .color-circle-small').forEach(circle => {
        if (circle.getAttribute('data-color') === schedSelectedColor) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });

    openSchedModal();
}

function draw24HourChart(items) {
    const ctx = scheduleCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // 基準描画領域（余白を最小化して円を最大化）
    const baseWidth = 320;
    const baseHeight = 320;

    scheduleCanvas.width = baseWidth * dpr;
    scheduleCanvas.height = baseHeight * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = baseWidth / 2;
    const centerY = baseHeight / 2;
    // 半径をギリギリ（142px）まで拡大し、カード枠いっぱいに表示
    const radius = 142;

    ctx.clearRect(0, 0, baseWidth, baseHeight);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ece1';
    ctx.fill();

    items.forEach(item => {
        const startAngle = (item.startMin / 1440) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (item.endMin / 1440) * Math.PI * 2 - Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = item.color || '#4A90E2';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    for (let h = 0; h < 24; h += 3) {
        const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
        const lineX1 = centerX + Math.cos(angle) * (radius - 6);
        const lineY1 = centerY + Math.sin(angle) * (radius - 6);
        const lineX2 = centerX + Math.cos(angle) * radius;
        const lineY2 = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(lineX1, lineY1);
        ctx.lineTo(lineX2, lineY2);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 時刻表示文字を小さく（9px）し、外周すぐ内側・枠ギリギリに配置
        const textX = centerX + Math.cos(angle) * (radius + 10);
        const textY = centerY + Math.sin(angle) * (radius + 10);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${h}`, textX, textY);
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e0dacf';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    renderOverlayLabelsHTML(items, centerX, centerY, radius);
}

function renderOverlayLabelsHTML(items, centerX, centerY, radius) {
    scheduleOverlayLabels.innerHTML = '';

    items.forEach(item => {
        const durationMin = item.endMin - item.startMin;
        if (durationMin < 12) return;

        const startAngle = (item.startMin / 1440) * Math.PI * 2 - Math.PI / 2;
        const endAngle = (item.endMin / 1440) * Math.PI * 2 - Math.PI / 2;
        const midAngle = (startAngle + endAngle) / 2;

        const textRadius = radius * 0.7;
        const textX = centerX + Math.cos(midAngle) * textRadius;
        const textY = centerY + Math.sin(midAngle) * textRadius;

        let labelText = item.title.replace(/^🏫\s*/, '');

        if (durationMin < 45) {
            if (labelText.includes('休憩')) labelText = '☕';
            else if (labelText.length > 3) labelText = labelText.substring(0, 2) + '..';
        } else if (labelText.length > 6 && durationMin < 90) {
            labelText = labelText.substring(0, 5) + '..';
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'chart-label-item';
        labelDiv.style.left = `${textX}px`;
        labelDiv.style.top = `${textY}px`;
        labelDiv.textContent = labelText;

        scheduleOverlayLabels.appendChild(labelDiv);
    });
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

        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';
        actionDiv.style.gap = '4px';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.textContent = '✏️ 編集';
        editBtn.onclick = () => startEditingSchedItem(item);

        const delBtn = document.createElement('button');
        delBtn.className = 'action-btn delete-btn';
        delBtn.textContent = '✖ 削除';
        delBtn.onclick = () => deleteScheduleItem(item);

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(delBtn);

        li.appendChild(actionDiv);
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
        id: editingSchedItemId || Date.now(),
        title: title,
        startMin: startMin,
        endMin: endMin,
        color: schedSelectedColor,
        isWeekly: isWeekly
    };

    addOrUpdateSchedulePreset(title, schedSelectedColor);

    const d = new Date(selectedSchedDate);
    const weeklyKey = `weekly_${d.getDay()}`;

    if (editingSchedItemId) {
        if (dailySchedules[selectedSchedDate]) {
            dailySchedules[selectedSchedDate] = dailySchedules[selectedSchedDate].map(i => i.id === editingSchedItemId ? newItem : i);
        }
        if (dailySchedules[weeklyKey]) {
            dailySchedules[weeklyKey] = dailySchedules[weeklyKey].map(i => i.id === editingSchedItemId ? newItem : i);
        }
    } else {
        if (isWeekly) {
            if (!dailySchedules[weeklyKey]) dailySchedules[weeklyKey] = [];
            dailySchedules[weeklyKey].push(newItem);
        } else {
            if (!dailySchedules[selectedSchedDate]) {
                dailySchedules[selectedSchedDate] = [...getScheduleForDate(selectedSchedDate)];
            }
            dailySchedules[selectedSchedDate].push(newItem);
        }
    }

    localStorage.setItem('myDailySchedules', JSON.stringify(dailySchedules));
    await saveUserDataToCloud();

    closeSchedModal();
    updateScheduleView();
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
    if (messageArea) messageArea.textContent = '💾 予定を保存しました！';
});

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
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
    targetItemToDelete = null;
    if (messageArea) messageArea.textContent = '🗑 予定を削除しました。';
}

function checkAndResetClassTasks() {
    if (!Array.isArray(tasks)) return;

    const todayStr = getTodayIsoString();
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

    const { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } = window.firebaseAuth;

    // リダイレクトから戻ってきた時のログイン結果を取得
    getRedirectResult(auth).then(async (result) => {
        if (result && result.user) {
            currentUser = result.user;
            await loadUserDataFromCloud(result.user.uid);
            if (messageArea) messageArea.textContent = '🎉 ログインに成功しました！';
        }
    }).catch(error => {
        console.error("リダイレクトログインエラー:", error);
    });

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
            // ポップアップがブロックされた場合はリダイレクトにフォールバック
            signInWithPopup(auth, provider).catch(error => {
                if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
                    console.warn("ポップアップがブロックされたためリダイレクト処理に切り替えます");
                    signInWithRedirect(auth, provider);
                } else {
                    console.error("ログインエラー:", error);
                }
            });
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
        customFocusSubjects: JSON.parse(localStorage.getItem('myCustomFocusSubjects')) || [],
        dailySchedules: JSON.parse(localStorage.getItem('myDailySchedules')) || {},
        schedulePresets: JSON.parse(localStorage.getItem('mySchedulePresets')) || [],
        focusLogs: JSON.parse(localStorage.getItem('myFocusLogs')) || [],
        externalIcalUrl: localStorage.getItem('myExternalIcalUrl') || "",
        updatedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, 'users', currentUser.uid), dataToSave, { merge: true });
        console.log("☁ クラウドへ自動バックアップ完了");
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
            if (data.customFocusSubjects) localStorage.setItem('myCustomFocusSubjects', JSON.stringify(data.customFocusSubjects));
            if (data.dailySchedules) localStorage.setItem('myDailySchedules', JSON.stringify(data.dailySchedules));
            if (data.schedulePresets) localStorage.setItem('mySchedulePresets', JSON.stringify(data.schedulePresets));
            if (data.focusLogs) localStorage.setItem('myFocusLogs', JSON.stringify(data.focusLogs));
            if (data.externalIcalUrl) {
                localStorage.setItem('myExternalIcalUrl', data.externalIcalUrl);
                externalIcalUrl = data.externalIcalUrl;
                externalIcalUrlInput.value = externalIcalUrl;
                fetchAndParseIcal(externalIcalUrl);
            }

            timetableData = data.timetable || {};
            tasks = data.tasks || [];
            customCategories = data.categories || ["未分類", "提出物", "買い物"];
            customFocusSubjects = data.customFocusSubjects || [];
            dailySchedules = data.dailySchedules || {};
            savedSchedulePresets = data.schedulePresets || [];
            focusLogs = data.focusLogs || [];

            checkAndResetClassTasks();
            renderPresetButtons();
            updateScheduleView();
            renderCuteCalendar(currentViewYear, currentViewMonth);
            renderTimetable();
            updateSubjectSelectOptions();
            renderCategoryFilterTabs();
            updateCategorySelectOptions();
            renderTasks();
            updateDashboard();
            console.log("☁️ クラウドからデータを同期しました");
        }
    } catch (error) {
        console.error("データ同期エラー:", error);
    }
}

function setSelectedColorInPicker(colorCode) {
    selectedColor = colorCode || pastel15ModalColors[0];
    document.querySelectorAll('#modal15ColorPicker .color-circle-small').forEach(circle => {
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
                const cardColor = cellData.color || pastel15ModalColors[0];

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
        else modalTeacherEmail.textContent = '✉️️ メールアドレス未登録';

        updateAttendanceModalView();
        renderMemos(cellData.memos || []);
        modalDetailView.style.display = 'block';
        modalEditView.style.display = 'none';
    } else {
        showEditForm(day, period, '', pastel15ModalColors[0], '', '', '');
    }
    modalOverlay.style.display = 'flex';
}

function updateAttendanceModalView() {
    const cellData = timetableData[activeCellKey];
    if (!cellData) return;

    const attendance = cellData.attendance || {};
    let presentCount = 0, lateCount = 0, absentCount = 0, cancelCount = 0;

    attendanceHistoryList.innerHTML = '';
    const dateKeys = Object.keys(attendance).sort().reverse();

    if (dateKeys.length === 0) {
        attendanceHistoryList.innerHTML = '<li style="color:#aaa; border:none; background:none;">出欠の記録はありません</li>';
    } else {
        dateKeys.forEach(dateStr => {
            const status = attendance[dateStr];
            if (status === '出席') presentCount++;
            if (status === '遅刻') lateCount++;
            if (status === '欠席') absentCount++;
            if (status === '休講') cancelCount++;

            const li = document.createElement('li');
            li.innerHTML = `
                <div><strong>${dateStr}</strong>: <span class="badge-tag">${status}</span></div>
            `;
            const delBtn = document.createElement('button');
            delBtn.className = 'memo-del-btn';
            delBtn.textContent = '✖ 削除';
            delBtn.onclick = () => deleteAttendanceRecord(dateStr);

            li.appendChild(delBtn);
            attendanceHistoryList.appendChild(li);
        });
    }

    countPresent.textContent = presentCount;
    countLate.textContent = lateCount;
    countAbsent.textContent = absentCount;
    countCancel.textContent = cancelCount;
}

saveManualAttBtn.onclick = async () => {
    const dateStr = manualAttDateInput.value;
    const statusStr = manualAttStatusSelect.value;
    if (!dateStr || !activeCellKey) return;

    await saveAttendanceStatus(activeCellKey, dateStr, statusStr);
};

async function deleteAttendanceRecord(dateStr) {
    if (!activeCellKey || !timetableData[activeCellKey] || !timetableData[activeCellKey].attendance) return;
    delete timetableData[activeCellKey].attendance[dateStr];

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    updateAttendanceModalView();
    renderTodayAttendanceCard();
}

modalEditBtn.onclick = () => {
    const cellData = timetableData[activeCellKey] || {};
    const [day, period] = activeCellKey.split('_');
    showEditForm(day, period, cellData.subject || '', cellData.color || pastel15ModalColors[0], cellData.teacher || '', cellData.email || '', cellData.room || '');
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
        subject, color: selectedColor, teacher, email, room, memos: currentCell.memos || [], attendance: currentCell.attendance || {}
    };

    localStorage.setItem('myTimetable', JSON.stringify(timetableData));
    await saveUserDataToCloud();
    renderTimetable();
    updateSubjectSelectOptions();
    updateScheduleView();
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
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
        renderCuteCalendar(currentViewYear, currentViewMonth);
        updateDashboard();
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
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
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
    taskFormHeading.textContent = '✏ タスクの編集';
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
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
}

async function deleteTask(id) {
    if (!Array.isArray(tasks)) return;
    tasks = tasks.filter(task => task.id !== id);
    if (editingTaskId === id) resetTaskForm();

    localStorage.setItem('myTasks', JSON.stringify(tasks));
    await saveUserDataToCloud();
    renderTasks();
    renderCuteCalendar(currentViewYear, currentViewMonth);
    updateDashboard();
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

function setupFocusTimerEvents() {
    document.querySelectorAll('input[name="focusTimerMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (isTimerRunning) pauseTimer();
            timerMode = e.target.value;

            if (timerMode === 'pomodoro') {
                pomodoroInfoArea.style.display = 'block';
                countdownSettingsArea.style.display = 'none';
                pomodoroPhaseBadge.style.display = 'inline-block';
                pomodoroPhase = 'work';
                pomodoroCycleCount = 1;
                pomodoroPhaseBadge.textContent = `🍅 1回目の作業 (25分)`;
                pomodoroPhaseBadge.style.backgroundColor = '#e74c3c';
                timerSeconds = 25 * 60;
                initialTargetSeconds = 25 * 60;
            } else if (timerMode === 'countdown') {
                pomodoroInfoArea.style.display = 'none';
                countdownSettingsArea.style.display = 'block';
                pomodoroPhaseBadge.style.display = 'none';
                const customMin = parseInt(countdownCustomMinutes.value) || 25;
                timerSeconds = customMin * 60;
                initialTargetSeconds = customMin * 60;
            } else if (timerMode === 'stopwatch') {
                pomodoroInfoArea.style.display = 'none';
                countdownSettingsArea.style.display = 'none';
                pomodoroPhaseBadge.style.display = 'none';
                timerSeconds = 0;
            }
            updateTimerDisplay();
        });
    });

    focusTargetSelect.addEventListener('change', (e) => {
        if (e.target.value === '__add_new__') {
            customSubjectInputArea.style.display = 'flex';
            customSubjectInput.focus();
        } else {
            customSubjectInputArea.style.display = 'none';
        }
    });

    saveCustomSubjectBtn.onclick = async () => {
        const val = customSubjectInput.value.trim();
        if (!val) return;

        if (!customFocusSubjects.includes(val)) {
            customFocusSubjects.push(val);
            localStorage.setItem('myCustomFocusSubjects', JSON.stringify(customFocusSubjects));
            await saveUserDataToCloud();
        }

        customSubjectInput.value = '';
        customSubjectInputArea.style.display = 'none';
        updateFocusTargetOptions();
        focusTargetSelect.value = `📚 科目: ${val}`;
    };

    countdownCustomMinutes.addEventListener('input', (e) => {
        if (timerMode === 'countdown' && !isTimerRunning) {
            const min = parseInt(e.target.value) || 1;
            timerSeconds = min * 60;
            initialTargetSeconds = min * 60;
            updateTimerDisplay();
        }
    });

    document.querySelectorAll('.preset-timer-btn').forEach(btn => {
        btn.onclick = () => {
            const min = parseInt(btn.getAttribute('data-min'));
            countdownCustomMinutes.value = min;
            if (timerMode === 'countdown' && !isTimerRunning) {
                timerSeconds = min * 60;
                initialTargetSeconds = min * 60;
                updateTimerDisplay();
            }
        };
    });

    startTimerBtn.onclick = startTimer;
    pauseTimerBtn.onclick = pauseTimer;
    stopTimerBtn.onclick = stopTimerAndSave;

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isTimerRunning) {
            syncTimerWithRealTime();
        }
    });
}

function updateFocusTargetOptions() {
    focusTargetSelect.innerHTML = '<option value="全般">全般（指定なし）</option>';

    const subjectList = [];
    Object.values(timetableData).forEach(item => {
        if (item && item.subject && !subjectList.includes(item.subject)) {
            subjectList.push(item.subject);
        }
    });

    subjectList.forEach(subj => {
        const opt = document.createElement('option');
        opt.value = `🏫 時間割: ${subj}`;
        opt.textContent = `🏫 時間割: ${subj}`;
        focusTargetSelect.appendChild(opt);
    });

    customFocusSubjects.forEach(subj => {
        const opt = document.createElement('option');
        opt.value = `📚 科目: ${subj}`;
        opt.textContent = `📚 科目: ${subj}`;
        focusTargetSelect.appendChild(opt);
    });

    const addNewOpt = document.createElement('option');
    addNewOpt.value = '__add_new__';
    addNewOpt.textContent = '➕ 新しい科目を自由追加...';
    focusTargetSelect.appendChild(addNewOpt);

    tasks.filter(t => !t.completed).forEach(t => {
        const opt = document.createElement('option');
        opt.value = `📝 タスク: ${t.text}`;
        opt.textContent = `📝 タスク: ${t.text}`;
        focusTargetSelect.appendChild(opt);
    });
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerStartTime = Date.now() - (timerElapsedSeconds * 1000);

    startTimerBtn.style.display = 'none';
    pauseTimerBtn.style.display = 'block';
    stopTimerBtn.style.display = 'block';

    timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
    syncTimerWithRealTime();
}

function syncTimerWithRealTime() {
    if (!isTimerRunning) return;

    const now = Date.now();
    const actualElapsedSec = Math.floor((now - timerStartTime) / 1000);
    
    if (timerMode === 'pomodoro') {
        const targetSec = (pomodoroPhase === 'work') ? 25 * 60 : 5 * 60;
        const remaining = targetSec - actualElapsedSec;

        if (remaining > 0) {
            timerSeconds = remaining;
            if (pomodoroPhase === 'work') timerElapsedSeconds = actualElapsedSec;
            updateTimerDisplay();
        } else {
            if (pomodoroPhase === 'work') {
                alert(`🍅 ${pomodoroCycleCount}回目の作業（25分）が完了しました！5分間の休憩に入ります。`);
                pomodoroPhase = 'break';
                pomodoroPhaseBadge.textContent = `☕ ${pomodoroCycleCount}回目の休憩 (5分)`;
                pomodoroPhaseBadge.style.backgroundColor = '#27ae60';
                timerSeconds = 5 * 60;
            } else {
                pomodoroCycleCount++;
                alert(`☕ 休憩が終了しました！ ${pomodoroCycleCount}回目の作業を開始します。`);
                pomodoroPhase = 'work';
                pomodoroPhaseBadge.textContent = `🍅 ${pomodoroCycleCount}回目の作業 (25分)`;
                pomodoroPhaseBadge.style.backgroundColor = '#e74c3c';
                timerSeconds = 25 * 60;
            }
            timerStartTime = Date.now();
            updateTimerDisplay();
        }
    } else if (timerMode === 'countdown') {
        const remaining = initialTargetSeconds - actualElapsedSec;
        if (remaining > 0) {
            timerSeconds = remaining;
            timerElapsedSeconds = actualElapsedSec;
            updateTimerDisplay();
        } else {
            timerSeconds = 0;
            timerElapsedSeconds = initialTargetSeconds;
            updateTimerDisplay();
            pauseTimer();
            alert('🎉 設定時間が終了しました！お疲れ様でした！');
            stopTimerAndSave();
        }
    } else {
        timerSeconds = actualElapsedSec;
        timerElapsedSeconds = actualElapsedSec;
        updateTimerDisplay();
    }
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    startTimerBtn.style.display = 'block';
    startTimerBtn.textContent = '▶ 再開';
    pauseTimerBtn.style.display = 'none';
}

async function stopTimerAndSave() {
    pauseTimer();

    const elapsedMinutes = Math.floor(timerElapsedSeconds / 60);
    if (elapsedMinutes >= 1) {
        const targetName = focusTargetSelect.value.replace('__add_new__', '全般');
        const dateStr = getTodayIsoString();

        focusLogs.push({
            id: Date.now(),
            date: dateStr,
            minutes: elapsedMinutes,
            target: targetName
        });

        localStorage.setItem('myFocusLogs', JSON.stringify(focusLogs));
        await saveUserDataToCloud();
        if (messageArea) messageArea.textContent = `💾 ${elapsedMinutes}分間の集中記録を保存しました！`;
    }

    timerElapsedSeconds = 0;
    pomodoroCycleCount = 1;
    startTimerBtn.textContent = '▶ スタート';
    stopTimerBtn.style.display = 'none';

    if (timerMode === 'pomodoro') {
        pomodoroPhase = 'work';
        pomodoroPhaseBadge.textContent = '🍅 1回目の作業 (25分)';
        pomodoroPhaseBadge.style.backgroundColor = '#e74c3c';
        timerSeconds = 25 * 60;
        initialTargetSeconds = 25 * 60;
    } else if (timerMode === 'countdown') {
        const customMin = parseInt(countdownCustomMinutes.value) || 25;
        timerSeconds = customMin * 60;
        initialTargetSeconds = customMin * 60;
    } else {
        timerSeconds = 0;
    }

    updateTimerDisplay();
    renderFocusCharts();
}

function updateTimerDisplay() {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    timerClockText.textContent = `${m}:${s}`;
}

function renderFocusCharts() {
    const last7Days = [];
    const minutesByDate = {};

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const monthDayStr = `${d.getMonth()+1}/${d.getDate()}`;
        last7Days.push({ dateStr, monthDayStr });
        minutesByDate[dateStr] = 0;
    }

    focusLogs.forEach(log => {
        if (minutesByDate[log.date] !== undefined) {
            minutesByDate[log.date] += log.minutes;
        }
    });

    const weeklyLabels = last7Days.map(item => item.monthDayStr);
    const weeklyData = last7Days.map(item => minutesByDate[item.dateStr]);

    const ctxWeekly = document.getElementById('weeklyFocusChart').getContext('2d');
    if (weeklyChartInstance) weeklyChartInstance.destroy();

    weeklyChartInstance = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
            labels: weeklyLabels,
            datasets: [{
                label: '集中時間 (分)',
                data: weeklyData,
                backgroundColor: '#4a90e2',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: '分' } }
            }
        }
    });

    const categoryTotals = {};
    focusLogs.forEach(log => {
        const target = log.target || '全般';
        categoryTotals[target] = (categoryTotals[target] || 0) + log.minutes;
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);

    const ctxCategory = document.getElementById('categoryFocusChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    if (categoryLabels.length === 0) {
        categoryLabels.push('まだ記録がありません');
        categoryData.push(1);
    }

    categoryChartInstance = new Chart(ctxCategory, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: pastel15ModalColors
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}