/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Polygon } from '@react-pdf/renderer';

import path from 'path';
import fs from 'fs';

// Register a font that supports Arabic (Required for accurate rendering)
// Using local fonts for stability in API routes
const getFontsPath = () => {
    const cwd = process.cwd();
    const possiblePaths = [
        path.join(cwd, 'fonts', 'STC'),
        path.join(cwd, 'advocate', 'web', 'fonts', 'STC'),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
    }
    return possiblePaths[0];
};

const fontsPath = getFontsPath();
const fontRegular = path.join(fontsPath, 'STC-Regular.ttf');
const fontBold = path.join(fontsPath, 'STC-Bold.ttf');

// Use a dynamic name to force fresh registration in dev mode
const FONT_FAMILY = `STC_FONT_${Date.now()}`;

Font.register({
    family: FONT_FAMILY,
    fonts: [
        { src: fontRegular },
        { src: fontBold, fontWeight: 'bold' }
    ]
});

console.log(`[PDF] Registered font family ${FONT_FAMILY} using:
  - Regular: ${fontRegular}
  - Bold: ${fontBold}`);

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: FONT_FAMILY,
        backgroundColor: '#FFFFFF'
    },
    // Cover Page Styles
    coverContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
    },
    firmLogo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        objectFit: 'contain'
    },
    firmName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1a1a1a'
    },
    reportTitle: {
        fontSize: 24,
        color: '#2563eb', // Brand Primary
        marginBottom: 40,
        marginTop: 40
    },
    clientName: {
        fontSize: 18,
        color: '#4b5563',
        marginBottom: 5
    },
    date: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 20
    },
    isRtl: {
        textAlign: 'right',
    },
    footerContact: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: '#6b7280'
    },
    // Content Styles
    header: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#9ca3af',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        color: '#111827',
    },
    sectionTitleRtl: {
        textAlign: 'right',
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
        color: '#374151'
    },
    text: {
        fontSize: 11,
        marginBottom: 4,
        lineHeight: 1.5,
        color: '#4b5563'
    },
    label: {
        fontWeight: 'bold',
        color: '#111827'
    },
    tableContainer: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        alignItems: 'center',
        minHeight: 24
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        fontWeight: 'bold'
    },
    tableCell: {
        flex: 1,
        padding: 5,
        fontSize: 10,
    },
    tableCellRtl: {
        textAlign: 'right'
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        fontSize: 8,
        backgroundColor: '#f3f4f6',
        color: '#374151'
    },
    patternTriangle: {
        position: 'absolute',
        width: 150,
        height: 150,
        opacity: 0.1,
    },
    poweredByContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5
    },
    poweredByLogo: {
        width: 15,
        height: 15
    },
    poweredByText: {
        fontSize: 8,
        color: '#FFFFFF',
        opacity: 0.8
    }
});

interface ClientReportDocumentProps {
    firm: any;
    client: any;
    cases: any[];
    works: any[];
    type: 'full' | 'summary';
    locale?: string;
}

