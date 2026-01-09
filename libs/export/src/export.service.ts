import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { JSDOM } from 'jsdom';
import axios from 'axios';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly pdfShiftApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.pdfShiftApiKey = this.configService.get<string>('PDF_SHIFTER_API_KEY');
  }

  /**
   * Generate PDF from HTML using PDFShift API
   */
  async generatePdf(html: string): Promise<Buffer> {
    try {
      if (!this.pdfShiftApiKey) {
        throw new Error('PDF_SHIFTER_API_KEY is not configured');
      }

      this.logger.log('Generating PDF via PDFShift API...');

      const response = await axios.post(
        'https://api.pdfshift.io/v3/convert/pdf',
        {
          source: html,
          format: 'A4',
          margin: '0',
        },
        {
          headers: {
            'X-API-Key': this.pdfShiftApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        },
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        `PDFShift Error: ${error.response?.data?.toString() || error.message}`,
      );
      throw new Error(`Failed to generate PDF: ${error.message}`);
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
              runs.push(...parseInlineNodes(node, formatting));
            }
          }
        });

        return runs;
      };

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
            const wrapper = document.createElement('div');
            inlineAccumulator.forEach((n) =>
              wrapper.appendChild(n.cloneNode(true)),
            );

            const runs = parseInlineNodes(wrapper);
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
            flushInline();
            paragraphs.push(...parseBlockElement(node as Element));
          } else {
            inlineAccumulator.push(node);
          }
        });

        flushInline();
        return paragraphs;
      };

      const parseBlockElement = (element: Element): Paragraph[] => {
        const tagName = element.tagName;
        const paragraphs: Paragraph[] = [];

        if (tagName.startsWith('H') && tagName.length === 2) {
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
          const runs = parseInlineNodes(element);
          paragraphs.push(
            new Paragraph({
              children: runs,
              bullet: { level: 0 },
            }),
          );
        } else {
          paragraphs.push(...processNodeList(element.childNodes));
        }

        return paragraphs;
      };

      const allParagraphs = processNodeList(body.childNodes);

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
    } catch (error: any) {
      this.logger.error('Word generation error:', error);
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }

  /**
   * Generate Image (PNG) from HTML using PDFShift API
   */
  async generateImage(html: string): Promise<Buffer> {
    try {
      if (!this.pdfShiftApiKey) {
        throw new Error('PDF_SHIFTER_API_KEY is not configured');
      }

      this.logger.log('Generating Image via PDFShift API...');

      const response = await axios.post(
        'https://api.pdfshift.io/v3/convert/png',
        {
          source: html,
          width: 800,
          height: 1040,
        },
        {
          headers: {
            'X-API-Key': this.pdfShiftApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        },
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      this.logger.error(
        `PDFShift Image Error: ${
          error.response?.data?.toString() || error.message
        }`,
      );
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }
}
