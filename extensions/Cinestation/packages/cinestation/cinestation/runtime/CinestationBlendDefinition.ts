
import { BackIn, BackInOut, BackOut, BounceIn, BounceInOut, BounceOut, CircularIn, CircularInOut, CircularOut, CubicIn, CubicInOut, CubicOut, ElasticIn, ElasticInOut, ElasticOut, ExponentialIn, ExponentialInOut, ExponentialOut, LinearNone, QuadraticIn, QuadraticInOut, QuadraticOut, QuarticIn, QuarticInOut, QuarticOut, QuinticIn, QuinticInOut, QuinticOut, SinusoidalIn, SinusoidalInOut, SinusoidalOut } from './CinestationEasing';
import { _decorator, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum CinestationBlendStyle {
    Linear,
    QuadraticIn,
    QuadraticOut,
    QuadraticInOut,
    CubicIn,
    CubicOut,
    CubicInOut,
    QuarticIn,
    QuarticOut,
    QuarticInOut,
    QuinticIn,
    QuinticOut,
    QuinticInOut,
    SinusoidalIn,
    SinusoidalOut,
    SinusoidalInOut,
    ExponentialIn,
    ExponentialOut,
    ExponentialInOut,
    CircularIn,
    CircularOut,
    CircularInOut,
    ElasticIn,
    ElasticOut,
    ElasticInOut,
    BackIn,
    BackOut,
    BackInOut,
    BounceIn,
    BounceOut,
    BounceInOut
}

export const CinestationBlendFunc = [
    LinearNone,
    QuadraticIn,
    QuadraticOut,
    QuadraticInOut,
    CubicIn,
    CubicOut,
    CubicInOut,
    QuarticIn,
    QuarticOut,
    QuarticInOut,
    QuinticIn,
    QuinticOut,
    QuinticInOut,
    SinusoidalIn,
    SinusoidalOut,
    SinusoidalInOut,
    ExponentialIn,
    ExponentialOut,
    ExponentialInOut,
    CircularIn,
    CircularOut,
    CircularInOut,
    ElasticIn,
    ElasticOut,
    ElasticInOut,
    BackIn,
    BackOut,
    BackInOut,
    BounceIn,
    BounceOut,
    BounceInOut
]

@ccclass('CinestationBlendDefinition')
export class CinestationBlendDefinition {
    @property({
        tooltip: "i18n:cinestation.CinestationBlendDefinition.style",
        type: Enum(CinestationBlendStyle)
    })
    public style: CinestationBlendStyle = CinestationBlendStyle.QuarticInOut;

    @property({
        tooltip: "i18n:cinestation.CinestationBlendDefinition.time。"
    })
    public time: number = 4;
}
