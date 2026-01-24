import cv2
import os
import time


def process_video(video_path, frame_dir, fps=1):
    """
    视频处理主函数：
    - 每秒抽 fps 帧
    - 保存图片
    - 生成"占位特征"（后面你替换成真实 OpenCV 特征）
    """
    # 确保输出目录存在
    if not os.path.exists(frame_dir):
        os.makedirs(frame_dir)
        print(f"[INFO] 创建目录: {frame_dir}")
    
    # 检查视频文件是否存在
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"视频文件不存在: {video_path}")
    
    print(f"[INFO] 开始处理视频: {video_path}")
    print(f"[INFO] 输出目录: {frame_dir}")

    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")
    
    video_fps = cap.get(cv2.CAP_PROP_FPS)

    if video_fps <= 0:
        video_fps = 25  # 兜底

    frame_interval = int(video_fps / fps)
    if frame_interval <= 0:
        frame_interval = 1

    frames_data = []
    frame_index = 0
    saved_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % frame_interval == 0:
            # 统一缩放，防止性能炸
            frame = cv2.resize(frame, (640, 360))

            frame_name = f"frame_{saved_index:04d}.jpg"
            frame_path = os.path.join(frame_dir, frame_name)
            
            # 保存图片并检查是否成功
            success = cv2.imwrite(frame_path, frame)
            if success:
                print(f"[INFO] 已保存: {frame_name}")
            else:
                print(f"[WARNING] 保存失败: {frame_name}")

            # ===== 这里是“假特征”（后面你替换）=====
            fake_feature = {
                "frame_id": saved_index,
                "timestamp": round(time.time(), 2),
                "head_pose": {
                    "pitch": 0.0,
                    "yaw": 0.0
                },
                "eye_ratio": 0.3
            }

            frames_data.append(fake_feature)
            saved_index += 1

        frame_index += 1

    cap.release()
    
    print(f"[INFO] 处理完成，共保存 {saved_index} 帧图片")

    return {
        "video_path": video_path,
        "frames": frames_data
    }
