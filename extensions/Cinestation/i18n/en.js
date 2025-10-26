"use strict";
module.exports = {
    description: "Smart camera system",
    VCamAim: {
        trackedObjectOffset: "Position offset in local space from the center of the LookAt target. \nFine-tunes the position of the tracked object when the desired area is not the center of the tracked target.",
    },
    VCamAutoDoly: {
        enable: "Enable automatic positioning",
        searchRadius: "Number of segments to search on each side of the current position.\nA value of 0 searches the entire path.",
        searchResolution: "Divides the track into multiple segments for searching.\nHigher values yield more accurate results but consume more performance.",
    },
    VCamComposer: {
        lookaheadTime: "Adjusts the offset dynamically based on the motion speed of the LookAt target.\nEstimates where the target will appear in the next few seconds.",
        lookaheadDamping: "Controls the damping coefficient for the estimation.\nHigher values result in stronger damping and delayed prediction, which helps eliminate jitter caused by prediction.",
        lookatDamping: "Damping coefficient for aiming at the target.\nSmaller values allow faster tracking within the dead zone, while larger values result in slower aiming speed.",
        deadZoneWidth: "Width of the dead zone.\nThe camera won't rotate if the target is within this zone.",
        deadZoneHeight: "Height of the dead zone.\nThe camera won't rotate if the target is within this zone.",
        softZoneWidth: "Width of the soft zone.\nThe camera will rotate to the dead zone within the specified lookatDamping time if the target is within this zone.",
        softZoneHeight: "Height of the soft zone.\nThe camera will rotate to the dead zone within the specified lookatDamping time if the target is within this zone.",
    },
    VCamFreeLook: {
        forbidX: "Disable horizontal rotation",
        forbidY: "Disable vertical rotation",
        forbidZ: "Disable camera translation",
        forbidPan: "Disable camera panning",
        rotateSpeed: "Rotation speed",
        rotateSmoothing: "Rotation smoothing factor.\nHigher values result in greater rotational inertia.",
        panSpeed: "Panning speed",
        panSmoothing: "Panning smoothing factor.\nHigher values result in greater panning inertia.",
        followOffset: "Offset between the camera and the Follow target, initialized as (0,0,-10)",
        followDamping: "Damping coefficient for following.\nSmaller values make the camera more sensitive, while larger values introduce more delay.",
        distanceMin: "Minimum distance from the LookAt target",
        distanceMax: "Maximum distance between the camera and the LookAt target",
    },
    VCamNoise: {
        profile: "Multiple preset noise parameters",
        amplitudeGain: "Amplitude gain. Higher values result in more noticeable camera shake.",
        frequncyGain: "Frequency gain. Higher values result in higher camera shake frequencies.",
    },
    VCamTracked: {
        path: "Path for camera movement.\nThis property must be a CinestationSmoothPath.",
        progress: "Progress of movement.\nA value of 0 represents the first position point, while 1 represents the second point, and so on.",
        damping: "Damping coefficient for following.\nSmaller values make the camera more sensitive, while larger values introduce more delay.",
    },
    CinestationBlendDefinition: {
        style: "Interpolation type for blending.\nDefault is QuarticInOut.",
        time: "Acceleration time"
    },
    VirtualCamera: {
        debug: "Display dead zones and soft zones at runtime",
        priority: "Priority of the virtual camera.\nHigher values indicate higher priority. The default value is 10.",
        lookAt: "LookAt target",
        follow: "Follow target",
    }
};