import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const generateWeeklyRoutinePDF = (pdfSettings, allFaculty = [], tableSelector = '#week-routine-table') => {
    try {
        const doc = new jsPDF('l', 'mm', 'a3');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Apply Global Font Style
        doc.setFont(pdfSettings.fontStyle);

        // --- Center Titles ---
        // 1. University Name
        doc.setFontSize(pdfSettings.headerFontSize);
        doc.setFont(pdfSettings.fontStyle, 'bold');
        doc.text(pdfSettings.universityName || "North Western University", pageWidth / 2, 15, { align: "center" });

        // 2. Department Name
        doc.setFontSize(Math.max(10, pdfSettings.headerFontSize - 2));
        doc.setFont(pdfSettings.fontStyle, 'normal');
        doc.text(pdfSettings.departmentName || "Department of Computer Science and Engineering", pageWidth / 2, 22, { align: "center" });

        // 3. Semester Name
        doc.setFontSize(Math.max(10, pdfSettings.headerFontSize - 4));
        doc.text(pdfSettings.semesterName || `Routine for Semester`, pageWidth / 2, 28, { align: "center" });

        let startY = 36;
        if (pdfSettings.routineTitle) {
            doc.setFontSize(Math.max(10, pdfSettings.headerFontSize - 5));
            doc.text(pdfSettings.routineTitle, pageWidth / 2, 34, { align: "center" });
            startY = 40; // Push table down a bit to fit the title
        }


        // --- Top Left Box: Updated Date ---
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        const dateText = `Updated on : ${formattedDate}`;
        doc.setFontSize(10);
        const dateTextWidth = doc.getTextWidth(dateText);

        // Draw rectangle
        const leftBoxX = 14;
        const topBoxY = 12;
        const boxHeight = 8;
        doc.rect(leftBoxX, topBoxY, dateTextWidth + 6, boxHeight);
        doc.text(dateText, leftBoxX + 3, topBoxY + 5.5);

        // --- Top Right Box: Additional Text (Optional) ---
        if (pdfSettings.additionalText) {
            const rightTextWidth = doc.getTextWidth(pdfSettings.additionalText);
            const rightBoxX = pageWidth - 14 - (rightTextWidth + 6);
            doc.rect(rightBoxX, topBoxY, rightTextWidth + 6, boxHeight);
            doc.text(pdfSettings.additionalText, rightBoxX + 3, topBoxY + 5.5);
        }

        autoTable(doc, {
            html: tableSelector,
            startY: startY,
            theme: 'grid',
            rowPageBreak: 'avoid',
            styles: {
                font: pdfSettings.fontStyle,
                fontSize: pdfSettings.fontSize,
                cellPadding: 1.5,
                halign: 'center',
                valign: 'middle',
                textColor: [0, 0, 0], // enforce black text if dark mode CSS leaked
                lineWidth: 0.3, // 0.3mm for all standard borders
                lineColor: [0, 0, 0] // Pure solid black
            },
            headStyles: {
                textColor: [0, 0, 0],
                fontSize: pdfSettings.fontSize + 1,
                fontStyle: 'bold',
                fillColor: false
            },
            columnStyles: { 0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 } },
            useCss: true, // Still parses rowspans/colspans
            didParseCell: function (data) {
                // Force our custom font settings instead of whatever CSS was parsed from the DOM
                data.cell.styles.font = pdfSettings.fontStyle;
                // Force pure solid black borders and 0.3mm width (overrides DOM border colors)
                data.cell.styles.lineColor = [0, 0, 0];
                data.cell.styles.lineWidth = 0.3;

                if (data.section === 'body' || data.section === 'foot') {
                    data.cell.styles.fontSize = pdfSettings.fontSize;

                    // --- BATCH COLUMN (index 0) formatter ---
                    if (data.section === 'body' && data.column.index === 0 && data.cell.text && data.cell.text.length > 0) {
                        const batchRaw = data.cell.text.join(' ');
                        const batchLines = [];

                        // Extract year ordinal
                        const yearMatch = batchRaw.match(/(\d+(?:st|nd|rd|th))\s+Year/i);
                        if (yearMatch) batchLines.push(yearMatch[1] + '-Yr.');

                        // Extract semester ordinal
                        const semMatch = batchRaw.match(/(\d+(?:st|nd|rd|th))\s+Sem/i);
                        if (semMatch) batchLines.push(semMatch[1] + '-Sm.');

                        // Extract section
                        const secMatch = batchRaw.match(/Section\s+([A-Z])/i);
                        if (secMatch) batchLines.push('Sec.-' + secMatch[1].toUpperCase());

                        // Extract room
                        const roomMatch = batchRaw.match(/Room:\s*([\w\d]+)/i);
                        if (roomMatch) batchLines.push('R.-' + roomMatch[1]);

                        if (batchLines.length > 0) {
                            data.cell.text = batchLines;
                        }
                    }

                    // --- CLASS CELLS (columns > 0) formatter ---
                    if (data.section === 'body' && data.column.index > 0 && data.cell.text && data.cell.text.length > 0) {
                        const rawText = data.cell.text.join(' ');
                        if (rawText.trim() === '') return;

                        const hasAlt = rawText.includes('ALT');
                        const cleanText = rawText.replace(/LAB/g, ' ').replace(/ALT/g, ' ').trim();

                        const allRooms = [];
                        const roomStartMatch = cleanText.match(/R-([\w\d]+(?:\s*\/\s*[\w\d]+)*)/)
                        if (roomStartMatch) {
                            roomStartMatch[1].split(/\s*\/\s*/).forEach(r => {
                                if (r.trim()) allRooms.push(r.trim());
                            });
                        }

                        // Remove rooms from text before extracting courses
                        const courseSearchText = cleanText.replace(/R-[\w\d]+/g, ' ');

                        const allCourses = [];
                        const courseRegex = /([a-zA-Z]{2,})-(\d+)/g;
                        let cm;
                        while ((cm = courseRegex.exec(courseSearchText)) !== null) {
                            allCourses.push({ prefix: cm[1], num: cm[2], full: cm[0] });
                        }

                        // Extract faculty
                        let facText = cleanText;
                        allCourses.forEach(c => { facText = facText.replace(c.full, ' '); });
                        facText = facText.replace(/R-[\w\d]+/g, ' ');
                        const facWords = facText.split(/[\s/]+/).filter(w => w.trim().length > 0);

                        let newLines = [];

                        if (allCourses.length >= 2 && hasAlt) {
                            // Dual alternate class format
                            const code1 = allCourses[0].full;
                            const fac1 = facWords[0] || '';
                            const room1 = allRooms[0] || '';
                            const code2 = allCourses[1].full;
                            const fac2 = facWords[1] || '';
                            const room2 = allRooms[1] || '';

                            newLines.push(code1);
                            newLines.push(fac1 + (room1 ? '_' + room1 : ''));
                            newLines.push('-alt-');
                            newLines.push(code2);
                            newLines.push(fac2 + (room2 ? '_' + room2 : ''));
                        } else if (allCourses.length === 1) {
                            // Single class format
                            newLines.push(allCourses[0].prefix + '-');
                            newLines.push(allCourses[0].num);
                            if (facWords[0]) newLines.push('-' + facWords[0]);
                            if (allRooms[0]) newLines.push('_' + allRooms[0]);
                            if (hasAlt) newLines.push('-alt-');
                        } else if (cleanText.trim()) {
                            // Fallback
                            newLines = [cleanText.trim()];
                        }

                        if (newLines.length > 0) {
                            data.cell.text = newLines;
                        }
                    }
                } else if (data.section === 'head') {
                    data.cell.styles.fontSize = pdfSettings.fontSize + 1;
                    data.cell.styles.fillColor = false; // No background color
                    data.cell.styles.textColor = [0, 0, 0]; // Black text

                    // Format time headers into two lines (e.g. "09:00 AM - 10:00 AM")
                    // Only apply to the 2nd row if it's a multi-row header (Weekly View)
                    // Or apply to the 1st row if it's a single-row header (Daily View)
                    const isTimeRow = (data.table.head.length > 1 && data.row.index === 1) || (data.table.head.length === 1 && data.row.index === 0);

                    if (isTimeRow && data.cell.text && data.cell.text.length > 0) {
                        const cellText = data.cell.text[0];
                        if (cellText && cellText.includes('-')) {
                            const [start, end] = cellText.split('-');
                            data.cell.text = [start.trim(), end.trim()];
                        }
                    }
                }

                // Check for Day separation borders (indicated by className in HTML)
                if (data.cell.raw && data.cell.raw.className && typeof data.cell.raw.className === 'string') {
                    if (data.cell.raw.className.includes('border-r-4')) {
                        // Apply 1mm border to the right side where the UI has the thick line
                        data.cell.styles.lineWidth = {
                            top: 0.3,
                            bottom: 0.3,
                            left: 0.3,
                            right: 1.0
                        };
                    }
                }
            },
            margin: { bottom: 20 }
        });

        // ==========================================
        // FACULTY MEMBERS TABLES
        // ==========================================
        if (allFaculty && allFaculty.length > 0) {
            let currentY = doc.lastAutoTable.finalY + 15;

            // Split into Permanent vs Guest (Adjunct goes to Guest per the image "Guest Teachers...")
            const permanentFaculty = allFaculty.filter(f => f.type === 'Permanent');
            // Depending exactly on the exact values in DB ('Guest', 'Adjunct', etc), we'll bucket anything not Permanent
            const guestFaculty = allFaculty.filter(f => f.type !== 'Permanent');

            // --- Helper: Format 1D array into a multi-column 2D array ---
            const createMultiColumnData = (facultyList, numColumnPairs) => {
                const rows = [];
                // We want to fill vertically first. (Like a newspaper column)
                // Number of rows = ceil(total items / num columns)
                const numRows = Math.ceil(facultyList.length / numColumnPairs);

                for (let r = 0; r < numRows; r++) {
                    const rowData = [];
                    for (let c = 0; c < numColumnPairs; c++) {
                        // The index in the 1D array
                        const index = c * numRows + r;
                        if (index < facultyList.length) {
                            rowData.push(facultyList[index].name);
                            rowData.push(facultyList[index].initials);
                            rowData.push(facultyList[index].phone || 'N/A');
                        } else {
                            // Empty cell if we run out of faculty
                            rowData.push("");
                            rowData.push("");
                            rowData.push("");
                        }
                    }
                    rows.push(rowData);
                }
                return rows;
            };

            // Pastel colors from the image
            const permanentColors = [
                [251, 235, 219], // Light Orange/Peach
                [202, 230, 241], // Light Blue
                [212, 199, 226], // Light Purple
            ];

            const guestColors = [
                [251, 213, 184], // Slightly darker peach/orange
                [184, 225, 222], // Light Teal/Blue
                [216, 199, 226], // Light Purple/Lilac
                [237, 189, 184]  // Light Pinkish Red
            ];


            // --- Permanent Faculty Table ---
            const permCols = parseInt(pdfSettings.permanentFacultyCols || 3, 10);

            if (permanentFaculty.length > 0) {
                if (currentY > doc.internal.pageSize.getHeight() - 40) {
                    doc.addPage();
                    currentY = 20;
                }

                // Dynamically build column styles
                const permColumnStyles = {};
                for (let i = 0; i < permCols * 3; i++) {
                    let align = 'center';
                    if (i % 3 === 0) align = 'left'; // Name
                    // Initials and Phone can be center
                    permColumnStyles[i] = {
                        halign: align,
                        fontStyle: 'bold'
                    };
                }

                autoTable(doc, {
                    startY: currentY,
                    theme: 'grid',
                    rowPageBreak: 'avoid',
                    head: [[{
                        content: 'Faculty Members of the Department of Computer Science and Engineering',
                        colSpan: permCols * 3,
                        styles: { halign: 'center', fillColor: [247, 224, 227], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: (pdfSettings.facultyFontSize || pdfSettings.fontSize) + 2 }
                    }]],
                    body: createMultiColumnData(permanentFaculty, permCols),
                    styles: {
                        font: pdfSettings.fontStyle,
                        fontSize: pdfSettings.facultyFontSize || pdfSettings.fontSize,
                        textColor: [0, 0, 0],
                        lineWidth: 0.3,
                        lineColor: [0, 0, 0],
                        cellPadding: 1.5,
                        valign: 'middle'
                    },
                    columnStyles: permColumnStyles,
                    didParseCell: function (data) {
                        data.cell.styles.font = pdfSettings.fontStyle;
                        data.cell.styles.lineColor = [0, 0, 0];
                        data.cell.styles.lineWidth = 0.3;

                        if (data.row.index === 0 && data.section === 'head') {
                            data.cell.styles.lineWidth = 1.0;
                        }

                        if (data.section === 'body') {
                            const pairIndex = Math.floor(data.column.index / 3);
                            // Fallback to cycling colors if user asks for more columns than colors provided
                            const colorIndex = pairIndex % permanentColors.length;
                            data.cell.styles.fillColor = permanentColors[colorIndex];

                            const currentLine = { ...data.cell.styles.lineWidth };
                            const lastColIndex = (permCols * 3) - 1;

                            if (data.column.index === 0) currentLine.left = 1.0;
                            if (data.column.index === lastColIndex) currentLine.right = 1.0;
                            if (data.row.index === data.table.body.length - 1) currentLine.bottom = 1.0;

                            // Draw thick right border on the 3rd column of each triplet to separate them
                            // except for the very last column which is handled above
                            if (data.column.index % 3 === 2 && data.column.index !== lastColIndex) {
                                currentLine.right = 1.0;
                            }

                            data.cell.styles.lineWidth = typeof data.cell.styles.lineWidth === 'object'
                                ? { ...data.cell.styles.lineWidth, ...currentLine }
                                : currentLine;
                        }
                    }
                });

                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- Guest Faculty Table ---
            const guestCols = parseInt(pdfSettings.guestFacultyCols || 4, 10);

            if (guestFaculty.length > 0) {
                if (currentY > doc.internal.pageSize.getHeight() - 40) {
                    doc.addPage();
                    currentY = 20;
                }

                // Dynamically build column styles
                const guestColumnStyles = {};
                for (let i = 0; i < guestCols * 3; i++) {
                    let align = 'center';
                    if (i % 3 === 0) align = 'left';
                    guestColumnStyles[i] = {
                        halign: align,
                        fontStyle: 'bold'
                    };
                }

                // Slightly shrink font automatically based on the newly introduced custom size if required
                const dynamicFontSize = guestCols > 5 ? Math.max(5, (pdfSettings.facultyFontSize || pdfSettings.fontSize) - 1) : (pdfSettings.facultyFontSize || pdfSettings.fontSize);

                autoTable(doc, {
                    startY: currentY,
                    theme: 'grid',
                    rowPageBreak: 'avoid',
                    head: [[{
                        content: 'Guest Teachers of the Department of Computer Science and Engineering',
                        colSpan: guestCols * 3,
                        styles: { halign: 'center', fillColor: [247, 224, 227], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: (pdfSettings.facultyFontSize || pdfSettings.fontSize) + 2 }
                    }]],
                    body: createMultiColumnData(guestFaculty, guestCols),
                    styles: {
                        font: pdfSettings.fontStyle,
                        fontSize: dynamicFontSize,
                        textColor: [0, 0, 0],
                        lineWidth: 0.3,
                        lineColor: [0, 0, 0],
                        cellPadding: 1.5,
                        valign: 'middle'
                    },
                    columnStyles: guestColumnStyles,
                    didParseCell: function (data) {
                        data.cell.styles.font = pdfSettings.fontStyle;
                        data.cell.styles.lineColor = [0, 0, 0];
                        data.cell.styles.lineWidth = 0.3;

                        if (data.row.index === 0 && data.section === 'head') {
                            data.cell.styles.lineWidth = 1.0;
                        }

                        if (data.section === 'body') {
                            const pairIndex = Math.floor(data.column.index / 3);
                            const colorIndex = pairIndex % guestColors.length;
                            data.cell.styles.fillColor = guestColors[colorIndex];

                            const currentLine = { ...data.cell.styles.lineWidth };
                            const lastColIndex = (guestCols * 3) - 1;

                            if (data.column.index === 0) currentLine.left = 1.0;
                            if (data.column.index === lastColIndex) currentLine.right = 1.0;
                            if (data.row.index === data.table.body.length - 1) currentLine.bottom = 1.0;

                            if (data.column.index % 3 === 2 && data.column.index !== lastColIndex) {
                                currentLine.right = 1.0;
                            }

                            data.cell.styles.lineWidth = typeof data.cell.styles.lineWidth === 'object'
                                ? { ...data.cell.styles.lineWidth, ...currentLine }
                                : currentLine;
                        }
                    }
                });
            }
        }

        // Add Bottom Signatures/Texts (Custom Fields)
        let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : doc.internal.pageSize.getHeight() - 60;

        if (pdfSettings.bottomSignatures && pdfSettings.bottomSignatures.length > 0) {
            const sigs = pdfSettings.bottomSignatures.filter(s => s.trim() !== "");
            if (sigs.length > 0) {
                if (currentY > doc.internal.pageSize.getHeight() - 50) {
                    doc.addPage();
                    currentY = 30;
                }
                const pageWidth = doc.internal.pageSize.getWidth();
                const step = pageWidth / (sigs.length + 1);

                const bSigsFontSize = pdfSettings.bottomSignaturesFontSize || 10;
                doc.setFontSize(bSigsFontSize);
                doc.setFont(pdfSettings.fontStyle, "bold");

                const columnWidth = step * 0.9; // Leave a 10% margin between columns

                sigs.forEach((sig, index) => {
                    const xPos = step * (index + 1);
                    const splitText = doc.splitTextToSize(sig, columnWidth);
                    doc.text(splitText, xPos, currentY, { align: 'center' });
                });
            }
        }

        // Add Head of Department Signature Area (Bottom Right)
        const blockMarginRight = 50;
        const blockWidth = 100;
        const totalWidth = doc.internal.pageSize.getWidth();
        const centerX = totalWidth - blockMarginRight - (blockWidth / 2);

        let headStartY = currentY + 30;

        // Make sure there is room on the page for the signature block
        if (headStartY + 30 > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            headStartY = 40;
        }

        // Draw Image if exists
        if (pdfSettings.signatureImage) {
            try {
                // Determine a nice aspect ratio to fit within blockWidth, max height ~ 15
                doc.addImage(pdfSettings.signatureImage, 'PNG', centerX - 30, headStartY - 30, 60, 30);
            } catch (e) {
                console.error("Failed to render signature image:", e);
            }
        }

        // Underline / "Signature" keyword
        const sigFontSize = pdfSettings.signatureFontSize || 10;
        doc.setFontSize(sigFontSize - 2); // Slightly smaller for the word "Signature"
        doc.setFont("helvetica", "normal");
        // A simple text line mimicking a border line
        doc.text("_________________________", centerX, headStartY + 2, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.text("Signature", centerX, headStartY + 7, { align: "center" });

        // Draw Identity
        doc.setFontSize(sigFontSize);
        doc.setFont(pdfSettings.fontStyle, "bold");

        const lineHeight = sigFontSize * 0.45; // Dynamic spacing based on text size
        let identityY = headStartY + 15;

        if (pdfSettings.headName) {
            doc.text(pdfSettings.headName, centerX, identityY, { align: "center" });
            identityY += lineHeight;
        }
        if (pdfSettings.headDesignation) {
            doc.setFont(pdfSettings.fontStyle, "italic");
            doc.text(pdfSettings.headDesignation, centerX, identityY, { align: "center" });
            identityY += lineHeight;
            doc.setFont(pdfSettings.fontStyle, "bold");
        }
        if (pdfSettings.headDepartmentName) {
            doc.text(pdfSettings.headDepartmentName, centerX, identityY, { align: "center" });
            identityY += lineHeight;
        }
        if (pdfSettings.headUniversityName) {
            doc.text(pdfSettings.headUniversityName, centerX, identityY, { align: "center" });
        }

        // Add C.C. Block (Bottom Left)
        if (pdfSettings.ccTitle || pdfSettings.ccText) {
            const leftMargin = 50;
            const titleBlockY = headStartY + 5;

            // Title and Underline
            doc.setFontSize(sigFontSize);
            doc.setFont(pdfSettings.fontStyle, "normal");

            if (pdfSettings.ccTitle) {
                // Calculate width to draw underline correctly
                const titleWidth = doc.getTextWidth(pdfSettings.ccTitle);
                doc.text(pdfSettings.ccTitle, leftMargin, titleBlockY);
                // Draw manual underline directly beneath the title
                doc.setLineWidth(0.5);
                doc.line(leftMargin, titleBlockY + 1.5, leftMargin + titleWidth, titleBlockY + 1.5);
            }

            // Draw Check List
            if (pdfSettings.ccText) {
                doc.setFontSize(sigFontSize);
                doc.setFont(pdfSettings.fontStyle, "normal");

                let ccY = titleBlockY + lineHeight + 2;
                const ccLines = pdfSettings.ccText.split('\n');

                ccLines.forEach(line => {
                    if (line.trim()) {
                        // Give slight indent for the list items
                        doc.text(line.trim(), leftMargin + 10, ccY);
                        ccY += lineHeight;
                    }
                });
            }
        }


        // Add Footer Layout (Left, Center Pagination, Right)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(pdfSettings.fontStyle || 'helvetica', 'normal');

            const yPos = doc.internal.pageSize.height - 10;
            const pageWidth = doc.internal.pageSize.width;

            // Left Text
            if (pdfSettings.footerLeftText) {
                doc.text(pdfSettings.footerLeftText, 14, yPos, { align: 'left' });
            }

            // Center Pagination
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, yPos, { align: 'center' });

            // Right Text
            if (pdfSettings.footerRightText) {
                doc.text(pdfSettings.footerRightText, pageWidth - 14, yPos, { align: 'right' });
            }
        }

        const finalFileName = pdfSettings.fileName ?
            (pdfSettings.fileName.endsWith('.pdf') ? pdfSettings.fileName : `${pdfSettings.fileName}.pdf`)
            : `week_routine_${new Date().getTime()}.pdf`;

        doc.save(finalFileName);
        toast.success('PDF downloaded!');
    } catch (error) {
        console.error("PDF generation failed:", error);
        toast.error('Failed to generate PDF');
    }
};

