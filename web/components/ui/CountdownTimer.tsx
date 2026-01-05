
import { useCallback, useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface CountdownTimerProps {
    targetDate: Date | string;
    isUrgent?: boolean;
    isJudgmentAppeal?: boolean;
    labels?: {
        expired?: string;
        days?: string;
        day?: string;
        hours?: string;
        hour?: string;
        mins?: string;
        left?: string;
    }
}

export function CountdownTimer({ targetDate, isUrgent = false, isJudgmentAppeal = false, labels }: CountdownTimerProps) {
    // Ensure targetDate is a proper Date object
    const deadline = targetDate instanceof Date ? targetDate : new Date(targetDate);
    const deadlineMs = deadline.getTime();

    const calculateTimeLeft = useCallback(() => {
        const now = new Date();
        const deadlineDateTime = new Date(deadlineMs);

        // Check if expired
        if (deadlineDateTime <= now) {
            return { days: 0, hours: 0, minutes: 0, expired: true };
        }

        // Strip time component to calculate calendar days
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadlineDate = new Date(deadlineDateTime.getFullYear(), deadlineDateTime.getMonth(), deadlineDateTime.getDate());

        // Calculate calendar days (not 24-hour periods)
        const days = differenceInDays(deadlineDate, nowDate);

        // For hours and minutes, use the actual timestamps
        const totalHours = differenceInHours(deadlineDateTime, now);
        const hours = totalHours % 24;
        const totalMinutes = differenceInMinutes(deadlineDateTime, now);
        const minutes = totalMinutes % 60;

        return { days, hours, minutes, expired: false };
    }, [deadlineMs]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const t = (key: keyof typeof labels) => labels?.[key] || key;

    if (timeLeft.expired) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 border border-red-300">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{labels?.expired || 'EXPIRED'}</span>
            </div>
        );
    }

    // Determine urgency level and colors
    const getUrgencyStyle = () => {
        if (isJudgmentAppeal) {
            // Judgment appeals are always critical
            if (timeLeft.days <= 7) {
                return {
                    bg: 'bg-gradient-to-r from-red-500 to-red-600',
                    border: 'border-red-600',
                    text: 'text-white',
                    icon: 'text-red-100',
                    pulse: true,
                };
            } else if (timeLeft.days <= 15) {
                return {
                    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    border: 'border-orange-600',
                    text: 'text-white',
                    icon: 'text-orange-100',
                    pulse: false,
                };
            } else {
                return {
                    bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
                    border: 'border-amber-600',
                    text: 'text-white',
                    icon: 'text-amber-100',
                    pulse: false,
                };
            }
        } else if (isUrgent || timeLeft.days <= 3) {
            return {
                bg: 'bg-gradient-to-r from-red-500 to-pink-500',
                border: 'border-red-500',
                text: 'text-white',
                icon: 'text-red-100',
                pulse: true,
            };
        } else if (timeLeft.days <= 7) {
            return {
                bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
                border: 'border-orange-500',
                text: 'text-white',
                icon: 'text-orange-100',
                pulse: false,
            };
        } else {
            return {
                bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                border: 'border-blue-500',
                text: 'text-white',
                icon: 'text-blue-100',
                pulse: false,
            };
        }
    };

    const style = getUrgencyStyle();

    return (
        <div className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 ${style.border} ${style.bg} shadow-lg ${style.pulse ? 'animate-pulse' : ''}`}>
            {/* Icon */}
            <div className={`${style.icon}`}>
                {isJudgmentAppeal ? (
                    <AlertTriangle className="w-5 h-5" />
                ) : (
                    <Clock className="w-5 h-5" />
                )}
            </div>

            {/* Countdown Display */}
            <div className="flex items-baseline gap-2">
                {timeLeft.days > 0 && (
                    <div className="flex flex-col items-center">
                        <span className={`text-2xl font-bold ${style.text} leading-none`}>
                            {timeLeft.days}
                        </span>
                        <span className={`text-[10px] font-medium ${style.text} opacity-90`}>
                            {timeLeft.days === 1 ? (labels?.day || 'day') : (labels?.days || 'days')}
                        </span>
                    </div>
                )}

                {timeLeft.days === 0 && (
                    <>
                        <div className="flex flex-col items-center">
                            <span className={`text-2xl font-bold ${style.text} leading-none`}>
                                {timeLeft.hours}
                            </span>
                            <span className={`text-[10px] font-medium ${style.text} opacity-90`}>
                                {timeLeft.hours === 1 ? (labels?.hour || 'hour') : (labels?.hours || 'hours')}
                            </span>
                        </div>
                        <span className={`text-xl font-bold ${style.text}`}>:</span>
                        <div className="flex flex-col items-center">
                            <span className={`text-2xl font-bold ${style.text} leading-none`}>
                                {timeLeft.minutes}
                            </span>
                            <span className={`text-[10px] font-medium ${style.text} opacity-90`}>
                                {labels?.mins || 'min'}
                            </span>
                        </div>
                    </>
                )}

                {timeLeft.days > 0 && timeLeft.days <= 7 && (
                    <>
                        <span className={`text-lg font-bold ${style.text}`}>:</span>
                        <div className="flex flex-col items-center">
                            <span className={`text-xl font-bold ${style.text} leading-none`}>
                                {timeLeft.hours}
                            </span>
                            <span className={`text-[9px] font-medium ${style.text} opacity-90`}>
                                {labels?.hours || 'hrs'}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Remaining label */}
            <span className={`text-xs font-semibold ${style.text} opacity-90 ml-1`}>
                {labels?.left || 'left'}
            </span>
        </div>
    );
}
