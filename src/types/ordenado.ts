export interface Ordenado {
  Ordenado_id?: number;
  Funcionario_id: number;
  Tipo_Funcionario: 'Professor' | 'Staff';
  Mes?: string;
  Ano?: number;
  Valor?: number;
  Data_Pagamento?: string;
  Observacoes?: string;
}
