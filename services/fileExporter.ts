
declare const jspdf: any;
declare const PptxGenJS: any;
declare const docx: any;

export const exportToPDF = (title: string, content: string) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  const splitContent = doc.splitTextToSize(content, 180);
  doc.setFontSize(20);
  doc.text(title, 10, 20);
  doc.setFontSize(12);
  doc.text(splitContent, 10, 35);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToWord = async (title: string, content: string) => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [new TextRun(content)],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.docx`;
  link.click();
};

export const exportToPPT = (title: string, content: string) => {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  
  slide.addText(title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '363636' });
  
  // Semplice suddivisione in punti se il testo è lungo
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  slide.addText(lines.slice(0, 8).join('\n'), { 
    x: 0.5, 
    y: 1.5, 
    w: '90%', 
    h: 4, 
    fontSize: 14, 
    color: '666666',
    bullet: true
  });

  pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
};
