/**
 * Sanitizes error messages to prevent information leakage
 * Maps database error codes to user-friendly messages
 */
export const getErrorMessage = (error: any): string => {
  // Handle Zod validation errors separately (these are safe to show)
  if (error?.name === 'ZodError') {
    return error.issues?.[0]?.message || 'Erro de validação';
  }

  // Map common Postgres error codes
  if (error?.code === '23505') return 'Este registo já existe';
  if (error?.code === '23503') return 'Não é possível eliminar - existem registos relacionados';
  if (error?.code === '23502') return 'Campos obrigatórios em falta';
  if (error?.code === '42501') return 'Não tem permissão para esta operação';
  if (error?.code === 'PGRST301') return 'Acesso negado';
  
  // Map Supabase auth errors
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Credenciais inválidas. Verifique o seu email e palavra-passe.';
  }
  if (error?.message?.includes('Email not confirmed')) {
    return 'Email não confirmado. Verifique a sua caixa de entrada.';
  }

  // Log the actual error server-side (in production, this should go to a logging service)
  if (import.meta.env.DEV) {
    console.error('Error details (dev only):', error);
  }

  // Generic fallback - never expose raw error messages
  return 'Ocorreu um erro. Por favor, tente novamente.';
};
