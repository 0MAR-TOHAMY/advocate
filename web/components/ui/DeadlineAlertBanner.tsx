
import { AlertCircle } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface DeadlineAlertBannerProps {
    caseData?: {
        poaExpiryDate?: Date | string | null;
        nextHearingDate?: Date | string | null;
        filingDate?: Date | string | null;
    };
    upcomingDeadlines?: Array<{
        id: string;
        title: string;
        startTime: Date | string;
        eventType: string;
    }>;
    documents?: Array<{
        id: string;
        title: string;
        documentType: string;
        expiryDate?: Date | string | null;
        isClientDocument?: boolean;
    }>;
    locale?: string;
    labels?: {
        poaExpiryTitle?: string;
        poaExpiryMessage?: string;
        poaExpiredTitle?: string;
        poaExpiredMessage?: string;
        deadlineTitle?: string;
        deadlineMessage?: string;
        docExpiryTitle?: string;
        docExpiryMessage?: string;
        docExpiredTitle?: string;
        docExpiredMessage?: string;
        days?: string;
        renew?: string;
        renewImmediate?: string;
    }
}

interface DeadlineAlert {
    type: string;
    title: string;
    message: string;
    date: Date;
    urgency: "info" | "warning" | "urgent";
}

export function DeadlineAlertBanner({ caseData, upcomingDeadlines, documents, locale = 'en', labels }: DeadlineAlertBannerProps) {
    const alerts: DeadlineAlert[] = [];

    // Helper to parse dates safely
    const parseDate = (date: Date | string | null | undefined): Date | null => {
        if (!date) return null;
        if (date instanceof Date) return date;
        try {
            return new Date(date);
        } catch {
            return null;
        }
    };

    // Helper to calculate days until date
    const getDaysUntil = (date: Date): number => {
        return differenceInDays(date, new Date());
    };

    const formatDate = (date: Date) => {
        try {
            return format(date, 'yyyy-MM-dd'); // Simple format for now to avoid locale import complexity
        } catch (e) {
            return '';
        }
    }

    // Check POA expiry
    if (caseData?.poaExpiryDate) {
        const poaDate = parseDate(caseData.poaExpiryDate);
        if (poaDate) {
            const daysUntil = getDaysUntil(poaDate);
            if (daysUntil <= 30 && daysUntil > 0) {
                alerts.push({
                    type: "poa_expiry",
                    title: labels?.poaExpiryTitle || "Power of Attorney Expiring Soon",
                    message: `${labels?.poaExpiryMessage || 'POA expires on'} ${formatDate(poaDate)} (${daysUntil} ${labels?.days || 'days'}). ${labels?.renew || 'Please renew to continue representation.'}`,
                    date: poaDate,
                    urgency: daysUntil <= 7 ? "urgent" : daysUntil <= 14 ? "warning" : "info"
                });
            } else if (daysUntil <= 0) {
                alerts.push({
                    type: "poa_expiry",
                    title: labels?.poaExpiredTitle || "Power of Attorney Expired",
                    message: `${labels?.poaExpiredMessage || 'POA expired on'} ${formatDate(poaDate)}. ${labels?.renewImmediate || 'Immediate renewal required.'}`,
                    date: poaDate,
                    urgency: "urgent"
                });
            }
        }
    }

    // Check deadline events
    upcomingDeadlines?.forEach((deadline) => {
        const deadlineDate = parseDate(deadline.startTime);
        if (deadlineDate) {
            const daysUntil = getDaysUntil(deadlineDate);
            if (daysUntil <= 7 && daysUntil >= 0) {
                alerts.push({
                    type: "deadline",
                    title: deadline.title,
                    message: `${labels?.deadlineMessage || 'Deadline on'} ${formatDate(deadlineDate)} (${daysUntil} ${labels?.days || 'days'}).`,
                    date: deadlineDate,
                    urgency: daysUntil <= 2 ? "urgent" : "warning"
                });
            }
        }
    });

    // Check document expiry dates
    documents?.forEach((doc) => {
        if (doc.expiryDate) {
            const expiryDate = parseDate(doc.expiryDate);
            if (expiryDate) {
                const daysUntil = getDaysUntil(expiryDate);
                if (daysUntil <= 30 && daysUntil > 0) {
                    alerts.push({
                        type: "document_expiry",
                        title: `${doc.documentType.replace('_', ' ').toUpperCase()} ${labels?.docExpiryTitle || 'Expiring Soon'}`,
                        message: `${doc.title} - ${labels?.docExpiryMessage || 'expires on'} ${formatDate(expiryDate)} (${daysUntil} ${labels?.days || 'days'}). ${labels?.renew || 'Please renew.'}`,
                        date: expiryDate,
                        urgency: daysUntil <= 7 ? "urgent" : daysUntil <= 14 ? "warning" : "info"
                    });
                } else if (daysUntil <= 0) {
                    alerts.push({
                        type: "document_expiry",
                        title: `${doc.documentType.replace('_', ' ').toUpperCase()} ${labels?.docExpiredTitle || 'Expired'}`,
                        message: `${doc.title} - ${labels?.docExpiredMessage || 'expired on'} ${formatDate(expiryDate)}. ${labels?.renewImmediate || 'Immediate renewal required.'}`,
                        date: expiryDate,
                        urgency: "urgent"
                    });
                }
            }
        }
    });

    // Sort alerts by urgency and date
    alerts.sort((a, b) => {
        const urgencyOrder = { urgent: 0, warning: 1, info: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return a.date.getTime() - b.date.getTime();
    });

    if (alerts.length === 0) {
        return null;
    }

    // Get background color based on urgency
    const getAlertStyles = (urgency: string) => {
        switch (urgency) {
            case "urgent":
                return "bg-red-100 text-gray-900 border border-red-200";
            case "warning":
                return "bg-yellow-100 text-gray-900 border border-yellow-200";
            default:
                return "bg-brand-primary/10 text-gray-900 border border-brand-primary/20";
        }
    };

    // Get icon background color
    const getIconStyles = (urgency: string) => {
        switch (urgency) {
            case "urgent":
                return "bg-red-500";
            case "warning":
                return "bg-orange-500";
            default:
                return "bg-brand-primary";
        }
    };

    return (
        <div className="space-y-3 mb-6">
            {alerts.map((alert, index) => (
                <div
                    key={`${alert.type}-${index}`}
                    className={`flex items-start gap-4 p-4 rounded-lg shadow-sm ${getAlertStyles(alert.urgency)}`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-10 h-10 rounded-full ${getIconStyles(alert.urgency)} flex items-center justify-center`}>
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base mb-1">{alert.title}</h3>
                        <p className="text-sm">{alert.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
