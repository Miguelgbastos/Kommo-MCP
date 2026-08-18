import { KommoAPI } from '../kommo-api.js';

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const MCP_RESOURCES: McpResource[] = [
  {
    uri: 'kommo://reports/sales',
    name: 'Relatório de vendas',
    description: 'Resumo de vendas do Kommo CRM',
    mimeType: 'application/json',
  },
  {
    uri: 'kommo://pipelines',
    name: 'Pipelines',
    description: 'Lista de pipelines de vendas',
    mimeType: 'application/json',
  },
  {
    uri: 'kommo://loss_reasons',
    name: 'Motivos da perda de leads',
    description: 'Lista de motivos da perda de leads (API 2026)',
    mimeType: 'application/json',
  },
  {
    uri: 'kommo://dashboard',
    name: 'Dashboard',
    description: 'Dados do dashboard do Kommo CRM',
    mimeType: 'application/json',
  },
  {
    uri: 'kommo://account',
    name: 'Conta',
    description: 'Informações da conta Kommo',
    mimeType: 'application/json',
  },
];

const RESOURCE_URIS = new Set(MCP_RESOURCES.map((r) => r.uri));

export function isKnownResource(uri: string): boolean {
  return RESOURCE_URIS.has(uri);
}

export async function readResource(kommoAPI: KommoAPI, uri: string): Promise<string> {
  switch (uri) {
    case 'kommo://reports/sales': {
      const dateTo = new Date();
      const dateFrom = new Date(dateTo);
      dateFrom.setMonth(dateFrom.getMonth() - 1);
      const salesData = await kommoAPI.getSalesReport(
        dateFrom.toISOString().slice(0, 10),
        dateTo.toISOString().slice(0, 10),
      );
      return JSON.stringify(salesData, null, 2);
    }
    case 'kommo://loss_reasons':
      return JSON.stringify(await kommoAPI.getLossReasons(), null, 2);
    case 'kommo://pipelines':
      return JSON.stringify(await kommoAPI.getPipelines(), null, 2);
    case 'kommo://dashboard':
      return JSON.stringify(await kommoAPI.getDashboardData(), null, 2);
    case 'kommo://account':
      return JSON.stringify(await kommoAPI.getAccount(), null, 2);
    default:
      throw new Error(`Unknown resource URI: ${uri}`);
  }
}
