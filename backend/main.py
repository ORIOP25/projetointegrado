from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Inicializar a aplicação FastAPI
app = FastAPI(
    title="SIGE API",
    description="API para o Sistema Integrado de Gestão Educacional",
    version="1.0.0"
)

# Configurar CORS (Cross-Origin Resource Sharing)
# Isto permite que o teu Frontend (React) na porta 5173 fale com este Backend na porta 8000
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permitir GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Permitir todos os cabeçalhos
)

# Rota de teste simples
@app.get("/")
def read_root():
    return {"status": "online", "mensagem": "Bem-vindo à API do SIGE!"}

# Se executarmos este ficheiro diretamente, arranca o servidor
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)