export const generateRoutineViewPDF = (title, subtitle, tableColumn, tableRows, pdfSettings = {}) => {
    try {
        const orientation = pdfSettings.orientation || 'l';
        const doc = new jsPDF(orientation, 'mm', 'a3');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Apply Global Font Style
        doc.setFont(pdfSettings.fontStyle || 'helvetica');

        // 1. University Name
        doc.setFontSize(pdfSettings.headerFontSize || 18);
        doc.setFont(pdfSettings.fontStyle || 'helvetica', 'bold');
        doc.text(pdfSettings.universityName || "North Western University", pageWidth / 2, 18, { align: "center" });

        // 2. Department Name
        doc.setFontSize(Math.max(10, (pdfSettings.headerFontSize || 18) - 4));
        doc.setFont(pdfSettings.fontStyle || 'helvetica', 'normal');
        doc.text(pdfSettings.departmentName || "Department of Computer Science and Engineering", pageWidth / 2, 26, { align: "center" });

        // 3. Title & Subtitle
        doc.setFontSize(Math.max(10, (pdfSettings.headerFontSize || 18) - 4));
        doc.setFont(pdfSettings.fontStyle || 'helvetica', 'bold');
        doc.text(pdfSettings.semesterName || title || "Class Routine", pageWidth / 2, 36, { align: "center" });

        if (subtitle) {
            doc.setFontSize(Math.max(10, (pdfSettings.headerFontSize || 18) - 6));
            doc.setFont(pdfSettings.fontStyle || 'helvetica', 'normal');
            doc.text(subtitle, pageWidth / 2, 44, { align: "center" });
        }

        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        doc.setFontSize(10);
        
        // --- Top Left Box: Updated Date ---
        const dateText = `Generated on: ${formattedDate}`;
        const dateTextWidth = doc.getTextWidth(dateText);
        const leftBoxX = 14;
        const topBoxY = 12;
        const boxHeight = 8;
        doc.rect(leftBoxX, topBoxY, dateTextWidth + 6, boxHeight);
        doc.text(dateText, leftBoxX + 3, topBoxY + 5.5);

        // --- Top Right Box: Additional Text (Automatic Info) ---
        if (pdfSettings.additionalText) {
            const rightTextWidth = doc.getTextWidth(pdfSettings.additionalText);
            const rightBoxX = pageWidth - 14 - (rightTextWidth + 6);
            doc.rect(rightBoxX, topBoxY, rightTextWidth + 6, boxHeight);
            doc.text(pdfSettings.additionalText, rightBoxX + 3, topBoxY + 5.5);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: subtitle ? 52 : 44,
            theme: 'grid',
            styles: {
                font: pdfSettings.fontStyle || 'helvetica',
                fontSize: pdfSettings.fontSize || 10,
                cellPadding: 3,
                halign: 'center',
                valign: 'middle',
                textColor: [0, 0, 0],
                lineWidth: 0.3,
                lineColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [79, 70, 229], // Indigo 600
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: (pdfSettings.fontSize || 10) + 1
            },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } }
        });

        // Add Bottom Signatures/Texts (Custom Fields)
        if (!pdfSettings.excludeSignatures) {
            let currentY = doc.lastAutoTable.finalY + 30;

            if (pdfSettings.bottomSignatures && pdfSettings.bottomSignatures.length > 0) {
                const sigs = pdfSettings.bottomSignatures.filter(s => s.trim() !== "");
                if (sigs.length > 0) {
                    if (currentY > doc.internal.pageSize.getHeight() - 50) {
                        doc.addPage();
                        currentY = 30;
                    }
                    const step = pageWidth / (sigs.length + 1);
                    const bSigsFontSize = pdfSettings.bottomSignaturesFontSize || 10;
                    doc.setFontSize(bSigsFontSize);
                    doc.setFont(pdfSettings.fontStyle || "helvetica", "bold");

                    const columnWidth = step * 0.9;
                    sigs.forEach((sig, index) => {
                        const xPos = step * (index + 1);
                        const splitText = doc.splitTextToSize(sig, columnWidth);
                        doc.text(splitText, xPos, currentY, { align: 'center' });
                    });
                }
            }

            // Add Head of Department Signature Area
            let headStartY = doc.lastAutoTable.finalY + 60;
            if (pdfSettings.bottomSignatures && pdfSettings.bottomSignatures.length > 0) {
                headStartY = currentY + 30;
            }

            const blockMarginRight = 50;
            const blockWidth = 100;
            const centerX = pageWidth - blockMarginRight - (blockWidth / 2);

            if (headStartY + 30 > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                headStartY = 40;
            }

            if (pdfSettings.signatureImage) {
                try {
                    doc.addImage(pdfSettings.signatureImage, 'PNG', centerX - 30, headStartY - 30, 60, 30);
                } catch (e) {
                    console.error("Failed to render signature image:", e);
                }
            }

            const sigFontSize = pdfSettings.signatureFontSize || 10;
            doc.setFontSize(sigFontSize - 2);
            doc.setFont("helvetica", "normal");
            doc.text("_________________________", centerX, headStartY + 2, { align: "center" });

            doc.setFont("helvetica", "bold");
            doc.text("Signature", centerX, headStartY + 7, { align: "center" });

            doc.setFontSize(sigFontSize);
            doc.setFont(pdfSettings.fontStyle || "helvetica", "bold");

            const lineHeight = sigFontSize * 0.45;
            let identityY = headStartY + 15;

            if (pdfSettings.headName) {
                doc.text(pdfSettings.headName, centerX, identityY, { align: "center" });
                identityY += lineHeight;
            }
            if (pdfSettings.headDesignation) {
                doc.setFont(pdfSettings.fontStyle || "helvetica", "italic");
                doc.text(pdfSettings.headDesignation, centerX, identityY, { align: "center" });
                identityY += lineHeight;
                doc.setFont(pdfSettings.fontStyle || "helvetica", "bold");
            }
            if (pdfSettings.headDepartmentName) {
                doc.text(pdfSettings.headDepartmentName, centerX, identityY, { align: "center" });
                identityY += lineHeight;
            }
            if (pdfSettings.headUniversityName) {
                doc.text(pdfSettings.headUniversityName, centerX, identityY, { align: "center" });
            }

            // Add C.C. Block
            if (pdfSettings.ccTitle || pdfSettings.ccText) {
                const leftMargin = 50;
                const titleBlockY = headStartY + 5;
                doc.setFontSize(sigFontSize);
                doc.setFont(pdfSettings.fontStyle || "helvetica", "normal");

                if (pdfSettings.ccTitle) {
                    const titleWidth = doc.getTextWidth(pdfSettings.ccTitle);
                    doc.text(pdfSettings.ccTitle, leftMargin, titleBlockY);
                    doc.setLineWidth(0.5);
                    doc.line(leftMargin, titleBlockY + 1.5, leftMargin + titleWidth, titleBlockY + 1.5);
                }

                if (pdfSettings.ccText) {
                    let ccY = titleBlockY + lineHeight + 2;
                    const ccLines = pdfSettings.ccText.split('\n');
                    ccLines.forEach(line => {
                        if (line.trim()) {
                            doc.text(line.trim(), leftMargin + 10, ccY);
                            ccY += lineHeight;
                        }
                    });
                }
            }
        }

        // Add Footer Layout
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(pdfSettings.fontStyle || 'helvetica', 'normal');

            const yPos = doc.internal.pageSize.height - 10;

            if (pdfSettings.footerLeftText) {
                doc.text(pdfSettings.footerLeftText, 14, yPos, { align: 'left' });
            } else {
                doc.text("Generated by NWU Smart Routine System", 14, yPos, { align: 'left' });
            }

            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, yPos, { align: 'center' });

            if (pdfSettings.footerRightText) {
                doc.text(pdfSettings.footerRightText, pageWidth - 14, yPos, { align: 'right' });
            }
        }

        const finalFileName = pdfSettings.fileName ?
            (pdfSettings.fileName.endsWith('.pdf') ? pdfSettings.fileName : `${pdfSettings.fileName}.pdf`)
            : `routine_${new Date().getTime()}.pdf`;

        doc.save(finalFileName);
        toast.success('PDF downloaded successfully!');
    } catch (error) {
        console.error("PDF generation failed:", error);
        toast.error('Failed to generate PDF');
    }
};
