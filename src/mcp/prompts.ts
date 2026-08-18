export interface McpPrompt {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required?: boolean }>;
}

export const MCP_PROMPTS: McpPrompt[] = [
  { name: 'analisar_vendas_mes', description: 'Analisar vendas do mês', arguments: [] },
  { name: 'resumo_leads_status', description: 'Resumo de leads por status', arguments: [] },
  {
    name: 'analise_pipeline',
    description: 'Analisar performance de um pipeline',
    arguments: [{ name: 'pipeline_id', description: 'ID do pipeline', required: false }],
  },
  { name: 'motivos_perda', description: 'Analisar motivos de perda de leads', arguments: [] },
];

const PROMPT_MESSAGES: Record<
  string,
  Array<{ role: 'user'; content: { type: 'text'; text: string } }>
> = {
  analisar_vendas_mes: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Quantas vendas tivemos este mês? Mostre valor total e ticket médio.',
      },
    },
  ],
  resumo_leads_status: [
    {
      role: 'user',
      content: { type: 'text', text: 'Mostre um resumo de leads por status.' },
    },
  ],
  analise_pipeline: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Analise a performance do pipeline de vendas, incluindo conversão e gargalos.',
      },
    },
  ],
  motivos_perda: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Liste os motivos de perda de leads e sugira ações para reduzir perdas.',
      },
    },
  ],
};

export function isKnownPrompt(name: string): boolean {
  return name in PROMPT_MESSAGES;
}

export function getPromptMessages(name: string) {
  return PROMPT_MESSAGES[name];
}
