import numpy as np
from collections import defaultdict, deque
from typing import Dict

class FatigueAnalyzer:
    """
    疲劳检测器
    基于眼睛纵横比(EAR)和嘴巴纵横比(MAR)的时序分析
    """
    
    def __init__(self, history_size: int = 30):
        """
        Args:
            history_size: 历史帧数，用于计算PERCLOS（约1秒，假设30fps）
        """
        self.ear_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=history_size))
        self.mar_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=10))
        
        # 阈值配置
        self.ear_closed_threshold = 0.2      # 眼睛闭合阈值
        self.mar_yawn_threshold = 0.5        # 打哈欠阈值
        self.perclos_drowsy = 0.3            # 困倦阈值（30%时间闭眼）
        self.perclos_tired = 0.15            # 疲劳阈值（15%时间闭眼）
        
    def predict(self, ear: float, mar: float, student_id: str) -> str:
        """
        检测疲劳状态
        
        Args:
            ear: 眼睛纵横比 (Eye Aspect Ratio)
            mar: 嘴巴纵横比 (Mouth Aspect Ratio)
            student_id: 学生唯一标识
            
        Returns:
            str: 'alert'(清醒), 'tired'(疲劳), 'drowsy'(困倦)
        """
        # 添加到历史记录
        self.ear_history[student_id].append(ear)
        self.mar_history[student_id].append(mar)
        
        # 数据不足时默认为清醒
        if len(self.ear_history[student_id]) < 10:
            return "alert"
            
        ear_array = np.array(self.ear_history[student_id])
        
        # 计算PERCLOS (Percentage of Eye Closure)
        # 眼睛闭合帧数占比
        closed_frames = np.sum(ear_array < self.ear_closed_threshold)
        perclos = closed_frames / len(ear_array)
        
        # 检测打哈欠（嘴巴张大）
        mar_array = np.array(self.mar_history[student_id])
        is_yawning = np.mean(mar_array) > self.mar_yawn_threshold
        
        # 决策逻辑
        if perclos > self.perclos_drowsy:
            return "drowsy"  # 困倦（可能睡觉）
        elif perclos > self.perclos_tired or is_yawning:
            return "tired"   # 疲劳
        else:
            return "alert"   # 清醒
            
    def get_eye_state(self, ear: float) -> str:
        """根据EAR判断眼睛状态"""
        if ear < 0.2:
            return "closed"
        elif ear < 0.25:
            return "closing"
        else:
            return "open"