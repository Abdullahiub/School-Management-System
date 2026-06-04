import { jsPDF } from 'jspdf';
import { Student, Staff, AttendanceRecord, StudentResult } from '../types.js';

// Helper to draw standard school letterhead
function drawLetterhead(doc: jsPDF, title: string) {
  // Top Banner
  doc.setFillColor(28, 37, 54); // Dark charcoal blue
  doc.rect(0, 0, 210, 32, 'F');

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LGEA PRIMARY SCHOOL, DUTSE', 14, 20);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('123 Education Road, Dutse | Phone: +234 80 33445578', 14, 26);

  // Document Title Badge
  doc.setFillColor(79, 70, 229); // Accent Indigo
  doc.rect(14, 40, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 18, 45);

  // Date print
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 150, 56);
}

// Draw standard footer lines
function drawFooter(doc: jsPDF, pageNumber = 1) {
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 15, 196, pageHeight - 15);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Confidential Academic Record | LGEA PRIMARY SCHOOL', 14, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, 185, pageHeight - 10);
}

export const pdfExporter = {
  // 1. Export Student Directory list
  exportStudentReport(students: Student[], className: string) {
    const doc = new jsPDF();
    drawLetterhead(doc, `Student Roster - ${className}`);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Headers
    let y = 68;
    doc.text('Reg No', 14, y);
    doc.text('Full Name', 40, y);
    doc.text('Gender', 95, y);
    doc.text('Parent Contact', 120, y);
    doc.text('Address', 160, y);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(14, y + 2, 196, y + 2);

    doc.setFont('helvetica', 'normal');
    y += 8;

    students.forEach((s, idx) => {
      if (y > 270) {
        drawFooter(doc);
        doc.addPage();
        drawLetterhead(doc, `Student Roster - ${className}`);
        y = 68;
      }

      // Zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 7, 'F');
      }

      doc.text(s.regNo, 14, y);
      doc.text(s.fullName, 40, y);
      doc.text(s.gender, 95, y);
      doc.text(`${s.parentName} (${s.parentPhone})`, 120, y);
      doc.text(s.address.substring(0, 20), 160, y);

      y += 8;
    });

    drawFooter(doc);
    doc.save(`Student_Roster_${className.replace(' ', '_')}.pdf`);
  },

  // 2. Export Staff Roster
  exportStaffReport(staffList: Staff[]) {
    const doc = new jsPDF();
    drawLetterhead(doc, 'Staff Directory');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    let y = 68;
    doc.text('Staff ID', 14, y);
    doc.text('Full Name', 40, y);
    doc.text('Department', 95, y);
    doc.text('Role', 130, y);
    doc.text('Email', 160, y);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, y + 2, 196, y + 2);

    doc.setFont('helvetica', 'normal');
    y += 8;

    staffList.forEach((s, idx) => {
      if (y > 270) {
        drawFooter(doc);
        doc.addPage();
        drawLetterhead(doc, 'Staff Directory');
        y = 68;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 7, 'F');
      }

      doc.text(s.staffId, 14, y);
      doc.text(s.fullName, 40, y);
      doc.text(s.department, 95, y);
      doc.text(s.role, 130, y);
      doc.text(s.email, 160, y);

      y += 8;
    });

    drawFooter(doc);
    doc.save('Staff_Directory.pdf');
  },

  // 3. Export Daily Attendance Registers
  exportAttendanceReport(date: string, className: string, records: AttendanceRecord[]) {
    const doc = new jsPDF();
    drawLetterhead(doc, `Attendance Sheet - ${className} (${date})`);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    let y = 68;
    doc.text('S.No.', 14, y);
    doc.text('Student ID', 35, y);
    doc.text('Student Name', 70, y);
    doc.text('Status', 140, y);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, y + 2, 196, y + 2);

    doc.setFont('helvetica', 'normal');
    y += 8;

    let present = 0, absent = 0, late = 0;

    records.forEach((r, idx) => {
      if (y > 250) {
        drawFooter(doc);
        doc.addPage();
        drawLetterhead(doc, `Attendance Sheet - ${className} (${date})`);
        y = 68;
      }

      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Late') late++;

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 7, 'F');
      }

      doc.text(String(idx + 1), 14, y);
      doc.text(r.studentId, 35, y);
      doc.text(r.name, 70, y);

      // Status color text
      if (r.status === 'Present') {
        doc.setTextColor(16, 122, 95); // Forest green
      } else if (r.status === 'Absent') {
        doc.setTextColor(220, 38, 38); // Red
      } else {
        doc.setTextColor(217, 119, 6); // Orange
      }
      doc.setFont('helvetica', 'bold');
      doc.text(r.status, 140, y);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');

      y += 8;
    });

    // Summary block on bottom
    y += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 15, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 15, 'S');

    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY:', 18, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Students: ${records.length}`, 45, y + 9);
    doc.setTextColor(16, 122, 95);
    doc.text(`Present: ${present}`, 90, y + 9);
    doc.setTextColor(220, 38, 38);
    doc.text(`Absent: ${absent}`, 125, y + 9);
    doc.setTextColor(217, 119, 6);
    doc.text(`Late: ${late}`, 155, y + 9);

    drawFooter(doc);
    doc.save(`Attendance_Report_${className}_${date}.pdf`);
  },

  // 4. Export Examination Results / Report Cards (GPA slips)
  exportStudentReportCard(studentName: string, regNo: string, className: string, results: StudentResult[]) {
    const doc = new jsPDF();
    drawLetterhead(doc, `Academic Performance Evaluation`);

    // Student Info Block
    let y = 68;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 22, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('STUDENT DATA CARD', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${studentName}`, 18, y + 14);
    doc.text(`Registration: ${regNo}`, 85, y + 14);
    doc.text(`Class: ${className}`, 145, y + 14);

    // Results Header list
    y += 32;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Subject', 14, y);
    doc.text('Marks Obtained', 90, y);
    doc.text('Max Marks', 130, y);
    doc.text('Letter Grade', 165, y);

    doc.setDrawColor(148, 163, 184);
    doc.line(14, y + 2, 196, y + 2);

    doc.setFont('helvetica', 'normal');
    y += 8;

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    results.forEach((r, idx) => {
      totalMarksObtained += r.score;
      totalMaxMarks += r.maxMarks;

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 7, 'F');
      }

      doc.text(r.subject, 14, y);
      doc.text(`${r.score}`, 90, y);
      doc.text(`${r.maxMarks}`, 130, y);

      // Color letter grade based on letter
      if (r.grade === 'A') doc.setTextColor(13, 148, 136); // Teal
      else if (r.grade === 'F') doc.setTextColor(225, 29, 72); // Rose
      else doc.setTextColor(79, 70, 229); // Indigo

      doc.setFont('helvetica', 'bold');
      doc.text(r.grade, 165, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      y += 8;
    });

    const averagePct = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

    // Totals Block
    y += 8;
    doc.setDrawColor(148, 163, 184);
    doc.line(14, y, 196, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('AGGR. REPORT CRITERIA:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Aggreg. Marks: ${totalMarksObtained} / ${totalMaxMarks}`, 70, y);
    doc.text(`Exam Avg %: ${averagePct.toFixed(1)}%`, 130, y);

    const aggregateLetter = averagePct >= 90 ? 'A' : averagePct >= 80 ? 'B' : averagePct >= 70 ? 'C' : averagePct >= 60 ? 'D' : 'F';
    doc.setFont('helvetica', 'bold');
    doc.text(`Rating: ${aggregateLetter}`, 175, y);

    // Signatures
    y += 35;
    if (y < 270) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.line(14, y, 64, y);
      doc.text('Class Advisor Sign', 14, y + 4);

      doc.line(146, y, 196, y);
      doc.text('Principal Sign-Off', 146, y + 4);
    }

    drawFooter(doc);
    doc.save(`Report_Card_${regNo}.pdf`);
  }
};
