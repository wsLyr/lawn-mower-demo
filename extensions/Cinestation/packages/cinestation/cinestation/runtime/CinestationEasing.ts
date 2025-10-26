let {
    PI,
    cos,
    sin,
    pow,
    sqrt,
} = Math;

export function LinearNone(k: number) {
    return k;
}

export function QuadraticIn(k: number) {
    return k * k;
}

export function QuadraticOut(k: number) {
    return k * (2 - k);
}

export function QuadraticInOut(k: number) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k;
    }
    return - 0.5 * (--k * (k - 2) - 1);
}

export function CubicIn(k: number) {
    return k * k * k;
}

export function CubicOut(k: number) {
    return --k * k * k + 1;
}

export function CubicInOut(k: number) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k + 2);
}

export function QuarticIn(k: number) {
    return k * k * k * k;
}

export function QuarticOut(k: number) {
    return 1 - (--k * k * k * k);
}

export function QuarticInOut(k: number) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k;
    }
    return - 0.5 * ((k -= 2) * k * k * k - 2);
}

export function QuinticIn(k: number) {
    return k * k * k * k * k;
}

export function QuinticOut(k: number) {
    return --k * k * k * k * k + 1;
}

export function QuinticInOut(k: number) {
    if ((k *= 2) < 1) {
        return 0.5 * k * k * k * k * k;
    }
    return 0.5 * ((k -= 2) * k * k * k * k + 2);
}

export function SinusoidalIn(k: number) {
    return 1 - cos(k * PI / 2);
}

export function SinusoidalOut(k: number) {
    return sin(k * PI / 2);
}

export function SinusoidalInOut(k: number) {
    return 0.5 * (1 - cos(PI * k));
}

export function ExponentialIn(k: number) {
    return k === 0 ? 0 : pow(1024, k - 1);
}

export function ExponentialOut(k: number) {
    return k === 1 ? 1 : 1 - pow(2, - 10 * k);
}

export function ExponentialInOut(k: number) {
    if (k === 0) {
        return 0;
    }
    if (k === 1) {
        return 1;
    }
    if ((k *= 2) < 1) {
        return 0.5 * pow(1024, k - 1);
    }
    return 0.5 * (- pow(2, - 10 * (k - 1)) + 2);
}

export function CircularIn(k: number) {
    return 1 - sqrt(1 - k * k);
}

export function CircularOut(k: number) {
    return sqrt(1 - (--k * k));
}

export function CircularInOut(k: number) {
    if ((k *= 2) < 1) {
        return - 0.5 * (sqrt(1 - k * k) - 1);
    }
    return 0.5 * (sqrt(1 - (k -= 2) * k) + 1);
}

export function ElasticIn(k: number) {
    if (k === 0) {
        return 0;
    }
    if (k === 1) {
        return 1;
    }
    return -pow(2, 10 * (k - 1)) * sin((k - 1.1) * 5 * PI);

}

export function ElasticOut(k: number) {
    if (k === 0) {
        return 0;
    }
    if (k === 1) {
        return 1;
    }
    return pow(2, -10 * k) * sin((k - 0.1) * 5 * PI) + 1;

}

export function ElasticInOut(k: number) {
    if (k === 0) {
        return 0;
    }
    if (k === 1) {
        return 1;
    }
    k *= 2;
    if (k < 1) {
        return -0.5 * pow(2, 10 * (k - 1)) * sin((k - 1.1) * 5 * PI);
    }
    return 0.5 * pow(2, -10 * (k - 1)) * sin((k - 1.1) * 5 * PI) + 1;
}

export function BackIn(k: number) {
    var s = 1.70158;
    return k * k * ((s + 1) * k - s);
}

export function BackOut(k: number) {
    var s = 1.70158;
    return --k * k * ((s + 1) * k + s) + 1;
}

export function BackInOut(k: number) {
    var s = 1.70158 * 1.525;
    if ((k *= 2) < 1) {
        return 0.5 * (k * k * ((s + 1) * k - s));
    }
    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
}

export function BounceIn(k: number) {
    return 1 - BounceOut(1 - k);
}

export function BounceOut(k: number) {
    if (k < (1 / 2.75)) {
        return 7.5625 * k * k;
    } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
    } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
    } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
    }
}

export function BounceInOut(k: number) {
    if (k < 0.5) {
        return BounceIn(k * 2) * 0.5;
    }
    return BounceOut(k * 2 - 1) * 0.5 + 0.5;
}