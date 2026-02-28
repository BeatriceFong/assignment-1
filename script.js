// StudyFlow Pro - 主應用邏輯

// 應用狀態
const AppState = {
    userData: {
        name: '同學',
        level: 1,
        xp: 0,
        streak: 0,
        totalStudyTime: 0
    },
    todayData: {
        studyTime: 0,
        completedTasks: 0,
        totalTasks: 0,
        pomodoros: 0
    },
    courses: [],
    tasks: [],
    goals: []
};

// DOM元素
const DOM = {
    userName: document.getElementById('userName'),
    userLevel: document.getElementById('userLevel'),
    todayStudyTime: document.getElementById('todayStudyTime'),
    todayTasks: document.getElementById('todayTasks'),
    streakDays: document.getElementById('streakDays'),
    totalXP: document.getElementById('totalXP'),
    completionRate: document.getElementById('completionRate'),
    dailyQuote: document.getElementById('dailyQuote'),
    startPomodoro: document.getElementById('startPomodoro'),
    themeToggle: document.getElementById('themeToggle')
};

// 初始化應用
class StudyFlowApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('StudyFlow Pro 初始化中...');
        
        // 加載用戶數據
        await this.loadUserData();
        
        // 初始化UI
        this.updateUI();
        
        // 綁定事件
        this.bindEvents();
        
        // 註冊Service Worker
        this.registerServiceWorker();
        
        console.log('StudyFlow Pro 初始化完成');
    }

    async loadUserData() {
        // 嘗試從LocalStorage加載數據
        const savedData = localStorage.getItem('studyflow_data');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                AppState.userData = { ...AppState.userData, ...data };
                
                // 計算連續學習天數
                this.calculateStreak();
            } catch (error) {
                console.error('加載用戶數據失敗:', error);
            }
        }
        
        // 加載每日名言
        await this.loadDailyQuote();
    }

    saveUserData() {
        try {
            localStorage.setItem('studyflow_data', JSON.stringify(AppState.userData));
            console.log('用戶數據已保存');
        } catch (error) {
            console.error('保存用戶數據失敗:', error);
        }
    }

    async loadDailyQuote() {
        const quotes = [
            "學習不是為了考試，而是為了成為更好的自己。",
            "每天進步一點點，一年後你會感謝現在的自己。",
            "知識就像肌肉，需要不斷鍛煉才能強壯。",
            "成功的秘訣就是每天堅持做正確的事。",
            "學習是通往夢想的階梯，每一步都算數。",
            "不要害怕失敗，每一次失敗都是學習的機會。",
            "專注當下，未來自會到來。",
            "自律是自由的前提，堅持是成功的基石。"
        ];
        
        // 根據日期選擇名言
        const today = new Date().getDate();
        const quoteIndex = today % quotes.length;
        AppState.dailyQuote = quotes[quoteIndex];
    }

    calculateStreak() {
        const lastStudyDate = localStorage.getItem('last_study_date');
        const today = new Date().toDateString();
        
        if (!lastStudyDate) {
            // 第一次使用
            AppState.userData.streak = 1;
        } else if (lastStudyDate === today) {
            // 今天已經學習過
            // 保持原有連續天數
        } else {
            const lastDate = new Date(lastStudyDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // 連續學習
                AppState.userData.streak++;
            } else {
                // 斷開，重新開始
                AppState.userData.streak = 1;
            }
        }
        
        // 保存今日日期
        localStorage.setItem('last_study_date', today);
    }

    updateUI() {
        // 更新用戶信息
        DOM.userName.textContent = AppState.userData.name;
        DOM.userLevel.textContent = `Lv.${AppState.userData.level}`;
        
        // 更新統計數據
        DOM.todayStudyTime.textContent = `${(AppState.todayData.studyTime / 60).toFixed(1)}小時`;
        DOM.todayTasks.textContent = `${AppState.todayData.completedTasks}/${AppState.todayData.totalTasks}`;
        DOM.streakDays.textContent = AppState.userData.streak;
        DOM.totalXP.textContent = AppState.userData.xp;
        
        // 計算完成率
        const rate = AppState.todayData.totalTasks > 0 
            ? Math.round((AppState.todayData.completedTasks / AppState.todayData.totalTasks) * 100) 
            : 0;
        DOM.completionRate.textContent = `${rate}%`;
        
        // 更新每日名言
        DOM.dailyQuote.textContent = AppState.dailyQuote;
        
        // 更新進度條
        this.updateProgressBar();
    }

    updateProgressBar() {
        const progressBar = document.getElementById('globalProgress');
        if (progressBar) {
            const progressFill = progressBar.querySelector('.progress-fill');
            const progress = (AppState.userData.xp / 1000) * 100; // 假設1000XP滿級
            progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    addStudyTime(minutes) {
        AppState.todayData.studyTime += minutes;
        AppState.userData.totalStudyTime += minutes;
        
        // 增加經驗值（每分鐘1XP）
        AppState.userData.xp += minutes;
        
        // 檢查升級
        this.checkLevelUp();
        
        // 保存並更新UI
        this.saveUserData();
        this.updateUI();
        
        // 觸發成就檢查
        this.checkAchievements(minutes);
    }

    checkLevelUp() {
        const xpNeeded = AppState.userData.level * 1000; // 每級需要1000XP
        if (AppState.userData.xp >= xpNeeded) {
            AppState.userData.level++;
            this.showNotification('恭喜升級！', `你已達到 Lv.${AppState.userData.level}`, 'success');
        }
    }

    checkAchievements(studyTime) {
        const achievements = {
            'first_session': { condition: AppState.userData.totalStudyTime >= 60, unlocked: false },
            'study_streak_7': { condition: AppState.userData.streak >= 7, unlocked: false },
            'marathon': { condition: studyTime >= 120, unlocked: false }
        };
        
        for (const [key, achievement] of Object.entries(achievements)) {
            if (achievement.condition && !achievement.unlocked) {
                this.unlockAchievement(key);
            }
        }
    }

    unlockAchievement(achievementId) {
        const achievements = localStorage.getItem('achievements') || '{}';
        const achieved = JSON.parse(achievements);
        
        if (!achieved[achievementId]) {
            achieved[achievementId] = true;
            localStorage.setItem('achievements', JSON.stringify(achieved));
            
            // 顯示成就解鎖通知
            this.showNotification('🎉 成就解鎖！', '恭喜獲得新成就', 'achievement');
        }
    }

    showNotification(title, message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 添加到通知中心
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter) {
            notificationCenter.appendChild(notification);
            
            // 自動移除
            setTimeout(() => {
                notification.remove();
            }, 5000);
            
            // 點擊關閉
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.remove();
            });
        }
    }

    bindEvents() {
        // 主題切換
        DOM.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = DOM.themeToggle.querySelector('i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
            
            // 保存主題偏好
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });

        // 開始番茄鐘
        DOM.startPomodoro.addEventListener('click', () => {
            this.startPomodoroSession();
        });

        // 導航點擊
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                
                // 更新活躍狀態
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // 滾動到對應模組
                this.scrollToModule(targetId);
            });
        });
    }

    startPomodoroSession() {
        // 啟動番茄鐘模組
        if (window.PomodoroModule) {
            window.PomodoroModule.startSession(25); // 25分鐘專注
            this.showNotification('🍅 番茄鐘開始', '專注學習25分鐘', 'success');
        } else {
            this.showNotification('⚠️ 功能未加載', '請刷新頁面重試', 'warning');
        }
    }

    scrollToModule(moduleId) {
        const module = document.getElementById(`${moduleId}Module`);
        if (module) {
            module.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker 註冊成功:', registration);
            } catch (error) {
                console.error('Service Worker 註冊失敗:', error);
            }
        }
    }
}

