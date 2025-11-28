export interface Escalao {
  Escalao_id: number;
  Nome: string;
  Descricao?: string;
  Valor_Base: number; // decimal -> number
  Bonus?: number;     // decimal -> number
}
