import numpy as np
from typing import Dict, List

class AttentionAnalyzer:
    """
    注意力分析器
    基于头部姿态（俯仰角、偏航角）和面部关键点计算注意力分数
    """
    
    def __init__(self):
        self.yaw_threshold = 15      # 偏航角阈值（左右看）
        self.pitch_down_threshold = 20   # 低头阈值
        self.pitch_up_threshold = -15    # 仰头阈值
        
    def predict(self, landmarks: List[List[float]], head_pose: Dict[str, float]) -> float:
        """
        计算注意力分数 (0-100)
        
        Args:
            landmarks: 面部关键点列表 [x, y, z]
            head_pose: 头部姿态 {'pitch': x, 'yaw': y, 'roll': z}
        
        Returns:
            float: 注意力分数
        """
        score = 100.0
        yaw = abs(head_pose.get('yaw', 0))
        pitch = head_pose.get('pitch', 0)
        
        # 1. 偏航角分析（左右看）
        if yaw > self.yaw_threshold:
            # 超过阈值，每度扣1.5分，最多扣40分
            penalty = min((yaw - self.yaw_threshold) * 1.5, 40)
            score -= penalty
        
        # 2. 俯仰角分析（低头或仰头）
        if pitch > self.pitch_down_threshold:
            # 低头（可能在看书、睡觉、玩手机）
            score -= 25
        elif pitch < self.pitch_up_threshold:
            # 仰头（可能看别处）
            score -= 15
            
        # 3. 面部朝向一致性检查（使用关键点）
        if len(landmarks) > 468:
            # 计算面部中心与鼻尖的偏离
            face_center = np.mean(landmarks[0:100], axis=0)
            nose_tip = landmarks[1]
            
            # 水平偏离
            horizontal_deviation = abs(nose_tip[0] - face_center[0])
            if horizontal_deviation > 0.08:
                score -= 15
                
        return float(np.clip(score, 0, 100))
    
    def get_attention_level(self, score: float) -> str:
        """将分数转换为等级"""
        if score >= 80:
            return "高度集中"
        elif score >= 60:
            return "一般注意"
        elif score >= 40:
            return "轻度分心"
        else:
            return "严重走神"