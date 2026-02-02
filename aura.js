// aura.js - 完全独立的版本
(function() {
    console.log('🚀 AuraVision 系统启动中...');
    
    // 等待DOM完全加载
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📦 DOM加载完成，初始化系统...');
        initAuraVision();
    });
    
    function initAuraVision() {
        // 首先确保所有必要的CSS已经加载
        addEssentialStyles();
        
        // 初始化变量
        let currentVideoFile = null;
        let isAnalyzing = false;
        let isPlaying = false;
        let videoElement = null;
        
        // 获取所有必要的元素
        console.log('🔍 获取DOM元素...');
        
        // 视频相关元素
        videoElement = document.getElementById('mainVideo');
        console.log('📺 视频元素:', videoElement ? '找到' : '未找到');
        
        // 上传相关元素
        const uploadPortal = document.getElementById('uploadPortal');
        const activateUploadBtn = document.getElementById('activateUpload');
        const videoInput = document.getElementById('videoInput');
        const cameraBtn = document.getElementById('cameraInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        console.log('📤 上传按钮:', activateUploadBtn ? '找到' : '未找到');
        console.log('🔍 文件输入:', videoInput ? '找到' : '未找到');
        console.log('📷 摄像头按钮:', cameraBtn ? '找到' : '未找到');
        console.log('⚡ 分析按钮:', analyzeBtn ? '找到' : '未找到');
        
        // ==== 核心功能函数 ====
        
        // 1. 显示通知
        function showNotification(message, type = 'info') {
            console.log(`📢 ${type}: ${message}`);
            
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: rgba(20, 20, 30, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                transform: translateX(150%);
                transition: transform 0.3s ease;
                font-family: 'Space Grotesk', sans-serif;
            `;
            
            if (type === 'success') {
                notification.style.borderColor = '#00ff9d';
                notification.style.borderLeft = '4px solid #00ff9d';
            } else if (type === 'warning') {
                notification.style.borderColor = '#ffb300';
                notification.style.borderLeft = '4px solid #ffb300';
            } else if (type === 'error') {
                notification.style.borderColor = '#ff0055';
                notification.style.borderLeft = '4px solid #ff0055';
            } else {
                notification.style.borderColor = '#00f3ff';
                notification.style.borderLeft = '4px solid #00f3ff';
            }
            
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 
                               type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            // 显示通知
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // 自动隐藏
            setTimeout(() => {
                notification.style.transform = 'translateX(150%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
        
        // 2. 处理文件上传
        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            console.log('📁 选择的文件:', file.name);
            handleVideoFile(file);
        }
        
        // 3. 处理拖放上传
        function handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            if (uploadPortal) {
                uploadPortal.classList.add('drag-over');
            }
        }
        
        function handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            if (uploadPortal) {
                uploadPortal.classList.remove('drag-over');
            }
        }
        
        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            if (uploadPortal) {
                uploadPortal.classList.remove('drag-over');
            }
            
            if (e.dataTransfer.files.length) {
                console.log('📁 拖放的文件:', e.dataTransfer.files[0].name);
                handleVideoFile(e.dataTransfer.files[0]);
            }
        }
        
        // 4. 处理视频文件
        function handleVideoFile(file) {
            if (!file.type.startsWith('video/')) {
                showNotification('请选择视频文件 (MP4, MOV, WEBM)', 'warning');
                return;
            }
            
            if (file.size > 4 * 1024 * 1024 * 1024) {
                showNotification('文件太大，最大支持4GB', 'warning');
                return;
            }
            
            currentVideoFile = file;
            
            // 显示文件信息
            updateFileInfo(file);
            
            // 显示上传进度
            showUploadProgress();
            
            // 模拟上传
            simulateUploadProgress(() => {
                // 加载视频
                loadVideo(file);
            });
        }
        
        // 5. 显示上传进度
        function showUploadProgress() {
            const progressElement = document.getElementById('uploadProgress');
            if (progressElement) {
                progressElement.style.display = 'block';
            }
            
            if (uploadPortal) {
                uploadPortal.style.opacity = '0.5';
            }
        }
        
        // 6. 模拟上传进度
        function simulateUploadProgress(onComplete) {
            const progressFill = document.getElementById('progressFill');
            const progressValue = document.querySelector('.progress-value');
            
            if (!progressFill) {
                onComplete();
                return;
            }
            
            let progress = 0;
            
            function update() {
                progress += 2;
                if (progress > 100) progress = 100;
                
                progressFill.style.width = progress + '%';
                if (progressValue) {
                    progressValue.textContent = progress + '%';
                }
                
                if (progress < 100) {
                    setTimeout(update, 30);
                } else {
                    setTimeout(() => {
                        const progressElement = document.getElementById('uploadProgress');
                        if (progressElement) {
                            progressElement.style.display = 'none';
                        }
                        if (uploadPortal) {
                            uploadPortal.style.opacity = '1';
                        }
                        onComplete();
                    }, 500);
                }
            }
            
            update();
        }
        
        // 7. 更新文件信息
        function updateFileInfo(file) {
            // 文件名
            const fileName = document.getElementById('fileName');
            if (fileName) {
                fileName.textContent = file.name;
            }
            
            // 文件大小
            const fileSize = document.getElementById('fileSize');
            if (fileSize) {
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                fileSize.textContent = sizeMB + ' MB';
            }
            
            // 显示信息区域
            const videoSpecs = document.getElementById('videoSpecs');
            if (videoSpecs) {
                videoSpecs.style.display = 'block';
            }
        }
        
        // 8. 加载视频
        function loadVideo(file) {
            if (!videoElement) {
                showNotification('视频播放器未找到', 'error');
                return;
            }
            
            const videoURL = URL.createObjectURL(file);
            
            // 显示加载器
            const loader = document.getElementById('videoLoader');
            if (loader) {
                loader.style.display = 'flex';
            }
            
            videoElement.src = videoURL;
            
            // 监听视频加载完成
            videoElement.addEventListener('loadeddata', function onLoaded() {
                console.log('✅ 视频加载完成');
                
                if (loader) {
                    loader.style.display = 'none';
                }
                
                // 更新视频信息
                updateVideoInfo();
                
                // 启用分析按钮
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.classList.remove('disabled');
                }
                
                // 播放视频
                videoElement.play().catch(err => {
                    console.log('⚠️ 自动播放被阻止:', err);
                });
                
                // 开始模拟分析
                startMockAnalysis();
                
                showNotification('视频加载成功，可以开始分析了！', 'success');
                
                // 移除监听器
                videoElement.removeEventListener('loadeddata', onLoaded);
            });
            
            // 错误处理
            videoElement.addEventListener('error', function onError(e) {
                console.error('❌ 视频加载错误:', e);
                
                if (loader) {
                    loader.style.display = 'none';
                }
                
                showNotification('视频加载失败，请检查文件格式', 'error');
                
                videoElement.removeEventListener('error', onError);
            });
        }
        
        // 9. 更新视频信息
        function updateVideoInfo() {
            if (!videoElement) return;
            
            const duration = videoElement.duration;
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            
            // 时长
            const videoDuration = document.getElementById('videoDuration');
            if (videoDuration) {
                videoDuration.textContent = formatTime(duration);
            }
            
            // 分辨率
            const videoRes = document.getElementById('videoRes');
            if (videoRes) {
                videoRes.textContent = width + ' × ' + height;
            }
            
            // 总时间码
            const totalTimecode = document.getElementById('totalTimecode');
            if (totalTimecode) {
                totalTimecode.textContent = formatTimecode(duration);
            }
        }
        
        // 10. 格式化时间
        function formatTime(seconds) {
            if (!seconds) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        }
        
        function formatTimecode(seconds) {
            if (!seconds) return '00:00:00.000';
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 1000);
            return hours.toString().padStart(2, '0') + ':' + 
                   mins.toString().padStart(2, '0') + ':' + 
                   secs.toString().padStart(2, '0') + '.' + 
                   ms.toString().padStart(3, '0');
        }
        
        // 11. 开始模拟分析
        function startMockAnalysis() {
            if (!videoElement) return;
            
            // 显示分析状态
            const analysisStatus = document.getElementById('analysisStatus');
            if (analysisStatus) {
                analysisStatus.classList.add('active');
            }
            
            // 初始化时间线
            initTimeline();
            
            // 开始实时数据更新
            startRealTimeUpdates();
        }
        
        // 12. 初始化时间线
        function initTimeline() {
            if (!videoElement) return;
            
            const duration = videoElement.duration;
            const timelineSlider = document.getElementById('timelineSlider');
            const timelineMarkers = document.getElementById('timelineMarkers');
            
            if (timelineSlider) {
                timelineSlider.max = Math.floor(duration * 100);
                
                timelineSlider.addEventListener('input', function(e) {
                    const time = (e.target.value / 100) * duration;
                    videoElement.currentTime = time;
                });
            }
            
            if (timelineMarkers) {
                timelineMarkers.innerHTML = '';
                
                const markerCount = Math.min(10, Math.floor(duration / 5));
                for (let i = 0; i <= markerCount; i++) {
                    const marker = document.createElement('div');
                    marker.className = 'time-marker';
                    marker.style.left = (i * 100 / markerCount) + '%';
                    
                    const markerTime = duration * i / markerCount;
                    const label = document.createElement('div');
                    label.className = 'marker-label';
                    label.textContent = formatTime(markerTime);
                    
                    marker.appendChild(label);
                    timelineMarkers.appendChild(marker);
                }
            }
            
            // 视频时间更新
            videoElement.addEventListener('timeupdate', function() {
                const currentTime = videoElement.currentTime;
                const duration = videoElement.duration;
                
                // 更新时间轴
                if (timelineSlider) {
                    const progress = (currentTime / duration) * 10000;
                    timelineSlider.value = progress;
                }
                
                // 更新当前时间码
                const currentTimecode = document.getElementById('currentTimecode');
                if (currentTimecode) {
                    currentTimecode.textContent = formatTimecode(currentTime);
                }
            });
        }
        
        // 13. 开始实时数据更新
        function startRealTimeUpdates() {
            // 更新系统时钟
            updateSystemClock();
            setInterval(updateSystemClock, 1000);
            
            // 开始模拟数据更新
            simulateDataUpdates();
        }
        
        // 14. 更新系统时钟
        function updateSystemClock() {
            const systemClock = document.getElementById('systemClock');
            if (!systemClock) return;
            
            const now = new Date();
            const time = now.toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            systemClock.textContent = time;
        }
        
        // 15. 模拟数据更新
        function simulateDataUpdates() {
            setInterval(() => {
                // 随机生成检测数据
                const detectionCount = Math.floor(Math.random() * 10) + 1;
                const behaviorCount = Math.floor(Math.random() * 8) + 1;
                const confidenceScore = Math.floor(Math.random() * 30) + 70;
                
                // 更新检测计数
                const detectionCountElement = document.getElementById('detectionCount');
                if (detectionCountElement) {
                    detectionCountElement.textContent = detectionCount;
                }
                
                // 更新行为计数
                const behaviorCountElement = document.getElementById('behaviorCount');
                if (behaviorCountElement) {
                    behaviorCountElement.textContent = behaviorCount;
                }
                
                // 更新置信度
                const confidenceScoreElement = document.getElementById('confidenceScore');
                if (confidenceScoreElement) {
                    confidenceScoreElement.textContent = confidenceScore + '%';
                }
                
                // 更新处理速度
                const processingFPSElement = document.getElementById('processingFPS');
                if (processingFPSElement) {
                    processingFPSElement.textContent = Math.floor(Math.random() * 10) + 25;
                }
                
                // 更新行为标签
                updateBehaviorTags(behaviorCount);
                
                // 更新检测计数器
                updateDetectionCounter(detectionCount);
                
            }, 2000);
        }
        
        // 16. 更新行为标签
        function updateBehaviorTags(count) {
            const container = document.getElementById('behaviorTags');
            if (!container) return;
            
            const behaviors = [
                { name: '行走', color: '#00f3ff' },
                { name: '奔跑', color: '#00ff9d' },
                { name: '跳跃', color: '#ffb300' },
                { name: '手势', color: '#ff00d4' },
                { name: '交谈', color: '#00b4ff' },
                { name: '聚集', color: '#9d00ff' }
            ];
            
            // 随机选择行为
            const selectedBehaviors = [];
            const usedIndices = new Set();
            
            for (let i = 0; i < Math.min(count, behaviors.length); i++) {
                let index;
                do {
                    index = Math.floor(Math.random() * behaviors.length);
                } while (usedIndices.has(index));
                usedIndices.add(index);
                selectedBehaviors.push(behaviors[index]);
            }
            
            container.innerHTML = '';
            
            selectedBehaviors.forEach(behavior => {
                const tag = document.createElement('div');
                tag.className = 'behavior-tag';
                tag.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: ${behavior.color}20;
                    border: 1px solid ${behavior.color};
                    border-radius: 20px;
                    color: ${behavior.color};
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin: 3px;
                `;
                
                tag.innerHTML = `<span>${behavior.name}</span>`;
                
                tag.addEventListener('click', () => {
                    showNotification(`点击了行为: ${behavior.name}`, 'info');
                });
                
                container.appendChild(tag);
            });
        }
        
        // 17. 更新检测计数器
        function updateDetectionCounter(count) {
            const detectionCountElement = document.querySelector('.detection-count');
            if (!detectionCountElement) return;
            
            detectionCountElement.textContent = count;
            
            // 更新检测列表
            const detectionList = document.querySelector('.detection-list');
            if (detectionList) {
                detectionList.innerHTML = '';
                
                const behaviors = ['行走', '奔跑', '站立', '交谈', '挥手'];
                const usedBehaviors = new Set();
                
                for (let i = 0; i < Math.min(count, 3); i++) {
                    let behavior;
                    do {
                        behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
                    } while (usedBehaviors.has(behavior));
                    usedBehaviors.add(behavior);
                    
                    const badge = document.createElement('div');
                    badge.className = 'behavior-badge';
                    badge.style.cssText = `
                        display: inline-block;
                        padding: 4px 8px;
                        background: rgba(0, 243, 255, 0.2);
                        border: 1px solid #00f3ff;
                        border-radius: 12px;
                        color: #00f3ff;
                        font-size: 10px;
                        font-weight: 600;
                        margin-right: 4px;
                    `;
                    badge.textContent = behavior;
                    detectionList.appendChild(badge);
                }
                
                if (count > 3) {
                    const moreBadge = document.createElement('div');
                    moreBadge.className = 'behavior-badge more';
                    moreBadge.style.cssText = `
                        display: inline-block;
                        padding: 4px 8px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 12px;
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 10px;
                        font-weight: 600;
                        margin-right: 4px;
                    `;
                    moreBadge.textContent = '+' + (count - 3);
                    detectionList.appendChild(moreBadge);
                }
            }
        }
        
        // 18. 开始分析
        function startAnalysis() {
            if (isAnalyzing) {
                showNotification('分析正在进行中', 'warning');
                return;
            }
            
            if (!currentVideoFile && !videoElement.src && !videoElement.srcObject) {
                showNotification('请先上传视频或激活摄像头', 'warning');
                return;
            }
            
            isAnalyzing = true;
            
            // 显示模态框
            const modal = document.getElementById('analysisModal');
            if (modal) {
                modal.style.display = 'flex';
            }
            
            // 禁用分析按钮
            if (analyzeBtn) {
                analyzeBtn.disabled = true;
                analyzeBtn.classList.add('disabled');
            }
            
            // 开始分析流程
            simulateAnalysisProcess(() => {
                isAnalyzing = false;
                
                // 启用分析按钮
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.classList.remove('disabled');
                }
                
                // 关闭模态框
                setTimeout(() => {
                    if (modal) {
                        modal.style.display = 'none';
                    }
                }, 1000);
                
                showNotification('分析完成！', 'success');
            });
        }
        
        // 19. 模拟分析流程
        function simulateAnalysisProcess(onComplete) {
            const steps = document.querySelectorAll('.pipeline-step');
            let currentStep = 0;
            
            function processStep() {
                if (currentStep >= steps.length) {
                    onComplete();
                    return;
                }
                
                const step = steps[currentStep];
                const statusIcon = step.querySelector('.step-status i');
                
                // 激活步骤
                step.classList.add('active');
                if (statusIcon) {
                    statusIcon.className = 'fas fa-spinner fa-spin';
                }
                
                // 模拟处理时间
                setTimeout(() => {
                    if (statusIcon) {
                        statusIcon.className = 'fas fa-check';
                    }
                    
                    // 更新预览
                    updateAnalysisPreview(currentStep);
                    
                    currentStep++;
                    setTimeout(processStep, 800);
                }, 1500);
            }
            
            processStep();
        }
        
        // 20. 更新分析预览
        function updateAnalysisPreview(stepIndex) {
            const canvas = document.getElementById('previewCanvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width = 400;
            const height = canvas.height = 225;
            
            ctx.clearRect(0, 0, width, height);
            
            switch (stepIndex) {
                case 0: // 预处理
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
                    break;
                    
                case 1: // 目标检测
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
                    break;
            }
            
            // 更新统计
            updateAnalysisStats(stepIndex);
        }
        
        // 21. 更新分析统计
        function updateAnalysisStats(stepIndex) {
            const stats = {
                processedFrames: stepIndex * 250 + 250,
                detectedObjects: stepIndex * 3 + 2,
                processingSpeed: 25 + stepIndex * 5,
                analysisMemory: 120 + stepIndex * 30,
                timeRemaining: 10 - stepIndex * 2
            };
            
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
        
        // 22. 激活摄像头
        function activateCamera() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showNotification('您的浏览器不支持摄像头访问', 'error');
                return;
            }
            
            showNotification('正在请求摄像头权限...', 'info');
            
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false 
            })
            .then(stream => {
                videoElement.srcObject = stream;
                currentVideoFile = null;
                
                // 更新信息
                updateCameraInfo();
                
                // 启用分析按钮
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.classList.remove('disabled');
                }
                
                // 开始模拟分析
                startMockAnalysis();
                
                showNotification('摄像头已激活', 'success');
            })
            .catch(err => {
                console.error('摄像头错误:', err);
                showNotification('无法访问摄像头: ' + err.message, 'error');
            });
        }
        
        // 23. 更新摄像头信息
        function updateCameraInfo() {
            const fileName = document.getElementById('fileName');
            if (fileName) fileName.textContent = '实时摄像头';
            
            const videoRes = document.getElementById('videoRes');
            if (videoRes) videoRes.textContent = '1280×720';
            
            const videoDuration = document.getElementById('videoDuration');
            if (videoDuration) videoDuration.textContent = '实时';
            
            const fileSize = document.getElementById('fileSize');
            if (fileSize) fileSize.textContent = '流媒体';
        }
        
        // 24. 视频播放控制
        function setupVideoControls() {
            const videoPlay = document.getElementById('videoPlay');
            const videoPause = document.getElementById('videoPause');
            const videoRestart = document.getElementById('videoRestart');
            const fullscreenToggle = document.getElementById('fullscreenToggle');
            
            if (videoPlay) {
                videoPlay.addEventListener('click', () => {
                    videoElement.play();
                    isPlaying = true;
                });
            }
            
            if (videoPause) {
                videoPause.addEventListener('click', () => {
                    videoElement.pause();
                    isPlaying = false;
                });
            }
            
            if (videoRestart) {
                videoRestart.addEventListener('click', () => {
                    videoElement.currentTime = 0;
                    videoElement.play();
                    isPlaying = true;
                });
            }
            
            if (fullscreenToggle) {
                fullscreenToggle.addEventListener('click', () => {
                    const container = document.querySelector('.hologram-frame');
                    if (!document.fullscreenElement) {
                        if (container.requestFullscreen) {
                            container.requestFullscreen();
                        }
                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        }
                    }
                });
            }
        }
        
        // 25. 模态框控制
        function setupModalControls() {
            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    const modal = document.getElementById('analysisModal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            }
            
            // 点击模态框外部关闭
            const modal = document.getElementById('analysisModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        }
        
        // 26. 其他按钮
        function setupOtherControls() {
            // 主题切换
            const themeSwitch = document.getElementById('themeSwitch');
            if (themeSwitch) {
                themeSwitch.addEventListener('change', (e) => {
                    document.documentElement.setAttribute('data-theme', 
                        e.target.checked ? 'light' : 'cyber');
                });
            }
            
            // 导出结果
            const exportResults = document.getElementById('exportResults');
            if (exportResults) {
                exportResults.addEventListener('click', () => {
                    const data = {
                        system: 'AuraVision AI',
                        timestamp: new Date().toISOString(),
                        data: '分析数据...'
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
                    
                    showNotification('分析结果已导出', 'success');
                });
            }
        }
        
        // ==== 事件绑定 ====
        
        console.log('🔌 绑定事件监听器...');
        
        // 上传按钮
        if (activateUploadBtn) {
            activateUploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📁 点击上传按钮');
                videoInput.click();
            });
        }
        
        // 文件输入
        if (videoInput) {
            videoInput.addEventListener('change', handleFileSelect);
        }
        
        // 摄像头按钮
        if (cameraBtn) {
            cameraBtn.addEventListener('click', activateCamera);
        }
        
        // 分析按钮
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', startAnalysis);
        }
        
        // 拖放上传
        if (uploadPortal) {
            uploadPortal.addEventListener('dragover', handleDragOver);
            uploadPortal.addEventListener('dragleave', handleDragLeave);
            uploadPortal.addEventListener('drop', handleDrop);
            
            // 点击上传区域
            uploadPortal.addEventListener('click', (e) => {
                if (e.target !== activateUploadBtn && e.target !== cameraBtn) {
                    videoInput.click();
                }
            });
        }
        
        // 设置视频控制
        setupVideoControls();
        
        // 设置模态框控制
        setupModalControls();
        
        // 设置其他控制
        setupOtherControls();
        
        console.log('✅ 系统初始化完成，所有按钮已绑定');
        showNotification('AuraVision 系统已就绪', 'success');
    }
    
    // 添加必要的样式
    function addEssentialStyles() {
        const style = document.createElement('style');
        style.textContent = `
        /* 禁用状态 */
        .disabled {
            opacity: 0.5;
            cursor: not-allowed !important;
            pointer-events: none;
        }
        
        /* 上传进度 */
        .upload-progress {
            display: none;
            margin-top: 20px;
        }
        
        /* 视频信息 */
        .video-specs {
            display: none;
        }
        
        /* 加载器 */
        .hologram-loader {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 10;
        }
        
        /* 模态框 */
        .cyber-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        /* 分析状态 */
        .analysis-status {
            display: none;
        }
        
        .analysis-status.active {
            display: block;
        }
        
        /* 上传区域拖放样式 */
        .drag-over {
            border-color: #00f3ff !important;
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.3) !important;
        }
        `;
        document.head.appendChild(style);
    }
    
    console.log('📦 AuraVision 脚本加载完成');
})();