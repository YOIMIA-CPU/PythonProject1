// 前端API调用代码
class AuraVisionAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.wsConnections = new Map();
    }

    // 上传视频
    async uploadVideo(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${this.baseURL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }

    // 开始分析
    async analyzeVideo(videoId, mode = 'standard', config = {}) {
        const response = await fetch(`${this.baseURL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                video_id: videoId,
                mode: mode,
                config: config
            })
        });
        
        return await response.json();
    }

    // 获取分析状态
    async getAnalysisStatus(videoId) {
        const response = await fetch(`${this.baseURL}/api/status/${videoId}`);
        return await response.json();
    }

    // 获取分析结果
    async getAnalysisResults(videoId, limit = 100, offset = 0) {
        const response = await fetch(
            `${this.baseURL}/api/results/${videoId}?limit=${limit}&offset=${offset}`
        );
        return await response.json();
    }

    // 获取系统状态
    async getSystemStatus() {
        const response = await fetch(`${this.baseURL}/api/system/status`);
        return await response.json();
    }

    // 导出结果
    async exportResults(videoId, format = 'json') {
        const response = await fetch(
            `${this.baseURL}/api/export/${videoId}?format=${format}`
        );
        
        if (format === 'json') {
            return await response.json();
        } else {
            return await response.blob();
        }
    }

    // 控制分析
    async controlAnalysis(action, videoId = null) {
        const formData = new FormData();
        formData.append('action', action);
        if (videoId) formData.append('video_id', videoId);
        
        const response = await fetch(`${this.baseURL}/api/control`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }

    // 建立WebSocket连接获取实时数据
    connectWebSocket(videoId, onMessage) {
        const ws = new WebSocket(`ws://localhost:8000/ws/realtime/${videoId}`);
        
        ws.onopen = () => {
            console.log(`WebSocket connected for video: ${videoId}`);
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            console.log(`WebSocket disconnected for video: ${videoId}`);
        };
        
        this.wsConnections.set(videoId, ws);
        return ws;
    }

    // 关闭WebSocket连接
    disconnectWebSocket(videoId) {
        const ws = this.wsConnections.get(videoId);
        if (ws) {
            ws.close();
            this.wsConnections.delete(videoId);
        }
    }

    // 获取热力图数据
    async getHeatmapData(videoId) {
        const response = await fetch(`${this.baseURL}/api/heatmap/${videoId}`);
        return await response.json();
    }

    // 获取帧预览
    async getFramePreview(videoId, frameNumber) {
        const response = await fetch(
            `${this.baseURL}/api/frame/${videoId}/${frameNumber}`
        );
        return await response.json();
    }
}

// 前端UI集成示例
document.addEventListener('DOMContentLoaded', function() {
    const api = new AuraVisionAPI();
    let currentVideoId = null;
    let wsConnection = null;

    // 上传按钮事件
    document.getElementById('activateUpload').addEventListener('click', function() {
        document.getElementById('videoInput').click();
    });

    document.getElementById('videoInput').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 显示上传进度
        const uploadProgress = document.getElementById('uploadProgress');
        uploadProgress.style.display = 'block';

        // 模拟上传进度
        const progressFill = document.getElementById('progressFill');
        const uploadSpeed = document.getElementById('uploadSpeed');
        const uploadRemaining = document.getElementById('uploadRemaining');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            progressFill.style.width = `${progress}%`;
            document.querySelector('.progress-value').textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                // 实际上传
                uploadFile(file);
            }
        }, 50);

        async function uploadFile(file) {
            try {
                const result = await api.uploadVideo(file);
                
                if (result.success) {
                    currentVideoId = result.video_id;
                    
                    // 更新UI显示视频信息
                    document.getElementById('fileName').textContent = file.name;
                    document.getElementById('fileSize').textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
                    
                    // 启用分析按钮
                    document.getElementById('analyzeBtn').disabled = false;
                    
                    // 获取视频元数据
                    const video = document.getElementById('mainVideo');
                    video.src = URL.createObjectURL(file);
                    video.onloadedmetadata = function() {
                        document.getElementById('videoRes').textContent = 
                            `${video.videoWidth}×${video.videoHeight}`;
                        document.getElementById('videoDuration').textContent = 
                            formatTime(video.duration);
                    };
                    
                    // 隐藏上传进度
                    uploadProgress.style.display = 'none';
                }
            } catch (error) {
                console.error('上传失败:', error);
                uploadProgress.style.display = 'none';
            }
        }
    });

    // 开始分析按钮
    document.getElementById('analyzeBtn').addEventListener('click', async function() {
        if (!currentVideoId) return;
        
        const mode = document.getElementById('analysisMode').value;
        
        // 显示分析模态框
        document.getElementById('analysisModal').style.display = 'block';
        
        try {
            // 开始分析
            const result = await api.analyzeVideo(currentVideoId, mode);
            
            if (result.success) {
                // 连接WebSocket获取实时数据
                wsConnection = api.connectWebSocket(currentVideoId, handleRealtimeData);
                
                // 开始轮询状态
                startStatusPolling();
            }
        } catch (error) {
            console.error('分析启动失败:', error);
        }
    });

    // 处理实时数据
    function handleRealtimeData(data) {
        if (data.type === 'realtime_update') {
            const detectionCount = data.data.objects.length;
            const behaviorCount = data.data.behaviors.length;
            const confidence = (data.data.confidence * 100).toFixed(1);
            
            // 更新UI
            document.getElementById('detectionCount').textContent = detectionCount;
            document.getElementById('behaviorCount').textContent = behaviorCount;
            document.getElementById('confidenceScore').textContent = `${confidence}%`;
            
            // 更新当前检测列表
            updateDetectionList(data.data.objects);
            
            // 更新波形图
            updateWaveformVisualization(data.data);
            
            // 更新热力标签
            updateHeatTags(data.data.behaviors);
        } else if (data.type === 'analysis_complete') {
            // 分析完成
            document.getElementById('analysisModal').style.display = 'none';
            showAnalysisComplete(data.data);
        }
    }

    // 轮询状态更新
    function startStatusPolling() {
        const interval = setInterval(async () => {
            if (!currentVideoId) {
                clearInterval(interval);
                return;
            }
            
            try {
                const status = await api.getAnalysisStatus(currentVideoId);
                
                if (status.success) {
                    // 更新进度
                    const progress = status.progress * 100;
                    document.querySelector('.progress-fill').style.width = `${progress}%`;
                    document.querySelector('.progress-value').textContent = `${progress.toFixed(1)}%`;
                    
                    // 更新处理FPS
                    document.getElementById('processingFPS').textContent = 
                        status.statistics.processing_fps.toFixed(1);
                    
                    // 更新模态框中的进度
                    const engineProgress = document.getElementById('engineProgress');
                    if (engineProgress) {
                        engineProgress.style.width = `${progress}%`;
                    }
                    
                    // 如果分析完成，停止轮询
                    if (status.status === 'completed') {
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('获取状态失败:', error);
            }
        }, 1000);
    }

    // 更新检测列表
    function updateDetectionList(objects) {
        const detectionList = document.querySelector('.detection-list');
        detectionList.innerHTML = '';
        
        objects.forEach(obj => {
            const detectionItem = document.createElement('div');
            detectionItem.className = 'detection-item';
            detectionItem.innerHTML = `
                <div class="detection-type">${obj.type}</div>
                <div class="detection-confidence">${(obj.confidence * 100).toFixed(1)}%</div>
            `;
            detectionList.appendChild(detectionItem);
        });
        
        // 更新计数
        document.querySelector('.detection-count').textContent = objects.length;
    }

    // 更新波形可视化
    function updateWaveformVisualization(data) {
        const canvas = document.getElementById('behaviorWave');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制波形
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const intensity = data.objects.length * 0.1 + data.confidence;
        for (let i = 0; i < width; i++) {
            const x = i;
            const y = height / 2 + Math.sin(i * 0.1 + Date.now() * 0.005) * intensity * 20;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    // 更新热力标签
    function updateHeatTags(behaviors) {
        const tagsContainer = document.getElementById('behaviorTags');
        tagsContainer.innerHTML = '';
        
        behaviors.forEach(behavior => {
            const tag = document.createElement('div');
            tag.className = 'heat-tag';
            tag.style.setProperty('--heat', behavior.confidence);
            tag.innerHTML = `
                <span class="tag-label">${behavior.type}</span>
                <span class="tag-value">${(behavior.confidence * 100).toFixed(0)}%</span>
            `;
            tagsContainer.appendChild(tag);
        });
    }

    // 显示分析完成
    function showAnalysisComplete(data) {
        // 更新结果面板
        document.getElementById('totalAnalysis').textContent = 
            data.statistics?.total_detections || 0;
        document.getElementById('anomalyCount').textContent = 
            Math.floor(data.statistics?.total_detections * 0.1) || 0;
        document.getElementById('avgConfidence').textContent = 
            data.statistics?.avg_confidence ? `${(data.statistics.avg_confidence * 100).toFixed(1)}%` : '0%';
        
        // 更新结果表格
        updateResultsTable(data.results);
    }

    // 更新结果表格
    function updateResultsTable(results) {
        const tableBody = document.getElementById('resultsTable');
        tableBody.innerHTML = '';
        
        // 只显示最后10个结果
        const lastResults = results.slice(-10);
        
        lastResults.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTimecode(result.timestamp)}</td>
                <td>${result.behaviors.join(', ') || '无'}</td>
                <td>${(result.confidence * 100).toFixed(1)}%</td>
                <td>${result.objects.length}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 工具函数
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function formatTimecode(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = (seconds % 60).toFixed(3);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;
    }

    // 初始获取系统状态
    async function initializeSystemStatus() {
        try {
            const status = await api.getSystemStatus();
            if (status.success) {
                // 更新系统状态显示
                updateSystemStatusDisplay(status.system_status);
            }
        } catch (error) {
            console.error('获取系统状态失败:', error);
        }
    }

    // 更新系统状态显示
    function updateSystemStatusDisplay(status) {
        // 更新引擎状态
        const engineStatus = document.querySelector('.engine-status');
        if (engineStatus) {
            const statusElement = engineStatus.querySelector('.param-value.active');
            if (statusElement) {
                statusElement.textContent = status.status === 'online' ? '运行中' : '离线';
            }
        }
        
        // 更新系统监控
        document.querySelector('.monitor-fill.gpu').style.width = `${status.gpu_usage}%`;
        document.querySelector('.monitor-value.gpu').textContent = `${status.gpu_usage}%`;
        
        // 更新时钟
        updateClock();
    }

    // 更新时钟
    function updateClock() {
        const now = new Date();
        const timeString = now.toUTCString().split(' ')[4];
        document.getElementById('systemClock').textContent = `${timeString} UTC`;
    }

    // 初始化
    initializeSystemStatus();
    setInterval(updateClock, 1000);
});