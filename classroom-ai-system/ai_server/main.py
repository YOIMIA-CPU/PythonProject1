"""
课堂AI分析服务器
基于FastAPI的实时学生状态检测系统
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import asyncio
import json
import os
import logging
from datetime import datetime
from collections import defaultdict, deque
import numpy as np
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI应用实例
app = FastAPI(
    title="课堂AI分析系统",
    description="基于计算机视觉的课堂学生状态检测与智能教学辅助系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS配置
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 内存数据存储 ====================
class MemoryStore:
    """内存存储替代Redis，适合演示和轻量级部署"""
    def __init__(self, max_history: int = 100):
        self.classroom_data = {}
        self.history_data = defaultdict(lambda: deque(maxlen=max_history))
        self.max_history = max_history
        
    def set_latest(self, classroom_id: str, data: dict):
        self.classroom_data[classroom_id] = {
            "data": data,
            "timestamp": datetime.now()
        }
        
    def get_latest(self, classroom_id: str):
        return self.classroom_data.get(classroom_id)
    
    def add_history(self, classroom_id: str, data: dict):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.history_data[classroom_id].append(entry)
    
    def get_history(self, classroom_id: str, limit: int = 20):
        return list(self.history_data.get(classroom_id, []))[-limit:]
    
    def list_classrooms(self):
        result = []
        for cid, data in self.classroom_data.items():
            result.append({
                "classroom_id": cid,
                "last_update": data["timestamp"].isoformat(),
                "student_count": len(data["data"].get("student_statuses", []))
            })
        return result

# 初始化存储
store = MemoryStore(max_history=int(os.getenv("MAX_HISTORY", "100")))

# ==================== WebSocket管理器 ====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
    
    async def connect(self, websocket: WebSocket, classroom_id: str):
        await websocket.accept()
        self.active_connections[classroom_id].append(websocket)
        logger.info(f"教室 {classroom_id} 新连接，当前: {len(self.active_connections[classroom_id])}")
    
    def disconnect(self, websocket: WebSocket, classroom_id: str):
        if websocket in self.active_connections[classroom_id]:
            self.active_connections[classroom_id].remove(websocket)
    
    async def broadcast(self, classroom_id: str, message: str):
        if classroom_id not in self.active_connections:
            return
            
        disconnected = []
        for connection in self.active_connections[classroom_id]:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn, classroom_id)

manager = ConnectionManager()

# ==================== 数据模型 ====================
class StudentData(BaseModel):
    student_id: str
    face_bbox: List[int]
    landmarks: List[List[float]]
    head_pose: Dict[str, float]
    eye_aspect_ratio: float
    mouth_aspect_ratio: float
    local_timestamp: float

class AnalysisRequest(BaseModel):
    classroom_id: str = Field(..., description="教室唯一标识")
    course_id: str = Field(..., description="课程ID")
    timestamp: str
    student_count: int
    students: List[StudentData]

class StudentStatus(BaseModel):
    student_id: str
    attention_score: float = Field(..., ge=0, le=100, description="注意力分数0-100")
    fatigue_level: str = Field(..., description="alert/tired/drowsy")
    behavior_tags: List[str]
    engagement_index: float = Field(..., ge=0, le=100)
    suggestions: List[str]

class AnalysisResponse(BaseModel):
    classroom_id: str
    analysis_timestamp: str
    overall_attention: float
    student_statuses: List[StudentStatus]
    teaching_recommendations: List[str]
    alert_flags: List[str]

# ==================== AI分析核心 ====================
class AttentionAnalyzer:
    """注意力分析器 - 基于头部姿态和视线估计"""
    def predict(self, landmarks: List[List[float]], head_pose: Dict[str, float]) -> float:
        score = 100.0
        yaw = abs(head_pose.get('yaw', 0))
        pitch = head_pose.get('pitch', 0)
        
        # 偏航角惩罚（左右看）
        if yaw > 15:
            score -= min((yaw - 15) * 1.5, 40)
        
        # 俯仰角惩罚（低头或仰头）
        if pitch > 20:
            score -= 25
        elif pitch < -15:
            score -= 15
            
        # 基于面部关键点估算视线集中度
        if len(landmarks) > 468:
            face_center = np.mean(landmarks[0:100], axis=0)
            nose_tip = landmarks[1]
            # 简单的偏离检测
            deviation = abs(nose_tip[0] - face_center[0])
            if deviation > 0.08:
                score -= 15
                
        return float(np.clip(score, 0, 100))

class FatigueAnalyzer:
    """疲劳检测器 - 基于EAR和Mouth Aspect Ratio"""
    def __init__(self):
        self.ear_history = defaultdict(lambda: deque(maxlen=30))
        
    def predict(self, ear: float, mar: float, student_id: str) -> str:
        self.ear_history[student_id].append(ear)
        
        if len(self.ear_history[student_id]) < 10:
            return "alert"
            
        ear_array = np.array(self.ear_history[student_id])
        
        # PERCLOS近似：眼睛闭合比例
        closed_frames = np.sum(ear_array < 0.2)
        closed_ratio = closed_frames / len(ear_array)
        
        # 打哈欠检测
        is_yawning = mar > 0.5
        
        if closed_ratio > 0.7:
            return "drowsy"
        elif closed_ratio > 0.3 or is_yawning:
            return "tired"
        return "alert"

class BehaviorAnalyzer:
    """行为分析器"""
    def analyze(self, head_pose: Dict[str, float], fatigue: str) -> List[str]:
        tags = []
        yaw = head_pose.get('yaw', 0)
        pitch = head_pose.get('pitch', 0)
        
        # 视线方向判断
        if abs(yaw) < 15 and abs(pitch) < 20:
            tags.append("looking_front")
        elif pitch > 25:
            tags.append("looking_down")
        elif abs(yaw) > 45:
            tags.append("turning_around")
            
        # 疲劳相关行为
        if fatigue == "drowsy":
            tags.append("eyes_closed")
        if pitch > 35 and fatigue in ["drowsy", "tired"]:
            tags.append("head_dropping")
            
        return tags

# 初始化分析器
attention_analyzer = AttentionAnalyzer()
fatigue_analyzer = FatigueAnalyzer()
behavior_analyzer = BehaviorAnalyzer()

# ==================== 业务逻辑 ====================
def calculate_engagement(attention: float, fatigue: str, behaviors: List[str]) -> float:
    """计算综合参与度指数"""
    score = attention
    penalties = {"alert": 0, "tired": -10, "drowsy": -30}
    score += penalties.get(fatigue, 0)
    
    bonuses = {
        "looking_front": 5,
        "turning_around": -5,
        "head_dropping": -20
    }
    
    for behavior in behaviors:
        score += bonuses.get(behavior, 0)
        
    return float(np.clip(score, 0, 100))

def generate_suggestions(attention: float, fatigue: str, behaviors: List[str]) -> List[str]:
    """生成个性化干预建议"""
    suggestions = []
    
    if fatigue == "drowsy":
        suggestions.append("该学生处于困倦状态，建议轻声提醒或让其站立片刻")
    elif fatigue == "tired":
        suggestions.append("学生略显疲劳，可通过提问吸引注意力")
        
    if attention < 40:
        suggestions.append("注意力严重分散，建议走到学生附近进行干预")
    elif attention < 60:
        suggestions.append("注意力一般，建议增加互动环节")
        
    if "turning_around" in behaviors:
        suggestions.append("学生正在与后方交流，需维持课堂纪律")
        
    return suggestions

def generate_teaching_recommendations(statuses: List[StudentStatus], course_id: str) -> List[str]:
    """生成整体教学策略建议"""
    if not statuses:
        return ["等待数据接入..."]
        
    avg_attention = np.mean([s.attention_score for s in statuses])
    drowsy_ratio = sum(1 for s in statuses if s.fatigue_level == "drowsy") / len(statuses)
    low_engagement = sum(1 for s in statuses if s.engagement_index < 40) / len(statuses)
    
    recommendations = []
    
    if avg_attention < 50:
        recommendations.append("🚨 整体注意力偏低，建议立即插入互动环节或短视频")
    elif avg_attention < 70:
        recommendations.append("⚠️ 部分学生走神，建议增加提问频率")
    
    if drowsy_ratio > 0.3:
        recommendations.append("😴 超过30%学生困倦，建议进行2-3分钟课间活动")
    elif drowsy_ratio > 0.1:
        recommendations.append("☕ 部分学生疲劳，可适当提高音量或改变语速")
        
    if low_engagement > 0.5:
        recommendations.append("📉 半数学生参与度不足，建议检查当前内容难度")
        
    if "math" in course_id.lower() and avg_attention < 65:
        recommendations.append("🧮 数学课程较抽象，建议增加可视化演示")
        
    return recommendations if recommendations else ["✅ 当前课堂状态良好，继续保持"]

def detect_anomalies(statuses: List[StudentStatus]) -> List[str]:
    """检测异常状态"""
    alerts = []
    critical = [s for s in statuses if s.engagement_index < 20]
    
    if len(critical) > 0:
        alerts.append(f"发现{len(critical)}名学生状态异常，需要立即关注")
        
    sleeping = [s for s in statuses if "head_dropping" in s.behavior_tags]
    if len(sleeping) > 2:
        alerts.append(f"检测到{len(sleeping)}名学生可能已进入睡眠状态")
        
    return alerts

# ==================== API端点 ====================
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_classroom(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    分析课堂状态主接口
    接收学生面部特征数据，返回注意力分析和教学建议
    """
    try:
        logger.info(f"收到分析请求: 教室={request.classroom_id}, 学生数={len(request.students)}")
        student_statuses = []
        
        for student in request.students:
            # 并行执行多项分析
            attention = attention_analyzer.predict(student.landmarks, student.head_pose)
            fatigue = fatigue_analyzer.predict(
                student.eye_aspect_ratio, 
                student.mouth_aspect_ratio, 
                student.student_id
            )
            behaviors = behavior_analyzer.analyze(student.head_pose, fatigue)
            engagement = calculate_engagement(attention, fatigue, behaviors)
            suggestions = generate_suggestions(attention, fatigue, behaviors)
            
            student_statuses.append(StudentStatus(
                student_id=student.student_id,
                attention_score=attention,
                fatigue_level=fatigue,
                behavior_tags=behaviors,
                engagement_index=engagement,
                suggestions=suggestions
            ))
        
        overall_attention = float(np.mean([s.attention_score for s in student_statuses])) if student_statuses else 0.0
        
        response = AnalysisResponse(
            classroom_id=request.classroom_id,
            analysis_timestamp=datetime.now().isoformat(),
            overall_attention=overall_attention,
            student_statuses=student_statuses,
            teaching_recommendations=generate_teaching_recommendations(student_statuses, request.course_id),
            alert_flags=detect_anomalies(student_statuses)
        )
        
        # 后台存储和广播
        background_tasks.add_task(save_and_broadcast, request.classroom_id, response)
        
        return response
        
    except Exception as e:
        logger.error(f"分析过程出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

async def save_and_broadcast(classroom_id: str, result: AnalysisResponse):
    """保存结果并广播给所有连接的客户端"""
    data_dict = json.loads(result.json())
    store.set_latest(classroom_id, data_dict)
    store.add_history(classroom_id, data_dict)
    await manager.broadcast(classroom_id, result.json())

@app.get("/classroom/{classroom_id}/status")
async def get_status(classroom_id: str):
    """获取教室实时状态"""
    data = store.get_latest(classroom_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Classroom {classroom_id} not found")
    return data["data"]

@app.get("/classroom/{classroom_id}/history")
async def get_history(classroom_id: str, limit: int = 20):
    """获取历史数据"""
    return {
        "classroom_id": classroom_id,
        "count": len(store.get_history(classroom_id)),
        "data": store.get_history(classroom_id, limit)
    }

@app.get("/classrooms")
async def list_classrooms():
    """列出所有活跃的教室"""
    return store.list_classrooms()

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ==================== WebSocket ====================
@app.websocket("/ws/{classroom_id}")
async def websocket_endpoint(websocket: WebSocket, classroom_id: str):
    await manager.connect(websocket, classroom_id)
    try:
        # 发送当前状态（如果有）
        latest = store.get_latest(classroom_id)
        if latest:
            await websocket.send_text(json.dumps({
                "type": "current",
                "data": latest["data"]
            }))
        
        # 保持连接，处理心跳
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, classroom_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, classroom_id)

# ==================== 调试页面 ====================
@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """简单的内置监控页面"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>课堂AI监控系统</title>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; background: #f5f5f5; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
            .container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
            .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .metric { display: inline-block; margin: 10px 20px; text-align: center; }
            .metric-value { font-size: 32px; font-weight: bold; color: #1890ff; }
            .metric-label { color: #666; font-size: 14px; }
            .status-good { color: #52c41a; }
            .status-warning { color: #faad14; }
            .status-bad { color: #f5222d; }
            .student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
                           gap: 15px; margin-top: 20px; }
            .student-card { border: 2px solid #e8e8e8; border-radius: 8px; padding: 15px; }
            .student-card.good { border-color: #52c41a; background: #f6ffed; }
            .student-card.warning { border-color: #faad14; background: #fffbe6; }
            .student-card.bad { border-color: #f5222d; background: #fff2f0; }
            .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; 
                   margin: 2px; background: #f0f0f0; }
            .alert { background: #fff2f0; border: 1px solid #ffccc7; padding: 10px; border-radius: 4px; 
                     color: #cf1322; margin: 10px 0; }
            .recommendation { background: #e6f7ff; border: 1px solid #91d5ff; padding: 10px; 
                             border-radius: 4px; margin: 5px 0; color: #096dd9; }
            input, button { padding: 8px 16px; margin: 5px; border: 1px solid #d9d9d9; border-radius: 4px; }
            button { background: #1890ff; color: white; cursor: pointer; border: none; }
            button:hover { background: #40a9ff; }
            #log { background: #1f1f1f; color: #0f0; padding: 10px; font-family: monospace; 
                  height: 150px; overflow-y: auto; border-radius: 4px; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎓 课堂AI监控系统</h1>
            <p>实时学生状态检测与教学辅助</p>
        </div>
        
        <div class="container">
            <div class="card">
                <h3>连接设置</h3>
                <input type="text" id="roomId" placeholder="教室ID" value="room_101">
                <button onclick="connect()">连接</button>
                <button onclick="disconnect()">断开</button>
                <span id="status" style="margin-left: 20px; color: #666;">未连接</span>
            </div>

            <div class="card" id="dashboard" style="display:none;">
                <h3>实时概览</h3>
                <div class="metric">
                    <div class="metric-value" id="overall-attention">-</div>
                    <div class="metric-label">平均注意力</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="student-count">-</div>
                    <div class="metric-label">在线学生</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="alert-count">-</div>
                    <div class="metric-label">异常人数</div>
                </div>
                
                <div id="alerts"></div>
                <div id="recommendations"></div>
                
                <h3>学生详情</h3>
                <div class="student-grid" id="students"></div>
            </div>

            <div id="log"></div>
        </div>

        <script>
            let ws = null;
            const log = (msg) => {
                const div = document.getElementById('log');
                div.innerHTML += `[${new Date().toLocaleTimeString()}] ${msg}<br>`;
                div.scrollTop = div.scrollHeight;
            };

            function connect() {
                const roomId = document.getElementById('roomId').value;
                ws = new WebSocket(`ws://${window.location.host}/ws/${roomId}`);
                
                ws.onopen = () => {
                    document.getElementById('status').innerHTML = '<span class="status-good">● 已连接</span>';
                    document.getElementById('dashboard').style.display = 'block';
                    log('WebSocket连接成功');
                };
                
                ws.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    if(data.type !== 'heartbeat' && data.type !== 'pong') {
                        updateDashboard(data.data || data);
                    }
                };
                
                ws.onclose = () => {
                    document.getElementById('status').innerHTML = '<span class="status-bad">● 已断开</span>';
                    log('连接断开');
                };
            }

            function disconnect() {
                if(ws) ws.close();
            }

            function updateDashboard(data) {
                document.getElementById('overall-attention').textContent = 
                    (data.overall_attention || 0).toFixed(1) + '%';
                document.getElementById('student-count').textContent = 
                    data.student_statuses?.length || 0;
                
                const alerts = data.alert_flags || [];
                document.getElementById('alert-count').textContent = alerts.length;
                
                // 渲染警告
                const alertsDiv = document.getElementById('alerts');
                alertsDiv.innerHTML = alerts.map(a => `<div class="alert">⚠️ ${a}</div>`).join('');
                
                // 渲染建议
                const recs = data.teaching_recommendations || [];
                document.getElementById('recommendations').innerHTML = 
                    recs.map(r => `<div class="recommendation">💡 ${r}</div>`).join('');
                
                // 渲染学生卡片
                const students = data.student_statuses || [];
                document.getElementById('students').innerHTML = students.map(s => {
                    let cls = 'good';
                    if(s.engagement_index < 40) cls = 'bad';
                    else if(s.engagement_index < 70) cls = 'warning';
                    
                    const fatigueEmoji = {alert: '😊', tired: '😪', drowsy: '😴'}[s.fatigue_level] || '😐';
                    
                    return `
                        <div class="student-card ${cls}">
                            <strong>学生 ${s.student_id}</strong><br>
                            <small>${fatigueEmoji} ${s.fatigue_level}</small><br>
                            <div style="margin: 10px 0;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                    <small>注意力</small>
                                    <small>${s.attention_score.toFixed(0)}%</small>
                                </div>
                                <div style="background:#f0f0f0; height:6px; border-radius:3px;">
                                    <div style="width:${s.attention_score}%; background:${s.attention_score>70?'#52c41a':s.attention_score>40?'#faad14':'#f5222d'}; 
                                                height:100%; border-radius:3px;"></div>
                                </div>
                            </div>
                            <div>${s.behavior_tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
                            ${s.suggestions.length ? `<small style="color:#999;">💡 ${s.suggestions[0]}</small>` : ''}
                        </div>
                    `;
                }).join('');
            }

            // 自动连接
            window.onload = () => connect();
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"🚀 启动服务器 http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)