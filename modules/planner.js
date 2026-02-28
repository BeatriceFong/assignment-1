// 學習計畫模組
class PlannerModule {
    constructor() {
        this.tasks = [];
        this.init();
    }

    init() {
        this.cacheDOM();
        this.loadTasks();
        this.bindEvents();
    }

    cacheDOM() {
        this.plannerContainer = document.getElementById('plannerModule');
        if (this.plannerContainer) {
            this.plannerContainer.innerHTML = this.getPlannerHTML();
            this.taskForm = this.plannerContainer.querySelector('#taskForm');
            this.taskInput = this.plannerContainer.querySelector('#taskInput');
            this.taskList = this.plannerContainer.querySelector('#taskList');
        }
    }
    
    getPlannerHTML() {
        return `
            <div class="module-card">
                <div class="module-header">
                    <h2 class="module-title"><i class="fas fa-calendar-alt"></i> 學習計畫</h2>
                    <button class="btn-icon" id="addTaskBtn"><i class="fas fa-plus"></i></button>
                </div>
                <div id="taskForm" class="task-form hidden">
                    <input type="text" id="taskInput" placeholder="輸入新任務...">
                    <button type="submit" class="btn-primary">新增</button>
                </div>
                <div id="taskList" class="task-list">
                    <!-- 任務列表會在這裡動態生成 -->
                </div>
            </div>
        `;
    }

    bindEvents() {
        if(this.taskForm) {
            this.taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }
        
        const addTaskBtn = this.plannerContainer.querySelector('#addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.taskForm.classList.toggle('hidden');
            });
        }
    }

    loadTasks() {
        if (window.StorageModule) {
            this.tasks = window.StorageModule.getData('tasks') || [];
            this.renderTasks();
        }
    }

    renderTasks() {
        if (this.taskList) {
            this.taskList.innerHTML = '';
            this.tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskElement.dataset.taskId = task.id;
                taskElement.innerHTML = `
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${task.text}</span>
                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                `;
                
                // 綁定完成和刪除事件
                const checkbox = taskElement.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => this.toggleTask(task.id));
                
                const deleteBtn = taskElement.querySelector('.btn-delete');
                deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
                
                this.taskList.appendChild(taskElement);
            });
        }
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (text) {
            const newTask = { text: text };
            const savedTask = window.StorageModule.addTask(newTask);
            this.tasks.push(savedTask);
            this.renderTasks();
            this.taskInput.value = '';
            this.taskForm.classList.add('hidden');
        }
    }

    toggleTask(taskId) {
        window.StorageModule.completeTask(taskId);
        this.tasks = this.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        this.renderTasks();
    }

    deleteTask(taskId) {
        const newTasks = this.tasks.filter(task => task.id !== taskId);
        window.StorageModule.setData('tasks', newTasks);
        this.tasks = newTasks;
        this.renderTasks();
    }
}

// 初始化模組
window.PlannerModule = new PlannerModule();
