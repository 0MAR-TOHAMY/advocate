
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Clock } from 'lucide-react';

interface ProgressBarCountdownProps {
    targetDate: Date | string;
    createdDate?: Date | string;
    totalDays?: number;
    color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
    labels?: {
        remaining?: string;
        days?: string;
        day?: string;
    }
}

const gradientConfig = {
    red: {
        light: '#fca5a5', // light red
        dark: '#dc2626', // dark red
    },
    orange: {
        light: '#fed7aa', // light orange
        dark: '#ea580c', // dark orange
    },
    yellow: {
        light: '#fef08a', // light yellow
        dark: '#ca8a04', // dark yellow
    },
    green: {
        light: '#86efac', // light green
        dark: '#16a34a', // dark green
    },
    blue: {
        light: '#93c5fd', // light blue
        dark: '#1d4ed8', // dark blue
    },
};

export default function ProgressBarCountdown({
    targetDate,
    createdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: 30 days ago
    totalDays = 30,
    color = 'blue',
    labels
}: ProgressBarCountdownProps) {
    const daysLeft = useMemo(() => {
        const target = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        return Math.max(0, differenceInDays(target, today));
    }, [targetDate]);

    // Calculate progress: how many days have passed since creation
    const progressPercentage = useMemo(() => {
        const target = new Date(targetDate);
        const created = new Date(createdDate);
        const today = new Date();

        target.setHours(0, 0, 0, 0);
        created.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Days from creation to today
        const daysPassed = differenceInDays(today, created);
        // Total days from creation to deadline
        const totalDaysFromCreation = differenceInDays(target, created);

        if (totalDaysFromCreation <= 0) return 0;
        return Math.min(100, (daysPassed / totalDaysFromCreation) * 100);
    }, [targetDate, createdDate]);

    return (
        <div className="w-full px-3 py-2">
            <div
                className="relative h-8 rounded-full flex items-center overflow-visible shadow-sm bg-gray-100"
            >
                {/* Filled portion with gradient */}
                <div
                    className="h-full rounded-full transition-all duration-300 flex items-center justify-center opacity-80"
                    style={{
                        width: `${progressPercentage}%`,
                        background: `linear-gradient(to right, ${gradientConfig[color].light}, ${gradientConfig[color].dark})`,
                    }}
                />

                {/* Progress indicator circle (white with black border) - moves with progress toward orange dot */}
                <div
                    className="absolute w-6 h-6 bg-white border-2 border-gray-900 rounded-full transform -translate-x-1/2 shadow-md z-10 transition-all duration-300"
                    style={{ left: `${progressPercentage}%` }}
                />

                {/* Deadline indicator circle (dark gray dot) - FIXED at the end */}
                <div className="absolute right-1 w-4 h-4 bg-gray-800 rounded-full shadow-md z-20" />

                {/* Text inside bar at the beginning (left side) with blue clock icon */}
                <div className="absolute left-3 flex items-center gap-1.5 z-30 pointer-events-none">
                    <Clock className="w-4 h-4 text-gray-700 drop-shadow-sm" />
                    <span className="text-sm font-bold text-gray-900 drop-shadow-sm">
                        {daysLeft} {daysLeft === 1 ? (labels?.day || 'day') : (labels?.days || 'days')} {labels?.remaining || 'remaining'}
                    </span>
                </div>
            </div>
        </div>
    );
}
