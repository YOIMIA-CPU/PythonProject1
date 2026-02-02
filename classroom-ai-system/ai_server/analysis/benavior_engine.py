from typing import Dict, List

class BehaviorAnalyzer:
    """
    学生课堂行为分析器
    基于头部姿态和疲劳状态识别具体行为
    """
    
    def __init__(self):
        # 行为定义与判定阈值
        self.thresholds = {
            'yaw_front': 15,      # 正视前方阈值
            'yaw_side': 45,       # 侧视阈值
            'pitch_down': 25,     # 低头阈值
            'pitch_sleep': 35,    # 瞌睡低头阈值
        }
    
    def analyze(self, head_pose: Dict[str, float], fatigue: str) -> List[str]:
        """
        分析学生当前行为
        
        Args:
            head_pose: 头部姿态角度
            fatigue: 疲劳状态 ('alert', 'tired', 'drowsy')
            
        Returns:
            List[str]: 行为标签列表
        """
        tags = []
        yaw = head_pose.get('yaw', 0)
        pitch = head_pose.get('pitch', 0)
        
        # 1. 视线方向分析
        if abs(yaw) <= self.thresholds['yaw_front']:
            if abs(pitch) <= 20:
                tags.append("looking_front")  # 看前方（黑板/老师）
            elif pitch > self.thresholds['pitch_down']:
                tags.append("looking_down")   # 低头（看书/记笔记/手机）
        elif abs(yaw) > self.thresholds['yaw_side']:
            tags.append("turning_around")     # 转头（看旁边/后方）
        elif yaw > 20:
            tags.append("looking_left")       # 向左看
        elif yaw < -20:
            tags.append("looking_right")      # 向右看
            
        # 2. 疲劳相关行为
        if fatigue == "drowsy":
            tags.append("eyes_closed")        # 闭眼
            if pitch > self.thresholds['pitch_sleep']:
                tags.append("head_dropping")  # 点头（瞌睡）
        elif fatigue == "tired":
            tags.append("rubbing_eyes")       # 可能揉眼（推测）
            
        # 3. 姿态异常
        if abs(pitch) > 40:
            tags.append("head_down")          # 头过低
            
        return tags
    
    def is_attentive(self, behaviors: List[str]) -> bool:
        """判断是否在专注听课"""
        attentive_tags = {'looking_front', 'looking_down'}  # down可能是看书
        distracting_tags = {'turning_around', 'head_dropping', 'eyes_closed'}
        
        has_attentive = len(set(behaviors) & attentive_tags) > 0
        has_distracting = len(set(behaviors) & distracting_tags) > 0
        
        return has_attentive and not has_distracting