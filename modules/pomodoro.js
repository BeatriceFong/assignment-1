// 番茄鐘模組
class PomodoroModule {
    constructor() {
        this.timer = null;
        this.timeLeft = 25 * 60; // 25分鐘（秒）
        this.isRunning = false;
        this.currentMode = 'focus'; // 'focus' 或 'break'
        this.cycles = 0;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.updateDisplay();
    }

    cacheDOM() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startPomodoroBtn');
        this.pauseBtn = document.getElementById('pausePomodoroBtn');
        this.resetBtn = document.getElementById('resetPomodoroBtn');
        this.modeDisplay = document.getElementById('pomodoroMode');
        this.cycleDisplay = document.getElementById('pomodoroCycles');
    }

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pause());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        }
    }

    start(duration = 25) {
        if (this.isRunning) return;
        
        this.timeLeft = duration * 60;
        this.isRunning = true;
        this.timer = setInterval(() => this.tick(), 1000);
        
        // 發送瀏覽器通知
        this.sendNotification('番茄鐘開始', `${duration}分鐘專注時間開始`);
        
        // 更新按鈕狀態
        this.updateButtonState();
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timer);
        this.sendNotification('番茄鐘暫停', '專注時間已暫停');
        this.updateButtonState();
    }

    reset() {
        this.pause();
        this.timeLeft = 25 * 60;
        this.currentMode = 'focus';
        this.updateDisplay();
        this.updateButtonState();
    }

    tick() {
        this.timeLeft--;
        
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
        
        this.updateDisplay();
    }

    completeSession() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // 增加番茄鐘計數
        this.cycles++;
        
        // 更新統計數據
        if (window.app) {
            const minutes = this.currentMode === 'focus' ? 25 : 5;
            window.app.addStudyTime(minutes);
        }
        
        // 切換模式
        if (this.currentMode === 'focus') {
            // 專注結束，開始休息
            this.currentMode = 'break';
            this.timeLeft = 5 * 60; // 5分鐘休息
            this.sendNotification('休息時間', '專注完成！開始5分鐘休息');
            
            // 播放提示音
            this.playSound('break_start');
        } else {
            // 休息結束，開始新一輪專注
            this.currentMode = 'focus';
            this.timeLeft = 25 * 60;
            this.sendNotification('專注時間', '休息結束！開始25分鐘專注');
            
            // 播放提示音
            this.playSound('focus_start');
        }
        
        this.updateDisplay();
        this.updateButtonState();
        
        // 如果休息結束，自動開始下一輪
        if (this.currentMode === 'focus') {
            setTimeout(() => this.start(25), 1000);
        }
    }

    updateDisplay() {
        if (this.timerDisplay) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            this.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.modeDisplay) {
            this.modeDisplay.textContent = this.currentMode === 'focus' ? '專注時間' : '休息時間';
            this.modeDisplay.className = `mode-${this.currentMode}`;
        }
        
        if (this.cycleDisplay) {
            this.cycleDisplay.textContent = `已完成 ${this.cycles} 個番茄鐘`;
        }
    }

    updateButtonState() {
        if (this.startBtn && this.pauseBtn) {
            this.startBtn.disabled = this.isRunning;
            this.pauseBtn.disabled = !this.isRunning;
        }
    }

    sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/assets/icon.png' });
        }
    }

    playSound(soundType) {
        const audio = new Audio();
        audio.src = `/assets/sounds/${soundType}.mp3`;
        audio.play().catch(e => console.log('音頻播放失敗:', e));
    }
}

// 導出模組
window.PomodoroModule = new PomodoroModule();