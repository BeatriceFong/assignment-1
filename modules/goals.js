// 目標管理模組
class GoalsModule {
    constructor() {
        this.goals = [];
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadGoals();
        this.bindEvents();
    }

    cacheDOM() {
        this.goalsContainer = document.getElementById('goalsModule');
        if (this.goalsContainer) {
            this.goalsContainer.innerHTML = this.getGoalsHTML();
            this.goalForm = this.goalsContainer.querySelector('#goalForm');
            this.goalInput = this.goalsContainer.querySelector('#goalInput');
            this.goalList = this.goalsContainer.querySelector('#goalList');
        }
    }

    getGoalsHTML() {
        return `
            <div class="module-card">
                <div class="module-header">
                    <h2 class="module-title"><i class="fas fa-flag"></i> 目標管理</h2>
                    <button class="btn-icon" id="addGoalBtn"><i class="fas fa-plus"></i></button>
                </div>
                <div id="goalForm" class="goal-form hidden">
                    <input type="text" id="goalInput" placeholder="設定一個新目標...">
                    <button type="submit" class="btn-primary">設定</button>
                </div>
                <div id="goalList" class="goal-list">
                    <!-- 目標列表會在這裡動態生成 -->
                </div>
            </div>
        `;
    }

    bindEvents() {
        if(this.goalForm) {
            this.goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addGoal();
            });
        }
        
        const addGoalBtn = this.goalsContainer.querySelector('#addGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                this.goalForm.classList.toggle('hidden');
            });
        }
    }

    loadGoals() {
        if (window.StorageModule) {
            this.goals = window.StorageModule.getData('goals') || [];
            this.renderGoals();
        }
    }

    renderGoals() {
        if (this.goalList) {
            this.goalList.innerHTML = '';
            this.goals.forEach(goal => {
                const goalElement = document.createElement('div');
                goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
                goalElement.dataset.goalId = goal.id;
                goalElement.innerHTML = `
                    <div class="goal-progress" style="width: ${goal.progress || 0}%"></div>
                    <div class="goal-content">
                        <span>${goal.text}</span>
                        <div class="goal-actions">
                            <button class="btn-complete"><i class="fas fa-check"></i></button>
                            <button class="btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                
                 // 綁定事件
                const completeBtn = goalElement.querySelector('.btn-complete');
                completeBtn.addEventListener('click', () => this.completeGoal(goal.id));

                const deleteBtn = goalElement.querySelector('.btn-delete');
                deleteBtn.addEventListener('click', () => this.deleteGoal(goal.id));
                
                this.goalList.appendChild(goalElement);
            });
        }
    }

    addGoal() {
        const text = this.goalInput.value.trim();
        if (text) {
            const newGoal = { 
                id: Date.now().toString(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.goals.push(newGoal);
            window.StorageModule.setData('goals', this.goals);
            this.renderGoals();
            this.goalInput.value = '';
            this.goalForm.classList.add('hidden');
        }
    }

    completeGoal(goalId) {
        this.goals = this.goals.map(goal => 
            goal.id === goalId ? { ...goal, completed: true, progress: 100 } : goal
        );
        window.StorageModule.setData('goals', this.goals);
        this.renderGoals();
    }
    
    deleteGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        window.StorageModule.setData('goals', this.goals);
        this.renderGoals();
    }
}

// 初始化模組
window.GoalsModule = new GoalsModule();
