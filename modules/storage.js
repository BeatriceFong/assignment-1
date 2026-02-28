// 數據儲存模組
class StorageModule {
    constructor() {
        this.init();
    }

    init() {
        // 檢查瀏覽器支持
        if (!this.supportsLocalStorage()) {
            console.warn('LocalStorage 不支持，部分功能可能受限');
        }
        
        // 初始化數據結構
        this.ensureDataStructure();
    }

    supportsLocalStorage() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    ensureDataStructure() {
        const defaultData = {
            version: '1.0.0',
            user: {
                name: '同學',
                level: 1,
                xp: 0,
                streak: 0,
                totalStudyTime: 0,
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    sound: true
                }
            },
            courses: [],
            tasks: [],
            goals: [],
            pomodoros: [],
            achievements: {},
            statistics: {
                daily: {},
                weekly: {},
                monthly: {}
            }
        };

        if (!localStorage.getItem('studyflow_data')) {
            localStorage.setItem('studyflow_data', JSON.stringify(defaultData));
        } else {
            // 版本升級檢查
            this.migrateData();
        }
    }

    migrateData() {
        try {
            const data = JSON.parse(localStorage.getItem('studyflow_data'));
            
            // 添加缺少的字段
            const defaultData = this.getDefaultData();
            const migratedData = this.mergeObjects(defaultData, data);
            
            // 更新版本
            migratedData.version = '1.0.0';
            
            localStorage.setItem('studyflow_data', JSON.stringify(migratedData));
        } catch (error) {
            console.error('數據遷移失敗:', error);
        }
    }

    getDefaultData() {
        return {
            version: '1.0.0',
            user: { name: '同學', level: 1, xp: 0, streak: 0, totalStudyTime: 0, preferences: {} },
            courses: [],
            tasks: [],
            goals: [],
            pomodoros: [],
            achievements: {},
            statistics: { daily: {}, weekly: {}, monthly: {} }
        };
    }

    mergeObjects(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeObjects(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // CRUD 操作
    getData(key = null) {
        try {
            const data = JSON.parse(localStorage.getItem('studyflow_data'));
            return key ? data[key] : data;
        } catch (error) {
            console.error('獲取數據失敗:', error);
            return key ? null : this.getDefaultData();
        }
    }

    setData(key, value) {
        try {
            const data = this.getData();
            data[key] = value;
            localStorage.setItem('studyflow_data', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存數據失敗:', error);
            return false;
        }
    }

    updateData(key, updater) {
        try {
            const data = this.getData();
            const currentValue = data[key];
            data[key] = updater(currentValue);
            localStorage.setItem('studyflow_data', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('更新數據失敗:', error);
            return false;
        }
    }

    // 特定數據操作
    addTask(task) {
        const tasks = this.getData('tasks') || [];
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        task.completed = false;
        
        tasks.push(task);
        this.setData('tasks', tasks);
        
        return task;
    }

    completeTask(taskId) {
        return this.updateData('tasks', (tasks) => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, completed: true, completedAt: new Date().toISOString() };
                }
                return task;
            });
        });
    }

    addPomodoroSession(duration, mode) {
        const session = {
            id: Date.now().toString(),
            duration,
            mode,
            timestamp: new Date().toISOString()
        };
        
        return this.updateData('pomodoros', (sessions) => {
            sessions.push(session);
            return sessions;
        });
    }

    getTodayStats() {
        const today = new Date().toDateString();
        const pomodoros = this.getData('pomodoros') || [];
        const tasks = this.getData('tasks') || [];
        
        const todayPomodoros = pomodoros.filter(p => {
            return new Date(p.timestamp).toDateString() === today;
        });
        
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.createdAt).toDateString();
            return taskDate === today;
        });
        
        const completedTasks = todayTasks.filter(t => t.completed);
        
        const totalFocusTime = todayPomodoros
            .filter(p => p.mode === 'focus')
            .reduce((sum, p) => sum + p.duration, 0);
        
        return {
            pomodoros: todayPomodoros.length,
            focusTime: totalFocusTime,
            tasks: todayTasks.length,
            completedTasks: completedTasks.length
        };
    }

    getWeeklyStats() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const pomodoros = this.getData('pomodoros') || [];
        
        const weeklyPomodoros = pomodoros.filter(p => {
            return new Date(p.timestamp) >= weekAgo;
        });
        
        const dailyStats = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toDateString();
            dailyStats[dateStr] = {
                pomodoros: 0,
                focusTime: 0
            };
        }
        
        weeklyPomodoros.forEach(p => {
            const dateStr = new Date(p.timestamp).toDateString();
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].pomodoros++;
                if (p.mode === 'focus') {
                    dailyStats[dateStr].focusTime += p.duration;
                }
            }
        });
        
        return dailyStats;
    }

    // 數據導出
    exportData(format = 'json') {
        const data = this.getData();
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                // 簡化版本，實際可以生成多個CSV文件
                return this.convertToCSV(data);
                
            default:
                return data;
        }
    }

    convertToCSV(data) {
        // 實現數據轉CSV邏輯
        return '';
    }

    // 數據備份
    backupData() {
        const data = this.exportData('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `studyflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // 數據清理（清除舊數據）
    cleanupOldData(daysToKeep = 90) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        
        this.updateData('pomodoros', (pomodoros) => {
            return pomodoros.filter(p => new Date(p.timestamp) >= cutoffDate);
        });
        
        this.updateData('tasks', (tasks) => {
            return tasks.filter(t => new Date(t.createdAt) >= cutoffDate);
        });
        
        console.log(`已清理 ${daysToKeep} 天前的數據`);
    }
}

// 導出模組
window.StorageModule = new StorageModule();