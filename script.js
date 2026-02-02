// aura.js - 修复版本
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AuraVision 系统启动中...');
    
    // 初始化系统
    initializeSystem();
    
    // 设置初始主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'cyber' : 'light');
    
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = !prefersDark;
    }
    
    console.log('✨ AuraVision 启动完成');
});

// ===== 核心系统 =====
let auraVision = null;

function initializeSystem() {
    try {
        auraVision = new AuraVision();
    } catch (error) {
        console.error('系统初始化失败:', error);
        showNotification('系统初始化失败，请刷新页面重试', 'error');
    }
}

// ===== 通知系统 =====
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== 添加通知样式 =====
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: var(--bg-card);
    backdrop-filter: var(--glass-blur);
    border: 1px solid;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 10000;
    transform: translateX(150%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-glow);
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-info {
    border-color: #00f3ff;
    border-left: 4px solid #00f3ff;
}

.notification-success {
    border-color: #00ff9d;
    border-left: 4px solid #00ff9d;
}

.notification-warning {
    border-color: #ffb300;
    border-left: 4px solid #ffb300;
}

.notification-error {
    border-color: #ff0055;
    border-left: 4px solid #ff0055;
}

.notification i {
    font-size: 1.2rem;
}

.notification-info i {
    color: #00f3ff;
}

.notification-success i {
    color: #00ff9d;
}

.notification-warning i {
    color: #ffb300;
}

