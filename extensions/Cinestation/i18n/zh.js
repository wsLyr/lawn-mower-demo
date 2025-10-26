"use strict";
module.exports = {
    description: "智能相机系统",
    VCamAim: {
        trackedObjectOffset: "从LookAt目标的中心作局部空间的位置偏移。 \n所需区域不是跟踪目标的中心时，微调跟踪目标的位置",
    },
    VCamAutoDoly: {
        enable: "开启自动定位",
        searchRadius: "当前位置两侧搜索的片段数量。\n数值为0时，搜索整个路径",
        searchResolution: "将轨道分成多个片段来搜索。\n数值越大，结果越精确，性能消耗也越大",
    },
    VCamComposer: {
        lookaheadTime: "根据LookAt目标的运动速度，动态调整偏移量。\n预估了目标将在未来几秒内出现的位置",
        lookaheadDamping: "控制预估的阻尼系数。\n数值越大阻尼越强，预测越滞后，可以消除因为预测带来的抖动",
        lookatDamping: "瞄准目标的阻尼系数。\n数值越小，可以更快的将目标保持在死区，数值越大，瞄准速度越慢",
        deadZoneWidth: "死区宽度。\n如果目标在死区内，相机则不会旋转",
        deadZoneHeight: "死区高度。\n如果目标在死区内，相机则不会旋转",
        softZoneWidth: "软区宽度。\n如果目标在软区内，相机将在lookatDamping指定时间内旋转到死区",
        softZoneHeight: "软区高度。\n如果目标在软区内，相机将在lookatDamping指定时间内旋转到死区",
    },
    VCamFreeLook: {
        forbidX: "禁止水平方向旋转",
        forbidY: "禁止垂直方向旋转",
        forbidZ: "禁止相机推移",
        forbidPan: "禁止相机平移",
        rotateSpeed: "旋转速度",
        rotateSmoothing: "旋转平滑系数。\n数值越大旋转惯性越大",
        panSpeed: "平移速度",
        panSmoothing: "平移平滑系数。\n数值越大平移惯性越大",
        followOffset: "与Follow目标之间的位移，初始值为(0,0,-10)",
        followDamping: "跟随阻尼系数。\n数字越小相机越灵敏，越大越迟顿",
        distanceMin: "与LookAt目标最小的距离",
        distanceMax: "与LookAt目标之间最大的距离",
    },
    VCamNoise: {
        profile: "多种预置噪声参数",
        amplitudeGain: "幅度增益。数值越大相机晃动幅度越明显",
        frequncyGain: "频率增益。数值越大相机晃动频率越高",
    },
    VCamTracked: {
        path: "相机移动的路径。\n此属性必须是CinestationSmoothPath",
        progress: "移动进度。\n数值0表示第一个位置点，数值1表示第二个位置点，以此类推。",
        damping: "跟随阻尼系数。\n数字越小相机越灵敏，越大越迟顿",
    },
    CinestationBlendDefinition: {
        style: "混合插值类型。\n默认是QuarticInOut",
        time: "加速时间"
    },
    VirtualCamera: {
        debug: "在运行时显示死区和软区",
        priority: "虚拟相机优先级。\n数值越大优先级越高，默认值是10",
        lookAt: "瞄准目标",
        follow: "跟踪目标",
    }
};