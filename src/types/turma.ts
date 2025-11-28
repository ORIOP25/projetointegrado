export interface Turma {
  Turma_id?: number;
  Ano: number;
  Turma: string;         // char(1)
  AnoLetivo: string;     // ex: "2024/2025"
  DiretorT?: number;     // Professor_id
}
