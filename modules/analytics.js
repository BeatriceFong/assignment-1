// 數據分析模組
class AnalyticsModule {
    constructor() {
        this.init();
    }

    init() {
        this.cacheDOM();
        this.renderCharts();
    }

    cacheDOM() {
        this.analyticsContainer = document.getElementById('analyticsModule');
        if (this.analyticsContainer) {
            this.analyticsContainer.innerHTML = this.getAnalyticsHTML();
            this.weeklyChartCanvas = this.analyticsContainer.querySelector('#weeklyStudyChart');
        }
    }

    getAnalyticsHTML() {
        return `
            <div class="module-card">
                <div class="module-header">
                    <h2 class="module-title"><i class="fas fa-chart-line"></i> 學習分析</h2>
                </div>
                <div class="chart-container">
                    <canvas id="weeklyStudyChart"></canvas>
                </div>
                <div class="stats-grid">
                    <!-- 其他統計數據 -->
                </div>
            </div>
        `;
    }

    renderCharts() {
        if (this.weeklyChartCanvas && window.StorageModule) {
            const weeklyStats = window.StorageModule.getWeeklyStats();
            
            const labels = Object.keys(weeklyStats);
            const data = labels.map(label => weeklyStats[label].focusTime / 60); // 轉換為小時

            new Chart(this.weeklyChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels.map(l => new Date(l).toLocaleDateString('zh-TW', { weekday: 'short' })),
                    datasets: [{
                        label: '學習時長 (小時)',
                        data: data,
                        backgroundColor: 'rgba(99, 102, 241, 0.6)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#cbd5e1'
                            }
                        },
                        x: {
                             grid: {
                                display: false
                            },
                            ticks: {
                                color: '#cbd5e1'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#f1f5f9'
                            }
                        }
                    }
                }
            });
        }
    }
}

// 初始化模組
window.AnalyticsModule = new AnalyticsModule();