.notification-error i {
    color: #ff0055;
}
`;
document.head.appendChild(notificationStyle);

// ===== AuraVision 主类 =====
class AuraVision {
    constructor() {
        console.log('🔧 初始化AuraVision系统...');
        
        // DOM元素引用
        this.videoPlayer = document.getElementById('mainVideo');
        this.canvas = document.getElementById('hologramCanvas');
        this.ctx = this.canvas?.getContext('2d');
        this.heatmapCanvas = document.getElementById('heatmapView');
        
        // 文件上传元素
        this.uploadPortal = document.getElementById('uploadPortal');
        this.activateUpload = document.getElementById('activateUpload');
        this.videoInput = document.getElementById('videoInput');
        this.cameraInput = document.getElementById('cameraInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        
        // 状态变量
        this.currentVideoFile = null;
        this.isAnalyzing = false;
        this.isPlaying = false;
        this.currentTime = 0;
        
        // 模拟数据
        this.analysisData = this.generateMockData();
        
        // 初始化
        this.initialize();
    }
    
    initialize() {
        console.log('🚀 启动系统组件...');
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 初始化视频
        this.initializeVideo();
        
        // 初始化画布
        this.initializeCanvas();
        
        // 初始化UI
        this.initializeUI();
        
        console.log('✅ 系统初始化完成');
    }
    
    bindEvents() {
        console.log('🔌 绑定事件监听器...');
        
        // 上传按钮 - 使用传统事件绑定
        if (this.activateUpload) {
            console.log('✅ 找到上传按钮:', this.activateUpload);
            this.activateUpload.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📁 点击上传按钮');
                this.videoInput.click();
            };
        } else {
            console.error('❌ 未找到上传按钮元素');
        }
        
        // 文件输入变化
        if (this.videoInput) {
            this.videoInput.onchange = (e) => {
                if (e.target.files.length) {
                    console.log('📁 文件已选择:', e.target.files[0].name);
                    this.handleVideoFile(e.target.files[0]);
                }
            };
        }
        
        // 摄像头按钮
        if (this.cameraInput) {
            this.cameraInput.onclick = () => this.activateCamera();
        }
        
        // 分析按钮
        if (this.analyzeBtn) {
            this.analyzeBtn.onclick = () => this.startAnalysis();
        }
        
        // 拖拽上传
        if (this.uploadPortal) {
            this.uploadPortal.ondragover = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadPortal.classList.add('drag-over');
            };
            
            this.uploadPortal.ondragleave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadPortal.classList.remove('drag-over');
            };
            
            this.uploadPortal.ondrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.uploadPortal.classList.remove('drag-over');
                
                if (e.dataTransfer.files.length) {
                    console.log('📁 文件拖放:', e.dataTransfer.files[0].name);
                    this.handleVideoFile(e.dataTransfer.files[0]);
                }
            };
            
            // 点击上传区域
            this.uploadPortal.onclick = (e) => {
                if (e.target !== this.activateUpload && e.target !== this.cameraInput) {
                    this.videoInput.click();
                }
            };
        }
        
        // 主题切换
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.onchange = (e) => {
                document.documentElement.setAttribute('data-theme', 
                    e.target.checked ? 'light' : 'cyber');
            };
        }
        
        // 视频控制
        const videoPlay = document.getElementById('videoPlay');
        const videoPause = document.getElementById('videoPause');
        const videoRestart = document.getElementById('videoRestart');
        const fullscreenToggle = document.getElementById('fullscreenToggle');
        
        if (videoPlay) videoPlay.onclick = () => this.playVideo();
        if (videoPause) videoPause.onclick = () => this.pauseVideo();
        if (videoRestart) videoRestart.onclick = () => this.restartVideo();
        if (fullscreenToggle) fullscreenToggle.onclick = () => this.toggleFullscreen();
        
        // 时间轴控制
        const timelineSlider = document.getElementById('timelineSlider');
        if (timelineSlider) {
            timelineSlider.oninput = (e) => this.handleTimelineChange(e);
        }
        
        // 模态框关闭
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.onclick = () => this.closeModal();
        }
        
        // 导出结果
        const exportResults = document.getElementById('exportResults');
        if (exportResults) {
            exportResults.onclick = () => this.exportResults();
        }
        
        // 系统控制
        const optimizeEngine = document.getElementById('optimizeEngine');
        const diagnostic = document.getElementById('diagnostic');
        
        if (optimizeEngine) optimizeEngine.onclick = () => this.optimizeEngine();
        if (diagnostic) diagnostic.onclick = () => this.runDiagnostic();
    }
    
    // ===== 视频处理方法 =====
    async handleVideoFile(file) {
        try {
            console.log('📁 处理视频文件:', file.name);
            
            // 验证文件类型
            if (!file.type.startsWith('video/')) {
                showNotification('请选择视频文件 (MP4, MOV, WEBM)', 'warning');
                return;
            }
            
            // 验证文件大小
            if (file.size > 4 * 1024 * 1024 * 1024) {
                showNotification('文件过大，最大支持4GB', 'warning');
                return;
            }
            
            this.currentVideoFile = file;
            
            // 显示文件信息
            this.showFileInfo(file);
            
            // 显示上传进度
            this.showUploadProgress();
            
            // 模拟上传进度
            await this.simulateUpload();
            
            // 加载视频
            await this.loadVideo(file);
            
            // 启用分析按钮
            if (this.analyzeBtn) {
                this.analyzeBtn.disabled = false;
                this.analyzeBtn.classList.remove('disabled');
            }
            
            showNotification('视频加载成功，可以开始分析了！', 'success');
            
        } catch (error) {
            console.error('❌ 文件处理失败:', error);
            showNotification(`文件处理失败: ${error.message}`, 'error');
        }
    }
    
    showFileInfo(file) {
        console.log('📊 显示文件信息');
        
        // 更新文件名
        const fileName = document.getElementById('fileName');
        if (fileName) fileName.textContent = file.name;
        
        // 更新文件大小
        const fileSize = document.getElementById('fileSize');
        if (fileSize) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            fileSize.textContent = `${sizeMB} MB`;
        }
        
        // 显示信息区域
        const videoSpecs = document.getElementById('videoSpecs');
        if (videoSpecs) videoSpecs.style.display = 'block';
    }
    
    async simulateUpload() {
        return new Promise((resolve) => {
            const progress = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressValue = document.querySelector('.progress-value');
            const uploadSpeed = document.getElementById('uploadSpeed');
            const uploadRemaining = document.getElementById('uploadRemaining');
            
            if (!progress || !progressFill) {
                resolve();
                return;
            }
            
            progress.style.display = 'block';
            
            let current = 0;
            const total = 100;
            const speed = 50; // MB/s
            
            const update = () => {
                current += 2;
                if (current > total) current = total;
                
                progressFill.style.width = `${current}%`;
                if (progressValue) progressValue.textContent = `${current}%`;
                if (uploadSpeed) uploadSpeed.textContent = `${speed} MB/s`;
                if (uploadRemaining) uploadRemaining.textContent = `${Math.ceil((total - current) / 2)}s`;
                
                if (current < total) {
                    setTimeout(update, 50);
                } else {
                    setTimeout(() => {
                        progress.style.display = 'none';
                        resolve();
                    }, 500);
                }
            };
            
            update();
        });
    }
    
    async loadVideo(file) {
        return new Promise((resolve, reject) => {
            const videoURL = URL.createObjectURL(file);
            
            // 显示加载器
            this.showLoader(true);
            
            this.videoPlayer.src = videoURL;
            this.videoPlayer.load();
            
            this.videoPlayer.onloadeddata = () => {
                console.log('✅ 视频加载完成');
                this.showLoader(false);
                
                // 更新视频信息
                this.updateVideoInfo();
                
                // 初始化时间线
                this.initTimeline();
                
                // 播放视频
                this.videoPlayer.play().catch(e => {
                    console.log('自动播放被阻止，用户需要手动播放');
                });
                
                resolve();
            };
            
            this.videoPlayer.onerror = (e) => {
                console.error('❌ 视频加载失败:', e);
                this.showLoader(false);
                showNotification('视频加载失败，请检查文件格式', 'error');
                reject(new Error('视频加载失败'));
            };
        });
    }
    
    showLoader(show) {
        const loader = document.getElementById('videoLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    updateVideoInfo() {
        const duration = this.videoPlayer.duration;
        const width = this.videoPlayer.videoWidth;
        const height = this.videoPlayer.videoHeight;
        
        // 更新时长
        const videoDuration = document.getElementById('videoDuration');
        if (videoDuration) {
            videoDuration.textContent = this.formatTime(duration);
        }
        
        // 更新分辨率
        const videoRes = document.getElementById('videoRes');
        if (videoRes) {
            videoRes.textContent = `${width} × ${height}`;
        }
        
        // 更新总时间码
        const totalTimecode = document.getElementById('totalTimecode');
        if (totalTimecode) {
            totalTimecode.textContent = this.formatTimecode(duration);
        }
    }
    
    initTimeline() {
        const duration = this.videoPlayer.duration;
        const timelineSlider = document.getElementById('timelineSlider');
        const timelineMarkers = document.getElementById('timelineMarkers');
        
        if (timelineSlider) {
            timelineSlider.max = Math.floor(duration * 100);
        }
        
        if (timelineMarkers) {
            timelineMarkers.innerHTML = '';
            
            const markerCount = Math.min(10, Math.floor(duration / 5));
            for (let i = 0; i <= markerCount; i++) {
                const marker = document.createElement('div');
                marker.className = 'time-marker';
                marker.style.left = `${(i * 100) / markerCount}%`;
                
                const markerTime = (duration * i) / markerCount;
                const label = document.createElement('div');
                label.className = 'marker-label';
                label.textContent = this.formatTime(markerTime);
                
                marker.appendChild(label);
                timelineMarkers.appendChild(marker);
            }
        }
        
        // 视频时间更新事件
        this.videoPlayer.ontimeupdate = () => {
            this.currentTime = this.videoPlayer.currentTime;
            
            // 更新进度条
            if (timelineSlider) {
                const progress = (this.currentTime / duration) * 10000;
                timelineSlider.value = progress;
            }
            
            // 更新时间显示
            const currentTimecode = document.getElementById('currentTimecode');
            if (currentTimecode) {
                currentTimecode.textContent = this.formatTimecode(this.currentTime);
            }
        };
    }
    
    // ===== 视频控制方法 =====
    playVideo() {
        console.log('▶️ 播放视频');
        this.videoPlayer.play();
        this.isPlaying = true;
    }
    
    pauseVideo() {
        console.log('⏸️ 暂停视频');
        this.videoPlayer.pause();
        this.isPlaying = false;
    }
    
    restartVideo() {
        console.log('🔄 重启视频');
        this.videoPlayer.currentTime = 0;
        this.videoPlayer.play();
        this.isPlaying = true;
    }
    
    toggleFullscreen() {
        const container = document.querySelector('.hologram-frame');
        if (!container) return;
        
        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    handleTimelineChange(e) {
        const time = (e.target.value / 10000) * this.videoPlayer.duration;
        this.videoPlayer.currentTime = time;
    }
    
    // ===== 摄像头功能 =====
    async activateCamera() {
        console.log('📷 激活摄像头');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showNotification('您的浏览器不支持摄像头访问', 'error');
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false 
            });
            
            this.videoPlayer.srcObject = stream;
            this.currentVideoFile = null; // 清除文件上传
            
            // 更新信息
            document.getElementById('fileName').textContent = '实时摄像头';
            document.getElementById('videoRes').textContent = '1280×720';
            document.getElementById('videoDuration').textContent = '实时';
            document.getElementById('fileSize').textContent = '流媒体';
            
            // 启用分析按钮
            if (this.analyzeBtn) {
                this.analyzeBtn.disabled = false;
                this.analyzeBtn.classList.remove('disabled');
            }
            
            showNotification('摄像头已激活，可以开始实时分析', 'success');
            
        } catch (error) {
            console.error('❌ 摄像头访问失败:', error);
            showNotification(`摄像头访问失败: ${error.message}`, 'error');
        }
    }
    
    // ===== 分析功能 =====
    async startAnalysis() {
        if (this.isAnalyzing) {
            showNotification('分析正在进行中', 'warning');
            return;
        }
        
        console.log('🚀 启动AI分析引擎');
        
        this.isAnalyzing = true;
        this.showModal();
        
        try {
            // 禁用分析按钮
            if (this.analyzeBtn) {
                this.analyzeBtn.disabled = true;
                this.analyzeBtn.classList.add('disabled');
            }
            
            // 开始分析流程
            await this.performAnalysis();
            
            // 分析完成
            this.isAnalyzing = false;
            showNotification('分析完成！', 'success');
            
            // 更新UI
            this.updateUI();
            
            // 关闭模态框
            setTimeout(() => this.closeModal(), 1000);
            
        } catch (error) {
            console.error('❌ 分析失败:', error);
            showNotification('分析失败', 'error');
            this.isAnalyzing = false;
            this.closeModal();
        }
    }
    
    async performAnalysis() {
        return new Promise((resolve) => {
            const steps = document.querySelectorAll('.pipeline-step');
            const modalProgress = document.getElementById('engineProgress');
            const progressValue = document.querySelector('.progress-value');
            
            let currentStep = 0;
            const totalSteps = steps.length;
            
            const processStep = async () => {
                if (currentStep >= totalSteps) {
                    resolve();
                    return;
                }
                
                const step = steps[currentStep];
                
                // 动画延迟
                await this.delay(1000);
                
                // 激活当前步骤
                step.classList.add('active');
                const statusIcon = step.querySelector('.step-status i');
                if (statusIcon) statusIcon.className = 'fas fa-spinner fa-spin';
                
                // 更新进度
                const progress = ((currentStep + 1) / totalSteps) * 100;
                if (modalProgress) modalProgress.style.width = `${progress}%`;
                if (progressValue) progressValue.textContent = `${Math.round(progress)}%`;
                
                // 更新预览
                this.updateAnalysisPreview(currentStep);
                
                // 模拟处理时间
                await this.delay(1500);
                
                // 标记步骤完成
                if (statusIcon) statusIcon.className = 'fas fa-check';
                
                currentStep++;
                processStep();
            };
            
            processStep();
        });
    }
    
    updateAnalysisPreview(stepIndex) {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = 400;
        const height = canvas.height = 225;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 根据步骤绘制预览
        switch (stepIndex) {
            case 0: // 预处理
                this.drawPreprocessingPreview(ctx, width, height);
                break;
            case 1: // 目标检测
                this.drawDetectionPreview(ctx, width, height);
                break;
            case 2: // 行为分析
                this.drawBehaviorPreview(ctx, width, height);
                break;
            case 3: // 数据合成
                this.drawDataPreview(ctx, width, height);
                break;
        }
        
        // 更新统计信息
        this.updateAnalysisStats(stepIndex);
    }
    
    updateAnalysisStats(stepIndex) {
        const stats = {
            processedFrames: stepIndex * 250 + 250,
            detectedObjects: stepIndex * 3 + 2,
            processingSpeed: 25 + stepIndex * 5,
            analysisMemory: 120 + stepIndex * 30,
            timeRemaining: 10 - stepIndex * 2
        };
        
        // 更新UI
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = id.includes('Memory') ? `${value} MB` :
                                   id.includes('Speed') ? `${value} FPS` :
                                   id.includes('timeRemaining') ? `${value}s` :
                                   value;
            }
        });
    }
    
    updateUI() {
        // 更新统计数据
        this.updateStats();
        
        // 更新行为标签
        this.updateBehaviorTags();
        
        // 更新结果表格
        this.updateResultsTable();
    }
    
    updateStats() {
        const stats = this.analysisData.statistics;
        
        const elements = {
            detectionCount: stats.personCount,
            behaviorCount: stats.totalBehaviors,
            confidenceScore: `${Math.round(stats.avgConfidence * 100)}%`,
            processingFPS: Math.round(stats.processingSpeed),
            totalAnalysis: stats.totalBehaviors,
            anomalyCount: Math.floor(stats.totalBehaviors * 0.2),
            avgConfidence: `${Math.round(stats.avgConfidence * 100)}%`,
            detectionRate: (stats.totalBehaviors / (this.videoPlayer.duration || 1)).toFixed(1),
            processingTime: '24ms',
            accuracyRate: '92%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    updateBehaviorTags() {
        const container = document.getElementById('behaviorTags');
        if (!container) return;
        
        const behaviors = this.analysisData.statistics.behaviorCounts;
        let html = '';
        
        Object.entries(behaviors).forEach(([behavior, count]) => {
            const colors = {
                '行走': '#00ff9d',
                '跑步': '#ffb300',
                '跳跃': '#ff0055',
                '坐下': '#0095ff',
                '站立': '#8b5cf6',
                '挥手': '#ff00ff',
                '交谈': '#00f3ff',
                '打字': '#00ff88'
            };
            
            const color = colors[behavior] || '#8a8acc';
            
            html += `
                <div class="behavior-tag" style="background: ${color}20; border-color: ${color}">
                    <span>${behavior}</span>
                    <span class="tag-count">${count}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateResultsTable() {
        const tbody = document.getElementById('resultsTable');
        if (!tbody) return;
        
        const behaviors = this.analysisData.behaviors.slice(0, 10);
        let html = '';
        
        behaviors.forEach(behavior => {
            const names = {
                'walking': '行走',
                'running': '跑步',
                'jumping': '跳跃',
                'sitting': '坐下',
                'standing': '站立',
                'waving': '挥手',
                'talking': '交谈',
                'typing': '打字'
            };
            
            const colors = {
                'walking': '#00ff9d',
                'running': '#ffb300',
                'jumping': '#ff0055',
                'sitting': '#0095ff',
                'standing': '#8b5cf6',
                'waving': '#ff00ff',
                'talking': '#00f3ff',
                'typing': '#00ff88'
            };
            
            const name = names[behavior.behavior] || behavior.behavior;
            const color = colors[behavior.behavior] || '#8a8acc';
            const confidence = Math.round(behavior.confidence * 100);
            
            html += `
                <tr>
                    <td>${this.formatTime(behavior.timeStart)}</td>
                    <td>
                        <span class="behavior-indicator" style="background: ${color}"></span>
                        ${name}
                    </td>
                    <td>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${confidence}%; background: ${color}"></div>
                        </div>
                        <span class="confidence-value">${confidence}%</span>
                    </td>
                    <td>ID:${behavior.personId}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // ===== 导出功能 =====
    exportResults() {
        console.log('💾 导出分析结果');
        
        const data = {
            system: 'AuraVision AI',
            version: '2.1.4',
            exportTime: new Date().toISOString(),
            videoInfo: {
                fileName: document.getElementById('fileName')?.textContent || '-',
                duration: document.getElementById('videoDuration')?.textContent || '-',
                resolution: document.getElementById('videoRes')?.textContent || '-'
            },
            analysisData: this.analysisData,
            timestamp: new Date().getTime()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AuraVision_分析报告_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('分析报告已导出', 'success');
    }
    
    // ===== 系统控制 =====
    optimizeEngine() {
        console.log('⚡ 优化引擎性能');
        showNotification('正在优化引擎性能...', 'info');
        
        setTimeout(() => {
            this.analysisData.statistics.processingSpeed += 5;
            this.updateStats();
            showNotification('引擎性能已优化', 'success');
        }, 2000);
    }
    
    runDiagnostic() {
        console.log('🔧 运行系统诊断');
        showNotification('正在运行系统诊断...', 'info');
        
        setTimeout(() => {
            const results = `
系统诊断结果：
✅ CPU使用率: 45%
✅ 内存使用率: 38%
✅ GPU负载: 65%
✅ 网络延迟: 12ms
✅ 系统状态: 良好
            `;
            
            alert(results);
            showNotification('系统诊断完成', 'success');
        }, 3000);
    }
    
    // ===== 模态框控制 =====
    showModal() {
        const modal = document.getElementById('analysisModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    closeModal() {
        const modal = document.getElementById('analysisModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // ===== 工具方法 =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatTime(seconds) {
        if (!seconds && seconds !== 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    formatTimecode(seconds) {
        if (!seconds && seconds !== 0) return '00:00:00.000';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    initializeVideo() {
        if (this.videoPlayer) {
            this.videoPlayer.volume = 1;
            this.videoPlayer.playbackRate = 1;
            this.videoPlayer.preload = 'auto';
        }
    }
    
    initializeCanvas() {
        if (this.canvas) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }
    
    resizeCanvas() {
        if (this.videoPlayer && this.canvas) {
            const rect = this.videoPlayer.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }
    
    initializeUI() {
        // 更新系统时钟
        this.updateSystemClock();
        setInterval(() => this.updateSystemClock(), 1000);
    }
    
    updateSystemClock() {
        const clock = document.getElementById('systemClock');
        if (clock) {
            const now = new Date();
            const time = now.toLocaleTimeString('zh-CN', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clock.textContent = `${time}`;
        }
    }
    
    generateMockData() {
        const behaviors = ['walking', 'running', 'jumping', 'sitting', 'standing', 'waving', 'talking'];
        const behaviorCount = Math.floor(Math.random() * 15) + 10;
        
        const data = {
            behaviors: [],
            statistics: {
                totalBehaviors: 0,
                behaviorCounts: {},
                personCount: 0,
                avgConfidence: 0,
                processingSpeed: 0
            }
        };
        
        for (let i = 0; i < behaviorCount; i++) {
            const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
            const timeStart = Math.random() * 20;
            const timeEnd = timeStart + Math.random() * 5 + 1;
            const confidence = Math.random() * 0.3 + 0.7;
            
            data.behaviors.push({
                id: i,
                behavior: behavior,
                timeStart: timeStart,
                timeEnd: timeEnd,
                confidence: confidence,
                personId: Math.floor(Math.random() * 3)
            });
        }
        
        // 计算统计数据
        data.statistics.totalBehaviors = data.behaviors.length;
        data.statistics.personCount = new Set(data.behaviors.map(b => b.personId)).size;
        
        // 计算行为分布
        data.behaviors.forEach(behavior => {
            const name = behavior.behavior;
            data.statistics.behaviorCounts[name] = (data.statistics.behaviorCounts[name] || 0) + 1;
        });
        
        // 计算平均置信度
        if (data.behaviors.length > 0) {
            data.statistics.avgConfidence = data.behaviors.reduce((sum, b) => sum + b.confidence, 0) / 
                                          data.behaviors.length;
        }
        
        data.statistics.processingSpeed = 30;
        
        return data;
    }
    
    // 绘制预览的方法
    drawPreprocessingPreview(ctx, width, height) {
        ctx.fillStyle = '#00f3ff';
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(50 + i * 60, 30 + j * 50, 40, 30);
            }
        }
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#00f3ff';
        ctx.font = '14px "Space Grotesk"';
        ctx.fillText('提取关键帧...', width/2 - 50, height - 30);
    }
    
    drawDetectionPreview(ctx, width, height) {
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 2;
        
        const boxes = [
            { x: 100, y: 50, w: 60, h: 100 },
            { x: 200, y: 80, w: 50, h: 90 },
            { x: 300, y: 60, w: 40, h: 110 }
        ];
        
        boxes.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            
            ctx.fillStyle = '#00ff9d';
            ctx.fillRect(box.x, box.y - 20, 50, 20);
            ctx.fillStyle = '#0a0a0f';
            ctx.font = '10px "Space Grotesk"';
            ctx.fillText('Person', box.x + 5, box.y - 7);
        });
    }
    
    drawBehaviorPreview(ctx, width, height) {
        const behaviors = ['行走', '跑步', '跳跃'];
        const colors = ['#00ff9d', '#ffb300', '#ff0055'];
        
        behaviors.forEach((behavior, i) => {
            const x = 100 + i * 100;
            const y = 100;
            
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x, y, 80, 30);
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#0a0a0f';
            ctx.font = '12px "Space Grotesk"';
            ctx.fillText(behavior, x + 10, y + 10);
        });
    }
    
    drawDataPreview(ctx, width, height) {
        ctx.strokeStyle = '#0095ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const points = 20;
        for (let i = 0; i < points; i++) {
            const x = 50 + (i * 15);
            const y = 150 - Math.sin(i * 0.5) * 30;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#0095ff';
        ctx.font = '14px "Space Grotesk"';
        ctx.fillText('生成报告...', width/2 - 40, 180);
    }
}