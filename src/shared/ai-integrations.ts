// ============================================================
// AI Integration Configs — Claude, v0, Cursor
// ============================================================

import type { AIIntegration, ComponentExtraction } from './types';
import { generateExport } from './prompt-templates';

export const AI_INTEGRATIONS: AIIntegration[] = [
  {
    id: 'clipboard',
    name: 'Copy to Clipboard',
    icon: '📋',
    promptTemplate: (extraction: ComponentExtraction) =>
      generateExport(extraction, 'ai-prompt'),
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '🤖',
    launchUrl: 'https://claude.ai/new',
    promptTemplate: (extraction: ComponentExtraction) => {
      const prompt = generateExport(extraction, 'ai-prompt');
      return `Please recreate this UI component using React with Tailwind CSS. Here are the details:\n\n${prompt}`;
    },
  },
  {
    id: 'v0',
    name: 'v0',
    icon: '⚡',
    launchUrl: 'https://v0.dev',
    promptTemplate: (extraction: ComponentExtraction) => {
      const prompt = generateExport(extraction, 'ai-prompt');
      return `Build this component using shadcn/ui and Tailwind CSS v4. Use appropriate shadcn components where possible:\n\n${prompt}`;
    },
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '✏️',
    protocolHandler: 'cursor://',
    promptTemplate: (extraction: ComponentExtraction) =>
      generateExport(extraction, 'ai-prompt'),
  },
];

export function getIntegration(id: string): AIIntegration | undefined {
  return AI_INTEGRATIONS.find(i => i.id === id);
}
