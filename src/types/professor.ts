export interface Professor {
  Professor_id?: number;
  email: string;
  hashed_password: string;
  role?: string;
  Nome: string;
  Data_Nasc: string;       // date -> string ISO
  Telefone?: string;      // char(9)
  Morada?: string;
  Escalao_id?: number;
  Depart_id?: number;
}
