"""
启动后端服务的脚本
运行方式: python start_server.py
"""
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("正在启动学生上课状态监测系统后端...")
    print("=" * 60)
    print("服务地址: http://localhost:8000")
    print("API 文档: http://localhost:8000/docs")
    print("健康检查: http://localhost:8000/health")
    print("=" * 60)
    print("按 Ctrl+C 停止服务")
    print("=" * 60 + "\n")
    
    try:
        uvicorn.run(
            "combined_backend:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\n服务已停止")

