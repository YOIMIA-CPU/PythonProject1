"""
测试脚本：直接测试视频处理功能
运行方式: python test_video.py
"""
import os
from video_processor import process_video

# 配置
VIDEO_FILE = "ceshi.mp4"  # 视频文件名
OUTPUT_DIR = "frames"      # 输出目录

if __name__ == "__main__":
    # 获取当前脚本所在目录
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    video_path = os.path.join(BASE_DIR, VIDEO_FILE)
    frame_dir = os.path.join(BASE_DIR, OUTPUT_DIR)
    
    # 检查视频文件是否存在
    if not os.path.exists(video_path):
        print(f"[ERROR] 视频文件不存在: {video_path}")
        print(f"[INFO] 请确保 {VIDEO_FILE} 在 backend 目录下")
        exit(1)
    
    print("=" * 50)
    print("开始测试视频处理...")
    print("=" * 50)
    
    try:
        # 处理视频
        result = process_video(video_path, frame_dir, fps=1)
        
        print("=" * 50)
        print("处理结果:")
        print(f"  视频路径: {result['video_path']}")
        print(f"  处理帧数: {len(result['frames'])}")
        print(f"  输出目录: {frame_dir}")
        print("=" * 50)
        
        # 检查输出目录中的文件
        if os.path.exists(frame_dir):
            files = [f for f in os.listdir(frame_dir) if f.endswith('.jpg')]
            print(f"输出目录中的图片文件数: {len(files)}")
            if files:
                print(f"前5个文件: {files[:5]}")
        
    except Exception as e:
        print(f"[ERROR] 处理失败: {str(e)}")
        import traceback
        traceback.print_exc()

