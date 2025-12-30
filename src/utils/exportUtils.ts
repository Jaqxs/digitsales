import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '@/lib/pos-utils';

export const exportToCSV = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.csv`);
};

export const exportToPDF = (
    title: string,
    columns: string[],
    data: any[][],
    filename: string
) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);

    autoTable(doc, {
        head: [columns],
        body: data,
        startY: 40,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
    });

    doc.save(`${filename}.pdf`);
};
