"use client";

import React, { useState } from "react";
import {
    Clock, Plus, AlertCircle, CheckCircle2,
    Info, Calendar, ArrowRight, User, Trash2, Edit2, Eye
} from "lucide-react";
import { UniversalTabSection } from "./UniversalTabSection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ModalButton from "@/components/ui/ModalButton";

interface CaseTasksTabProps {
    tasks: any[];
    locale: string;
    t: any;
    tCommon: any;
    onAddTask: () => void;
    onEdit?: (task: any) => void;
    onDelete?: (task: any) => void;
    // Pagination Props
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    loading?: boolean;
}

export default function CaseTasksTab({
    tasks,
    locale,
    t,
    tCommon,
    onAddTask,
    onEdit,
    onDelete,
    totalCount = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange,
    loading = false
}: CaseTasksTabProps) {
    const isRtl = locale === "ar";
    const [viewingTask, setViewingTask] = useState<any | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-amber-50 !text-amber-600 !border-amber-100";
            case "scheduled": return "bg-sky-50 !text-sky-600 !border-sky-100";
            case "in_progress": return "bg-blue-50 !text-blue-600 !border-blue-100";
            case "completed": return "bg-emerald-50 !text-emerald-600 !border-emerald-100";
            case "canceled": return "bg-rose-50 !text-rose-600 !border-rose-100";
            default: return "bg-gray-50 !text-gray-600 !border-gray-100";
        }
    };

    return (
        <React.Fragment>
            <UniversalTabSection
                title={t("tasks")}
                icon={Clock}
                count={totalCount || tasks.length}
                countLabel={isRtl ? "مواعيد ومهام مسجلة" : "Deadlines & Tasks Recorded"}
                addButtonLabel={t("addTask")}
                onAdd={onAddTask}
                data={tasks}
                loading={loading}
                isRtl={isRtl}
                colorScheme="indigo"
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={onPageChange}
                emptyTitle={isRtl ? "لا توجد مهام حالية" : "No Active Tasks"}
                emptyDescription={isRtl
                    ? "لم يتم تسجيل أي مواعيد نهائية أو مهام لهذه القضية بعد. ابدأ بتنظيم وقتك."
                    : "No deadlines or tasks have been recorded for this case yet. Start organizing your time."}
                tipTitle={isRtl ? "إدارة وتنظيم المواعيد" : "Task Management & Scheduling"}
                tipDescription={isRtl
                    ? "تظهر المهام والمواعيد النهائية في لوحة التحكم الرئيسية وفي التقويم لمساعدتك على تنظيم وقتك بشكل أفضل. يتم إرسال تنبيهات تلقائية قبل الموعد النهائي بوقت كافٍ."
                    : "Tasks and deadlines appear in the main dashboard and the calendar to help you better organize your time. Automated alerts are sent before deadlines."}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-none">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "المهمة والعنوان" : "Task & Title"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-start">{isRtl ? "الموعد النهائي" : "Due Date"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{isRtl ? "الحالة" : "Status"}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{tCommon("actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent">
                                                <AlertCircle className="w-4 h-4 text-gray-400 transition-colors" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {task.title}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-gray-900 font-black text-[12px] uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                {new Date(task.startTime).toLocaleString(locale, { day: "numeric", month: "long" })}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5">
                                                {new Date(task.startTime).toLocaleString(locale, { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center">
                                            <Badge className={cn(
                                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                                getStatusColor(task.status)
                                            )}>
                                                {t(`taskStatuses.${task.status}`) || task.status}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingTask(task)}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onEdit?.(task)}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all duration-300"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(task)}
                                                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </UniversalTabSection>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingTask}
                onClose={() => setViewingTask(null)}
                title={t("viewTask")}
                className="!max-w-[450px]"
            >
                {viewingTask && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <Clock className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">{viewingTask.title}</h3>
                                <Badge className={cn(
                                    "px-2 py-0.5 mt-1 rounded-md text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                    getStatusColor(viewingTask.status)
                                )}>
                                    {t(`taskStatuses.${viewingTask.status}`) || viewingTask.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tCommon("description")}</p>
                                <p className="text-[13px] font-medium text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 min-h-[60px] whitespace-pre-wrap">
                                    {viewingTask.description || "---"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("tasks")}</p>
                                    {/* Note: using 'tasks' for 'Due Date' label might be wrong, effectively it is date/time. Using common.date? Or calendar.fields.end? */}
                                    {/* Let's used existing logic */}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <p className="text-[13px] font-bold text-gray-900 ltr:font-mono">
                                            {new Date(viewingTask.startTime).toLocaleString(locale)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <ModalButton
                                variant="ghost"
                                onClick={() => setViewingTask(null)}
                                className="px-10 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border-none"
                            >
                                {tCommon("close")}
                            </ModalButton>
                        </div>
                    </div>
                )}
            </Modal>
        </React.Fragment>
    );
}
