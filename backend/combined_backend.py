"""
统一后端（FastAPI 版）- 学生上课状态监测系统（精简实现）
================================================

功能：
- 接收前端上传的视频
- 抽帧（OpenCV，每秒固定帧率）
- （当前阶段）本地生成“模拟检测结果”，不依赖真实 AI 服务器
- 向前端提供每帧学生检测结果（包含 bbox + status + confidence）

重要约定：
- 学生状态仅保留三种英文编码（后端/协议层）：
  - normal
  - distracted
  - sleeping
- 前端负责把英文状态映射为中文展示：
  - normal    -> 正常
  - distracted -> 走神
  - sleeping  -> 打瞌睡
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, List
from uuid import uuid4
from contextlib import asynccontextmanager

import os
import shutil
import time

import cv2
import aiofiles
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Path as PathParam
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:  # 可选依赖
    import psutil
except Exception:  # noqa: BLE001
    psutil = None


# =========================
# 路径与配置
# =========================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
FRAME_DIR = BASE_DIR / "frames"

FRAME_EXTRACT_FPS = 2  # 每秒抽多少帧，与前端说明保持一致


# =========================
# 全局状态
# =========================

# video_id -> {
#   "video_path": str,
#   "frames_dir": str,
#   "frame_files": {frame_id: "frame_0000.jpg"},
#   "detections": {frame_id: [student_dict, ...]},
#   "metadata": {...},
#   "created_at": str,
# }
video_detections: Dict[str, Dict[str, Any]] = {}


# =========================
# 工具函数
# =========================

def clean_and_create(path: Path) -> None:
    """删除目录并重建（干净环境）"""
    if path.exists():
        shutil.rmtree(path)
        print(f"[CLEAN] {path}")
    path.mkdir(parents=True, exist_ok=True)
    print(f"[INIT]  {path}")


def init_runtime_dirs() -> None:
    """启动时确保目录存在（不强制清空，避免误删历史数据）"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[INIT]  UPLOAD_DIR={UPLOAD_DIR}")
    print(f"[INIT]  FRAME_DIR={FRAME_DIR}")


