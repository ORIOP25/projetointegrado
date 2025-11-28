export interface Transacao {
  Transacao_id?: number;
  Tipo: 'Receita' | 'Despesa';
  Valor?: number;
  Data?: string;
  Descricao?: string;
  Fin_id?: number;
  Fornecedor_id?: number;
}