// 其他模組...

// 拖放功能
class DragDropManager {
    constructor() {
        this.draggedItem = null;
        this.init();
    }

    init() {
        // 為可拖動元素添加事件
        document.querySelectorAll('.course-item').forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // 為放置區域添加事件
        document.querySelectorAll('.course-cell').forEach(cell => {
            cell.addEventListener('dragover', this.handleDragOver.bind(this));
            cell.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    handleDragStart(e) {
        this.draggedItem = e.target;
        e.dataTransfer.setData('text/plain', e.target.dataset.courseId);
        e.target.classList.add('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.target.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        if (this.draggedItem) {
            // 移動課程到新位置
            const courseId = e.dataTransfer.getData('text/plain');
            this.moveCourse(courseId, e.target.dataset.timeSlot, e.target.dataset.day);
            
            // 重置狀態
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    moveCourse(courseId, newTimeSlot, newDay) {
        // 更新課程時間安排
        console.log(`移動課程 ${courseId} 到 ${newDay} ${newTimeSlot}`);
        // 這裡需要更新數據並保存
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    // 創建主應用實例
    window.app = new StudyFlowApp();
    
    // 初始化拖放管理器
    window.dragDropManager = new DragDropManager();
    
    // 加載主題偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const icon = DOM.themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // Ctrl+P: 快速啟動番茄鐘
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.app.startPomodoroSession();
    }
    
    // Ctrl+T: 添加任務
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        // 觸發添加任務對話框
    }
    
    // Ctrl+D: 切換主題
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        DOM.themeToggle.click();
    }
});