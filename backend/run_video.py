from video_processor import extract_frames

frames = extract_frames(
    video_path="ceshi.mp4",   # 换成你的视频路径
    output_dir="frames",
    sample_fps=1
)

print(f"共抽取 {len(frames)} 帧")
