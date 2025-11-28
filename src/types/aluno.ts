export interface Aluno {
  Aluno_id?: number;
  Nome: string;
  Data_Nasc: string;     // date -> string ISO
  Telefone?: string;
  Morada?: string;
  Genero: 'M' | 'F';
  Ano: number;
  Turma_id?: number;
  Escalao?: string;
  EE_id?: number;
}
