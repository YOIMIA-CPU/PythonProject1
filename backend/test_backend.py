"""
快速测试后端接口
运行方式: python test_backend.py
"""
import requests

BASE_URL = "http://localhost:8000"


def test_health():
    """测试健康检查"""
    print("=" * 50)
    print("测试 1: 健康检查")
    print("=" * 50)
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"状态码: {r.status_code}")
        print(f"响应: {r.json()}")
        print("✅ 健康检查通过\n")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"❌ 健康检查失败: {e}\n")
        return False


def test_system_status():
    """测试系统状态"""
    print("=" * 50)
    print("测试 2: 系统状态")
    print("=" * 50)
    try:
        r = requests.get(f"{BASE_URL}/api/system/status")
        print(f"状态码: {r.status_code}")
        data = r.json()
        print(f"系统状态: {data.get('system_status', {})}")
        print("✅ 系统状态查询通过\n")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"❌ 系统状态查询失败: {e}\n")
        return False


def test_upload():
    """测试上传接口（需要视频文件）"""
    print("=" * 50)
    print("测试 3: 视频上传")
    print("=" * 50)
    print("提示: 这个测试需要提供视频文件路径")
    print("如果需要测试，请修改下面的 video_path 变量\n")

    # video_path = "ceshi.mp4"  # 取消注释并填入你的视频路径
    # try:
    #     with open(video_path, 'rb') as f:
    #         files = {'file': f}
    #         r = requests.post(f"{BASE_URL}/api/upload", files=files)
    #         print(f"状态码: {r.status_code}")
    #         print(f"响应: {r.json()}")
    #         print("✅ 视频上传通过\n")
    #         return True
    # except Exception as e:
    #     print(f"❌ 视频上传失败: {e}\n")
    #     return False

    print("⏭️  跳过上传测试（需要视频文件）\n")
    return None


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("开始测试后端接口...")
    print("=" * 50 + "\n")

    results = []
    results.append(("健康检查", test_health()))
    results.append(("系统状态", test_system_status()))
    results.append(("视频上传", test_upload()))

    print("=" * 50)
    print("测试总结")
    print("=" * 50)
    for name, result in results:
        if result is True:
            print(f"✅ {name}: 通过")
        elif result is False:
            print(f"❌ {name}: 失败")
        else:
            print(f"⏭️  {name}: 跳过")

    print("\n" + "=" * 50)
    print("后端服务地址: http://localhost:8000")
    print("API 文档地址: http://localhost:8000/docs")
    print("=" * 50)