export const ClientReportDocument = ({ firm, client, cases, works, type, locale = 'ar' }: ClientReportDocumentProps) => {
    const isRtl = locale === 'ar';
    const direction = isRtl ? 'rtl' : 'ltr';
    const textAlign = isRtl ? 'right' : 'left';
    const flexDirection = isRtl ? 'row-reverse' : 'row';

    const reportDate = new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US'); // Localized date

    // Path for the website logo
    const fontsPath = getFontsPath();
    const publicPath = path.join(path.dirname(fontsPath), 'public');
    const logoSrc = path.join(publicPath, 'logo.png');

    return (
        <Document title={`Report - ${client.name}`}>
            {/* Page 1: Cover Page */}
            <Page
                size="A4"
                style={[
                    styles.page,
                    {
                        textAlign,
                        backgroundColor: firm.secondaryColor || '#3b82f6',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                ]}
            >
                {/* Background Pattern - Triangles */}
                <View style={{ position: 'absolute', top: -20, left: -20, opacity: 0.08 }}>
                    <Svg width="200" height="200" viewBox="0 0 100 100">
                        <Polygon points="0,0 100,0 0,100" fill="#FFFFFF" />
                    </Svg>
                </View>
                <View style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.08 }}>
                    <Svg width="150" height="150" viewBox="0 0 100 100">
                        <Polygon points="100,100 0,100 100,0" fill="#FFFFFF" />
                    </Svg>
                </View>

                <View style={styles.coverContainer}>
                    {firm.logoUrl && <Image src={firm.logoUrl} style={styles.firmLogo} />}
                    <Text style={[styles.firmName, { color: firm.primaryColor || '#1e40af' }]}>{firm.name}</Text>

                    <Text style={[styles.reportTitle, { color: firm.primaryColor || '#1e40af', backgroundColor: 'rgba(255, 255, 255, 0)', padding: '10 20', borderRadius: 5 }]}>
                        {isRtl
                            ? (type === 'full' ? 'تقرير قانوني شامل' : 'تقرير ملخص للحالة')
                            : (type === 'full' ? 'Full Legal Report' : 'Case Summary Report')}
                    </Text>

                    <Text style={[styles.clientName, { color: '#FFFFFF' }]}>
                        {isRtl ? `السيد/السادة: ${client.name}` : `Mr./Messrs: ${client.name}`}
                    </Text>
                    <Text style={[styles.date, { color: '#FFFFFF' }]}>
                        {isRtl ? `تاريخ التقرير: ${reportDate}` : `Report Date: ${reportDate}`}
                    </Text>

                    <View style={[styles.footerContact, { color: '#FFFFFF' }]}>
                        <Text>{firm.address || ''}</Text>
                        <Text>{firm.phone ? `Phone: ${firm.phone}` : ''} | {firm.email ? `Email: ${firm.email}` : ''}</Text>
                        <Text>{firm.website || ''}</Text>
                    </View>
                </View>

                {/* Powered By Section */}
                <View style={styles.poweredByContainer}>
                    <Text style={styles.poweredByText}>Powered by</Text>
                    {fs.existsSync(logoSrc) && <Image src={logoSrc} style={styles.poweredByLogo} />}
                    <Text style={[styles.poweredByText, { fontWeight: 'bold' }]}>Advocate Box</Text>
                </View>
            </Page>

            {/* Page 2: Index / Executive Summary */}
            <Page size="A4" style={[styles.page, { textAlign }]}>
                <Text style={[styles.sectionTitle, isRtl ? styles.sectionTitleRtl : {}]}>
                    {isRtl ? 'ملخص الأعمال والقضايا' : 'Summary of Works & Cases'}
                </Text>

                <View style={styles.tableContainer}>
                    <View style={[styles.tableRow, styles.tableHeader, { flexDirection }]}>
                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{isRtl ? 'العنوان' : 'Title'}</Text>
                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'الرقم المرجعي' : 'Ref Number'}</Text>
                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'النوع' : 'Type'}</Text>
                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'الحالة' : 'Status'}</Text>
                    </View>
                    {cases.map((c) => (
                        <View key={c.id} style={[styles.tableRow, { flexDirection }]}>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{c.title}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{c.caseNumber}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'قضية' : 'Case'}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>
                                {c.status}
                            </Text>
                        </View>
                    ))}
                    {works.map((w) => (
                        <View key={w.id} style={[styles.tableRow, { flexDirection }]}>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{w.title}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{w.referenceNumber || '-'}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'عمل عام' : 'Work'}</Text>
                            <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{w.status}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ marginTop: 30 }}>
                    <Text style={[styles.sectionTitle, isRtl ? styles.sectionTitleRtl : {}]}>{isRtl ? 'بيانات العميل' : 'Client Details'}</Text>
                    <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الاسم: ' : 'Name: '}</Text>{client.name}</Text>
                    <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'رقم العميل: ' : 'Client ID: '}</Text>{client.clientNumber || '-'}</Text>
                    <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الهاتف: ' : 'Phone: '}</Text>{client.phone || '-'}</Text>
                    <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'البريد الإلكتروني: ' : 'Email: '}</Text>{client.email || '-'}</Text>
                    <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'العنوان: ' : 'Address: '}</Text>{client.address || '-'}</Text>
                </View>
            </Page>

            {/* Subsequent Pages: Detailed Content */}
            {cases.map((c, index) => (
                <Page key={c.id} size="A4" style={[styles.page, { textAlign }]}>
                    <Text style={[styles.sectionTitle, isRtl ? styles.sectionTitleRtl : {}]}>
                        {isRtl ? `تفاصيل القضية: ${c.title}` : `Case Details: ${c.title}`}
                    </Text>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'رقم القضية: ' : 'Case Number: '}</Text>{c.caseNumber}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'المحكمة: ' : 'Court: '}</Text>{c.court || '-'}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الخصم: ' : 'Opponent: '}</Text>{c.opponentName || '-'}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'صفة العميل: ' : 'Client Role: '}</Text>{c.clientRole || '-'}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الحالة الحالية: ' : 'Current Status: '}</Text>{c.status}</Text>
                    </View>

                    {/* Hearings */}
                    {c.hearings && c.hearings.length > 0 && (
                        <View>
                            <Text style={[styles.subSectionTitle, { textAlign }]}>{isRtl ? 'الجلسات' : 'Hearings'}</Text>
                            <View style={styles.tableContainer}>
                                <View style={[styles.tableRow, styles.tableHeader, { flexDirection }]}>
                                    <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'التاريخ' : 'Date'}</Text>
                                    <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{isRtl ? 'القرار / التفاصيل' : 'Decision / Details'}</Text>
                                </View>
                                {c.hearings.map((h: any) => (
                                    <View key={h.id} style={[styles.tableRow, { flexDirection }]}>
                                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{new Date(h.hearingDate).toLocaleDateString()}</Text>
                                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{h.summaryToClient || h.comments || '-'}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Tasks/Deadlines/Events */}
                    {type === 'full' && c.events && c.events.length > 0 && (
                        <View style={{ marginTop: 15 }}>
                            <Text style={[styles.subSectionTitle, { textAlign }]}>{isRtl ? 'المهام والمواعيد والاجتماعات' : 'Tasks & Appointments'}</Text>
                            {c.events.map((t: any) => (
                                <Text key={t.id} style={[styles.text, { textAlign }]}>• {t.title} ({new Date(t.startTime).toLocaleDateString()}) - {t.status}</Text>
                            ))}
                        </View>
                    )}

                    {/* Financials */}
                    {type === 'full' && c.expenses && c.expenses.length > 0 && (
                        <View style={{ marginTop: 15 }}>
                            <Text style={[styles.subSectionTitle, { textAlign }]}>{isRtl ? 'المصروفات' : 'Expenses'}</Text>
                            <View style={styles.tableContainer}>
                                <View style={[styles.tableRow, styles.tableHeader, { flexDirection }]}>
                                    <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>{isRtl ? 'البند' : 'Item'}</Text>
                                    <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'المبلغ' : 'Amount'}</Text>
                                    <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{isRtl ? 'التاريخ' : 'Date'}</Text>
                                </View>
                                {c.expenses.map((e: any) => (
                                    <View key={e.id} style={[styles.tableRow, { flexDirection }]}>
                                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}, { flex: 2 }]}>
                                            {e.description || e.expenseType || '-'}
                                        </Text>
                                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>{e.amount} {e.currency}</Text>
                                        <Text style={[styles.tableCell, isRtl ? styles.tableCellRtl : {}]}>
                                            {new Date(e.expenseDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </Page>
            ))}

            {/* Works */}
            {works.map((w, index) => (
                <Page key={w.id} size="A4" style={[styles.page, { textAlign }]}>
                    <Text style={[styles.sectionTitle, isRtl ? styles.sectionTitleRtl : {}]}>
                        {isRtl ? `تفاصيل العمل: ${w.title}` : `Work Details: ${w.title}`}
                    </Text>
                    {/* Simplified work details */}
                    <View style={{ marginBottom: 15 }}>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'النوع: ' : 'Type: '}</Text>{w.workType}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الحالة: ' : 'Status: '}</Text>{w.status}</Text>
                        <Text style={[styles.text, { textAlign }]}><Text style={styles.label}>{isRtl ? 'الرصيد: ' : 'Balance: '}</Text>{w.fee - (w.paid || 0)}</Text>
                    </View>
                </Page>
            ))}

        </Document>
    );
};
