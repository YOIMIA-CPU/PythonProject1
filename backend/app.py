from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import shutil

from video_processor import process_video

app = Flask(__name__)
CORS(app)

# =========================
# 配置
# =========================

AI_SERVER_URL = "http://127.0.0.1:8001/predict"
AI_SERVER_TIMEOUT = 15  # 超时时间（秒）
AI_SERVER_ENABLED = True  # 是否启用AI服务器（False时跳过AI调用）

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FRAME_DIR = os.path.join(BASE_DIR, "frames")


# =========================
# 启动时清理目录
# =========================

def clean_and_create(path):
    if os.path.exists(path):
        shutil.rmtree(path)
        print(f"[CLEAN] {path}")
    os.makedirs(path)
    print(f"[INIT] {path}")


def init_runtime_dirs():
    clean_and_create(UPLOAD_DIR)
    clean_and_create(FRAME_DIR)


# =========================
# AI 服务器调用
# =========================

def call_ai_server(features):
    """
    调用AI服务器进行预测
    
    Args:
        features: 视频特征数据（字典格式）
    
    Returns:
        dict: AI服务器返回的结果，如果失败则返回错误信息
    """
    if not AI_SERVER_ENABLED:
        print("[INFO] AI服务器未启用，跳过AI调用")
        return {
            "status": "disabled",
            "confidence": 0.0,
            "message": "AI服务器未启用"
        }
    
    try:
        print(f"[AI] 发送数据到AI服务器: {AI_SERVER_URL}")
        print(f"[AI] 数据大小: {len(features.get('frames', []))} 帧")
        
        r = requests.post(
            AI_SERVER_URL, 
            json=features, 
            timeout=AI_SERVER_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        r.raise_for_status()
        ai_result = r.json()
        
        print(f"[AI] AI服务器响应成功")
        return ai_result
        
    except requests.exceptions.Timeout:
        error_msg = f"AI服务器请求超时（{AI_SERVER_TIMEOUT}秒）"
        print(f"[AI] {error_msg}")
        return {
            "status": "timeout",
            "confidence": 0.0,
            "error": error_msg
        }
    except requests.exceptions.ConnectionError:
        error_msg = f"无法连接到AI服务器: {AI_SERVER_URL}"
        print(f"[AI] {error_msg}")
        return {
            "status": "connection_error",
            "confidence": 0.0,
            "error": error_msg
        }
    except requests.exceptions.HTTPError as e:
        error_msg = f"AI服务器HTTP错误: {e.response.status_code}"
        print(f"[AI] {error_msg}")
        return {
            "status": "http_error",
            "confidence": 0.0,
            "error": error_msg
        }
    except Exception as e:
        error_msg = f"AI服务器调用失败: {str(e)}"
        print(f"[AI] {error_msg}")
        return {
            "status": "unknown",
            "confidence": 0.0,
            "error": error_msg
        }


# =========================
# 接口
# =========================

@app.get("/health")
def health():
    return jsonify({"ok": True, "msg": "backend running"})


@app.post("/api/test")
def test_video_processing():
    """
    测试接口：处理 backend 目录下的 ceshi.mp4
    用于测试视频处理功能，无需上传文件
    """
    test_video_path = os.path.join(BASE_DIR, "ceshi.mp4")
    
    if not os.path.exists(test_video_path):
        return jsonify({"error": f"测试视频不存在: {test_video_path}"}), 404
    
    print(f"[TEST] 开始处理测试视频: ceshi.mp4")
    
    # 1️⃣ 本地视频处理（抽帧 / 特征）
    try:
        features = process_video(test_video_path, FRAME_DIR)
        print(f"[SUCCESS] 测试视频处理完成: ceshi.mp4")
    except Exception as e:
        print(f"[ERROR] 测试视频处理失败: {str(e)}")
        return jsonify({"error": f"视频处理失败: {str(e)}"}), 500

    # 2️⃣ 发送给 AI 服务器
    ai_result = call_ai_server(features)

    return jsonify({
        "video": "ceshi.mp4",
        "frames": len(features["frames"]),
        "ai_result": ai_result,
        "message": "测试处理完成，图片已保存到 frames 目录"
    })


@app.post("/api/upload")
def upload_video():
    """
    接收视频 → 本地处理 → 调 AI → 返回结果
    """
    if "video" not in request.files:
        return jsonify({"error": "no video uploaded"}), 400

    video_file = request.files["video"]
    video_path = os.path.join(UPLOAD_DIR, video_file.filename)
    video_file.save(video_path)

    # 1️⃣ 本地视频处理（抽帧 / 特征）
    try:
        features = process_video(video_path, FRAME_DIR)
        print(f"[SUCCESS] 视频处理完成: {video_file.filename}")
    except Exception as e:
        print(f"[ERROR] 视频处理失败: {str(e)}")
        return jsonify({"error": f"视频处理失败: {str(e)}"}), 500

    # 2️⃣ 发送给 AI 服务器
    ai_result = call_ai_server(features)

    return jsonify({
        "video": video_file.filename,
        "frames": len(features["frames"]),
        "ai_result": ai_result
    })


# =========================
# 入口
# =========================

def auto_process_test_video():
    """
    启动时自动处理测试视频（如果存在）
    """
    test_video_path = os.path.join(BASE_DIR, "ceshi.mp4")
    
    if os.path.exists(test_video_path):
        print("=" * 50)
        print("[AUTO] 检测到测试视频，开始自动处理...")
        print("=" * 50)
        try:
            features = process_video(test_video_path, FRAME_DIR)
            print("=" * 50)
            print(f"[AUTO] 自动处理完成！共处理 {len(features['frames'])} 帧")
            print(f"[AUTO] 图片已保存到: {FRAME_DIR}")
            print("=" * 50)
        except Exception as e:
            print(f"[AUTO] 自动处理失败: {str(e)}")
    else:
        print(f"[INFO] 未找到测试视频: {test_video_path}")
        print(f"[INFO] 可以通过 POST /api/test 接口手动触发处理")


if __name__ == "__main__":
    print("====== Backend Starting ======")
    init_runtime_dirs()
    
    # 自动处理测试视频
    auto_process_test_video()
    
    print("====== Backend Ready ======")
    print(f"[INFO] 服务器运行在: http://0.0.0.0:5000")
    print(f"[INFO] 健康检查: GET http://localhost:5000/health")
    print(f"[INFO] 上传视频: POST http://localhost:5000/api/upload")
    print(f"[INFO] 测试处理: POST http://localhost:5000/api/test")
    print("=" * 50)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
