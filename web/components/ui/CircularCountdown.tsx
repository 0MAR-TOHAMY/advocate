
import { useMemo } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface CircularCountdownProps {
    targetDate: Date | string;
    label?: string;
    size?: number;
    color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'brand';
}

const colorConfig = {
    red: { gradient: 'from-red-500 to-red-600', text: 'text-red-500' },
    orange: { gradient: 'from-orange-500 to-orange-600', text: 'text-orange-500' },
    yellow: { gradient: 'from-yellow-500 to-yellow-600', text: 'text-yellow-500' },
    green: { gradient: 'from-green-500 to-green-600', text: 'text-green-500' },
    blue: { gradient: 'from-blue-500 to-blue-600', text: 'text-blue-500' },
    brand: { gradient: 'from-brand-primary to-brand-primary/80', text: 'text-brand-primary' },
};

export default function CircularCountdown({
    targetDate,
    label = 'left',
    size = 80,
    color = 'green',
}: CircularCountdownProps) {
    const daysLeft = useMemo(() => {
        const target = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        return Math.max(0, differenceInDays(target, today));
    }, [targetDate]);

    const hoursLeft = useMemo(() => {
        const target = new Date(targetDate);
        const today = new Date();
        // Use simple difference to handle logic
        const diffTime = Math.abs(target.getTime() - today.getTime());
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        // Wait, the original was logic-bound to days+hours display.
        // Original:
        // const days = differenceInDays(target, today);
        // const hours = differenceInHours(target, today) - days * 24;
        // return Math.max(0, hours);
        // Let's stick to original logic but ensure Date objects

        // Recalculating precisely for visual consistency
        const totalHours = differenceInHours(target, today);
        const d = differenceInDays(target, today);
        const h = totalHours - (d * 24);
        return Math.max(0, h);
    }, [targetDate]);

    const minutesLeft = useMemo(() => {
        const target = new Date(targetDate);
        const today = new Date();
        const totalMinutes = differenceInMinutes(target, today);
        const totalHours = differenceInHours(target, today);
        const m = totalMinutes - (totalHours * 60);
        return Math.max(0, m);
    }, [targetDate]);

    const sizeClasses = {
        80: 'w-20 h-20',
        100: 'w-24 h-24',
        120: 'w-32 h-32',
        150: 'w-36 h-36',
    }[size as 80 | 100 | 120 | 150] || 'w-20 h-20';

    const textSizeClasses = {
        80: 'text-2xl',
        100: 'text-3xl',
        120: 'text-4xl',
        150: 'text-5xl',
    }[size as 80 | 100 | 120 | 150] || 'text-2xl';

    const labelSizeClasses = {
        80: 'text-xs',
        100: 'text-sm',
        120: 'text-base',
        150: 'text-lg',
    }[size as 80 | 100 | 120 | 150] || 'text-xs';

    return (
        <div className="flex flex-col items-center justify-center">
            {/* Static Circular Counter */}
            <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${colorConfig[color].gradient} p-0.5 flex items-center justify-center shadow-lg`}>
                <div className="w-full h-full rounded-full bg-gray-950 flex flex-col items-center justify-center">
                    <div className={`${textSizeClasses} font-bold text-white`}>
                        {daysLeft}
                    </div>
                    <div className={`${labelSizeClasses} font-semibold ${colorConfig[color].text}`}>
                        {label}
                    </div>
                </div>
            </div>
            {/* Time remaining */}
            <div className="mt-2 text-center text-xs text-gray-500 font-medium">
                <div>{hoursLeft}h {minutesLeft}m</div>
            </div>
        </div>
    );
}