def extract_video_metadata(video_path: str) -> Dict[str, Any]:
    """提取视频元数据"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {}

    fps = cap.get(cv2.CAP_PROP_FPS) or 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = frame_count / fps if fps > 0 else 0

    cap.release()
    return {
        "fps": fps,
        "width": width,
        "height": height,
        "frame_count": frame_count,
        "duration": duration,
    }


def process_video(video_path: str, frame_dir: str, fps: int = FRAME_EXTRACT_FPS) -> Dict[str, Any]:
    """
    视频处理：
    - 每秒按 fps 抽帧
    - 统一缩放到 640x360
    - 保存为 jpg

    返回：
        {
          "video_path": str,
          "frames": [ { frame_id, timestamp }, ... ],
          "frame_files": { frame_id: "frame_0000.jpg", ... }
        }
    """
    frame_dir_path = Path(frame_dir)
    frame_dir_path.mkdir(parents=True, exist_ok=True)

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"视频文件不存在: {video_path}")

    print(f"[INFO] 开始处理视频: {video_path}")
    print(f"[INFO] 帧输出目录: {frame_dir}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0:
        video_fps = 25.0

    frame_interval = int(video_fps / fps) if fps > 0 else 1
    if frame_interval <= 0:
        frame_interval = 1

    frames: List[Dict[str, Any]] = []
    frame_files: Dict[int, str] = {}

    frame_index = 0
    saved_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % frame_interval == 0:
            frame = cv2.resize(frame, (640, 360))
            frame_name = f"frame_{saved_index:04d}.jpg"
            frame_path = frame_dir_path / frame_name

            ok = cv2.imwrite(str(frame_path), frame)
            if not ok:
                print(f"[WARN] 保存帧失败: {frame_name}")
            else:
                print(f"[INFO] 已保存帧: {frame_name}")

            frame_files[saved_index] = frame_name

            frames.append(
                {
                    "frame_id": saved_index,
                    "timestamp": round(saved_index / fps, 3),
                }
            )
            saved_index += 1

        frame_index += 1

    cap.release()
    print(f"[INFO] 处理完成，共保存 {saved_index} 帧")

    return {
        "video_path": video_path,
        "frames": frames,
        "frame_files": frame_files,
    }


def generate_mock_detections(features: Dict[str, Any]) -> Dict[int, List[Dict[str, Any]]]:
    """
    生成模拟检测数据（用于当前阶段，无 AI 服务器时调试）

    学生状态只使用三种英文编码：
      - normal
      - distracted
      - sleeping
    """
    import random

    detections: Dict[int, List[Dict[str, Any]]] = {}
    frames = features.get("frames", [])

    for frame_info in frames:
        frame_id = frame_info.get("frame_id", 0)
        num_students = random.randint(2, 4)

        students: List[Dict[str, Any]] = []
        for i in range(num_students):
            # 简单随机一个大致合理的 bbox（640x360 空间里）
            x = random.randint(40, 520)
            y = random.randint(40, 240)
            width = random.randint(60, 120)
            height = random.randint(80, 160)

            # 约 70% 正常，30% 异常（走神/打瞌睡）
            status_choices = [
                "normal",
                "normal",
                "normal",
                "normal",
                "normal",
                "distracted",
                "sleeping",
            ]
            status = random.choice(status_choices)
            confidence = round(random.uniform(0.75, 0.98), 2)

            students.append(
                {
                    "student_id": i + 1,
                    "bbox": {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height,
                    },
                    "status": status,
                    "confidence": confidence,
                }
            )

        detections[frame_id] = students

    print(f"[INFO] 已生成 {len(detections)} 帧的模拟检测数据")
    return detections


# =========================
# FastAPI 生命周期
# =========================


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("====== Combined Backend Starting ======")
    init_runtime_dirs()
    print("====== Combined Backend Ready ======")
    yield
    print("====== Combined Backend Shutting Down ======")


app = FastAPI(
    title="Combined AuraVision Backend (Simplified)",
    description="学生上课状态监测后端（上传 + 抽帧 + 模拟检测）",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# 基础接口
# =========================


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "message": "学生上课状态监测系统 - Backend API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "upload": "/api/upload",
            "frame": "/api/frame/{video_id}/{frame_id}",
            "results": "/api/results/{video_id}",
            "system_status": "/api/system/status",
        },
    }


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"ok": True, "msg": "combined backend running"}


@app.get("/api/system/status")
async def system_status() -> JSONResponse:
    """简单系统状态（如未安装 psutil，则返回占位信息）"""
    if psutil is None:
        data = {
            "success": True,
            "system_status": {
                "status": "online",
                "note": "psutil 未安装，返回占位数据",
            },
        }
        return JSONResponse(content=data)

    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    data = {
        "success": True,
        "system_status": {
            "status": "online",
            "cpu_percent": cpu,
            "memory_percent": mem.percent,
        },
    }
    return JSONResponse(content=data)


# =========================
# 上传 & 抽帧 & 检测
# =========================


@app.post("/api/upload")
async def upload_and_process_video(
    file: UploadFile = File(None),
    video: UploadFile = File(None),
) -> JSONResponse:
    """
    接收前端上传视频 -> 清理上一个视频数据 -> 抽帧 -> 生成模拟检测结果

    - 支持字段名 file / video
    - 每次新上传前，会清空 uploads/ 与 frames/ 目录（只保留当前一次运行的数据）
    """
    upload_file = file or video
    if upload_file is None:
        raise HTTPException(status_code=400, detail="未找到上传文件字段，使用 'file' 或 'video'")

    # 每次上传前清空旧数据（磁盘 + 内存）
    try:
        clean_and_create(UPLOAD_DIR)
        clean_and_create(FRAME_DIR)
        video_detections.clear()
        print("[INFO] 已清理上一轮上传产生的数据")
    except Exception as e:  # noqa: BLE001
        print(f"[WARN] 清理旧数据失败: {e}")

    video_id = str(uuid4())

    # 保存文件
    save_path = UPLOAD_DIR / upload_file.filename
    try:
        content = await upload_file.read()
        async with aiofiles.open(save_path, "wb") as f:
            await f.write(content)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"保存视频失败: {e}") from e

    metadata = extract_video_metadata(str(save_path))

    # 为当前视频专门创建帧目录
    video_frame_dir = FRAME_DIR / save_path.stem
    video_frame_dir.mkdir(parents=True, exist_ok=True)

    # 抽帧
    try:
        features = process_video(str(save_path), str(video_frame_dir), fps=FRAME_EXTRACT_FPS)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"视频处理失败: {e}") from e

    # 生成模拟检测结果
    detections = generate_mock_detections(features)

    video_detections[video_id] = {
        "video_path": str(save_path),
        "video_filename": upload_file.filename,
        "frames_dir": str(video_frame_dir),
        "frame_files": features.get("frame_files", {}),
        "detections": detections,
        "metadata": metadata,
        "created_at": datetime.now().isoformat(),
    }

    # 统计异常学生数量
    total_abnormal = sum(
        len([s for s in students if s.get("status") != "normal"])
        for students in detections.values()
    )

    resp = {
        "success": True,
        "video_id": video_id,
        "video": upload_file.filename,
        "frames_count": len(features.get("frames", [])),
        "abnormal_count": total_abnormal,
    }
    return JSONResponse(content=resp)


@app.get("/api/frame/{video_id}/{frame_id}")
async def get_frame_detections(
    video_id: str,
    frame_id: int = PathParam(..., description="帧ID"),
) -> JSONResponse:
    """
    获取单帧的检测结果（包含所有学生的 bbox + 状态）
    """
    if video_id not in video_detections:
        raise HTTPException(status_code=404, detail=f"视频ID不存在: {video_id}")

    video_data = video_detections[video_id]
    detections = video_data["detections"]
    frame_files = video_data["frame_files"]

    if frame_id not in detections:
        raise HTTPException(status_code=404, detail=f"帧ID不存在: {frame_id}")

    students = detections[frame_id]
    abnormal_students = [s for s in students if s.get("status") != "normal"]

    return JSONResponse(
        content={
            "success": True,
            "frame_id": frame_id,
            "frame_file": frame_files.get(frame_id, f"frame_{frame_id:04d}.jpg"),
            "students": students,
            "abnormal_students": abnormal_students,
        }
    )


@app.get("/api/results/{video_id}")
async def get_all_results(video_id: str) -> JSONResponse:
    """
    获取某个视频的所有检测结果（按帧）
    """
    if video_id not in video_detections:
        raise HTTPException(status_code=404, detail=f"视频ID不存在: {video_id}")

    video_data = video_detections[video_id]
    detections = video_data["detections"]

    frames: List[Dict[str, Any]] = []
    for frame_id, students in sorted(detections.items(), key=lambda kv: kv[0]):
        frames.append(
            {
                "frame_id": frame_id,
                "students": students,
            }
        )

    return JSONResponse(
        content={
            "success": True,
            "video_id": video_id,
            "frames": frames,
            "metadata": video_data.get("metadata", {}),
        }
    )


if __name__ == "__main__":
    import uvicorn

    print(
        """
==================================================
  学生上课状态监测系统 - Backend 启动中...
  地址: http://localhost:8000
  文档: http://localhost:8000/docs
==================================================
"""
    )
    uvicorn.run("combined_backend:app", host="0.0.0.0", port=8000, reload=True)


