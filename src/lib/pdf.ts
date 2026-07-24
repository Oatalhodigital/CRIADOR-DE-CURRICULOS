import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import ResumePDF from '@/components/ResumePDF';
import { Resume } from '@/types/resume';

export async function generateResumePdfBuffer(resume: Resume): Promise<Buffer> {
  const element = createElement(ResumePDF, { resume });
  const buffer = await (renderToBuffer as any)(element);
  return buffer as Buffer;
}
