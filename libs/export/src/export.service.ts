import { Injectable, Logger } from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Generate PDF from HTML using Puppeteer for exact visual fidelity
   */
  async generatePdf(html: string): Promise<Buffer> {
    const isLinux = process.platform === 'linux';
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (isLinux ? '/usr/bin/chromium' : undefined);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for network idle to ensure fonts/CSS are loaded
      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Word document from HTML (Enhanced)
   */
  async generateWord(html: string): Promise<Buffer> {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const body = document.body;

      // Helper to convert inline nodes (text, b, i, span) to TextRuns
      const parseInlineNodes = (
        parentNode: Node,
        formatting: {
          bold?: boolean;
          italics?: boolean;
          underline?: boolean;
        } = {},
      ): TextRun[] => {
        const runs: TextRun[] = [];

        parentNode.childNodes.forEach((node) => {
          if (node.nodeType === 3) {
            // Text Node
            const text = node.textContent;
            if (text) {
              runs.push(
                new TextRun({
                  text: text,
                  bold: formatting.bold,
                  italics: formatting.italics,
                  underline: formatting.underline ? {} : undefined,
                }),
              );
            }
          } else if (node.nodeType === 1) {
            // Element Node
            const el = node as Element;
            const tagName = el.tagName;

            if (tagName === 'BR') {
              runs.push(new TextRun({ break: 1 }));
            } else if (tagName === 'STRONG' || tagName === 'B') {
              runs.push(
                ...parseInlineNodes(node, { ...formatting, bold: true }),
              );
            } else if (tagName === 'EM' || tagName === 'I') {
              runs.push(
                ...parseInlineNodes(node, { ...formatting, italics: true }),
              );
            } else if (tagName === 'U') {
              runs.push(
                ...parseInlineNodes(node, { ...formatting, underline: true }),
              );
            } else {
              // Recurse for standard spans/other inline containers
              runs.push(...parseInlineNodes(node, formatting));
            }
          }
        });

        return runs;
      };

      // Block elements that start a new paragraph context
      const BLOCK_TAGS = new Set([
        'P',
        'DIV',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'UL',
        'OL',
        'LI',
        'SECTION',
        'ARTICLE',
        'MAIN',
        'HEADER',
        'FOOTER',
        'BLOCKQUOTE',
      ]);

      const processNodeList = (nodes: NodeList | Node[]): Paragraph[] => {
        const paragraphs: Paragraph[] = [];
        let inlineAccumulator: Node[] = [];

        const flushInline = () => {
          if (inlineAccumulator.length > 0) {
            // Create a wrapper node to pass to parseInlineNodes
            const wrapper = document.createElement('div');
            inlineAccumulator.forEach((n) =>
              wrapper.appendChild(n.cloneNode(true)),
            );

            const runs = parseInlineNodes(wrapper);
            // Only add paragraph if there is actual content or breaks
            if (
              runs.length > 0 &&
              runs.some((r: any) => r.text?.trim() || r.break)
            ) {
              paragraphs.push(new Paragraph({ children: runs }));
            }
            inlineAccumulator = [];
          }
        };

        Array.from(nodes).forEach((node) => {
          if (
            node.nodeType === 1 &&
            BLOCK_TAGS.has((node as Element).tagName)
          ) {
            // It's a block element
            flushInline(); // Finish any preceding inline text
            paragraphs.push(...parseBlockElement(node as Element));
          } else {
            // It's text, or an inline element (span, b, etc), or whitespace
            inlineAccumulator.push(node);
          }
        });

        flushInline(); // Flush any remaining inline content
        return paragraphs;
      };

      const parseBlockElement = (element: Element): Paragraph[] => {
        const tagName = element.tagName;
        const paragraphs: Paragraph[] = [];

        if (tagName.startsWith('H') && tagName.length === 2) {
          // Handle Headings (preserve inline formatting)
          const levelMap: Record<string, any> = {
            H1: HeadingLevel.HEADING_1,
            H2: HeadingLevel.HEADING_2,
            H3: HeadingLevel.HEADING_3,
            H4: HeadingLevel.HEADING_4,
            H5: HeadingLevel.HEADING_5,
          };
          const runs = parseInlineNodes(element);
          paragraphs.push(
            new Paragraph({
              children: runs,
              heading: levelMap[tagName] || HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 },
            }),
          );
        } else if (tagName === 'UL' || tagName === 'OL') {
          // Handle Lists
          const items = element.querySelectorAll(':scope > li');
          items.forEach((li) => {
            const runs = parseInlineNodes(li);
            paragraphs.push(
              new Paragraph({
                children: runs,
                bullet: { level: 0 },
                spacing: { after: 50 },
              }),
            );
          });
        } else if (tagName === 'LI') {
          // Fallback for LI not in UL/OL (rare)
          const runs = parseInlineNodes(element);
          paragraphs.push(
            new Paragraph({
              children: runs,
              bullet: { level: 0 },
            }),
          );
        } else {
          // Generic container (DIV, SECTION, P, etc.) -> Recurse
          // Even P can contain block elements in loose HTML, though invalid
          paragraphs.push(...processNodeList(element.childNodes));
        }

        return paragraphs;
      };

      const allParagraphs = processNodeList(body.childNodes);

      // docx requires at least one paragraph
      if (allParagraphs.length === 0) {
        allParagraphs.push(new Paragraph({ text: '' }));
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: allParagraphs,
          },
        ],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      console.error('Word generation error:', error);
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }
}
