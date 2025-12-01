require("dotenv").config();
// O dotenv é usado apenas LOCALMENTE. No Render, as variáveis são injetadas diretamente.
// console.log("DEBUG .env =>", process.env); // Descomente apenas para debug local

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg"); 
const fetch = require("node-fetch"); // Necessário para usar 'fetch' no Node.js antigo

// --- VARIÁVEIS DE AMBIENTE ---
const TMDB_KEY = process.env.TMDB_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
// Usar uma chave forte em produção (definida no Render)
const JWT_SECRET = process.env.JWT_SECRET || "sua-chave-secreta-forte-aqui"; 
const POSTGRES_URL = process.env.POSTGRES_URL; 

// Configuração para ambientes que usam variáveis separadas (como o Render, se não usar POSTGRES_URL)
const PG_CONFIG = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
};

// Log de Verificação
console.log("TMDB_KEY carregada (backend):", TMDB_KEY ? "Sim" : "Não");
console.log("GROQ_KEY carregada (backend):", GROQ_KEY ? "Sim" : "Não");
console.log("DEBUG: POSTGRES_URL sendo usada:", POSTS_URL ? "Definida" : "NÃO DEFINIDA"); 


// --- CONEXÃO COM O BANCO DE DADOS (POSTGRES) ---
const isLocalhost = POSTGRES_URL && (POSTGRES_URL.includes("localhost") || POSTGRES_URL.includes("127.0.0.1"));

const connectionOptions = POSTGRES_URL 
  ? { connectionString: POSTGRES_URL } // Usar string de conexão (Render)
  : PG_CONFIG; // Usar objeto de config (Local)

// Configuração SSL/TLS: Necessário para conexões externas (como no Render)
connectionOptions.ssl = isLocalhost ? false : { rejectUnauthorized: false };

const db = new Pool(connectionOptions);


// Função para garantir que a tabela de usuários exista
async function ensureUsersTableExists() {
  try {
    // Tenta testar a conexão
    await db.query("SELECT 1 + 1 AS result"); 
    console.log("Conexão com o PostgreSQL bem-sucedida.");
    
    // Cria a tabela 'usuarios' se não existir
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(200) NOT NULL,
        criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Tabela 'usuarios' verificada/criada com sucesso.");
  } catch (err) {
    console.error("ERRO FATAL: Falha ao inicializar o banco de dados. Motivo:", err.message);
  }
}

// Inicializa o banco de dados antes de iniciar o servidor
ensureUsersTableExists();

// --- CONFIGURAÇÃO DO EXPRESS E MIDDLEWARES ---
const app = express();

// Lista de URLs de frontend permitidas (CORS)
const allowedOrigins = [
    'https://sitefilmetrabalho.vercel.app', 
    'https://site-filme-orjl-pm718pvjs-diegos-projects-bfd38045.vercel.app', 
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://localhost:3001' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); 
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); 
        } else {
            console.error(`CORS Blocked: Origin ${origin} not allowed.`);
            callback(new Error('Acesso negado pelo CORS'), false); 
        }
    },
    credentials: true
}));

app.use(express.json());

// ---------------------------
// 1. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ---------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // 401: Não há token.
    return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      // 403: Token inválido ou expirado.
      return res.status(403).json({ erro: "Token inválido ou expirado." });
    }
    req.user = user; 
    next();
  });
}


// --- 2. ROTAS DE AUTENTICAÇÃO ---

// ROTA: REGISTRO
app.post("/auth/register", async (req, res) => {
  const { nome, email, password } = req.body; 

  if (!nome || !email || !password) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  try {
    const existingUser = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }

    // 2. Hash da senha
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash(password, saltRounds);
    
    // 3. Inserir novo usuário
    const result = await db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, senha_hash]
    );

    const user = result.rows[0];
    
    // 4. Gerar JWT
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    console.log(`DEBUG: Usuário ${user.nome} registado.`);
    
    res.status(201).json({ token, username: user.nome, message: "Utilizador registado com sucesso." });
  } catch (err) {
    console.error("ERRO CRÍTICO NO REGISTRO:", err.message, err.stack); 
    res.status(500).json({ erro: "Erro interno ao registar utilizador." });
  }
});

// ROTA: LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body; 

  if (!email || !password) {
    return res.status(400).json({ erro: "E-mail e palavra-passe são obrigatórios." });
  }

  try {
    // 1. Buscar usuário pelo E-mail
    const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const user = result.rows[0];

    // 2. Comparar senha
    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    // 3. Gerar JWT
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    console.log(`DEBUG: Usuário ${user.nome} logado com sucesso.`);

    res.json({ token, username: user.nome, message: "Login efetuado com sucesso." });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno ao fazer login." });
  }
});


// ROTA: VALIDAR TOKEN
app.get("/auth/validar", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ valido: false });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.json({ valido: false });
    }

    return res.json({ valido: true, user });
  });
});


// --- 3. ROTAS DE FUNCIONALIDADE (PROTEGIDAS) ---

// ROTA: BUSCA DE FILME (TMDB)
app.get("/filme", authenticateToken, async (req, res) => {
  const titulo = req.query.titulo;
  
  console.log(`Utilizador ${req.user.nome} a procurar filme: ${titulo}`);

  if (!titulo) {
    return res.status(400).json({ erro: "Título não fornecido" });
  }
  
  // VERIFICAÇÃO FINAL: Chave TMDB
  if (!TMDB_KEY) {
      console.error("ERRO: TMDB_API_KEY não está definida!");
      return res.status(500).json({ erro: "Chave da API de Filmes não configurada no servidor." });
  }

  try {
    // A TMDB recomenda 'api_key' como query parameter para chaves v3
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      titulo
    )}&language=pt-BR&api_key=${TMDB_KEY}`;

    const resp = await fetch(url);
    const json = await resp.json();

    if (resp.status === 401) {
        // Loga o erro específico da TMDB se for 401
        console.error("Erro 401 TMDB:", json.status_message); 
        return res.status(401).json({ erro: "A chave da TMDB API é inválida ou não tem permissão." });
    }
    
    if (json.results && json.results.length > 0) {
        const filme = json.results[0];
        return res.json(filme);
    }

    // Nenhuma exceção lançada, mas não há resultados
    return res.status(404).json({ erro: "Filme não encontrado" });

  } catch (err) {
    console.error("Erro TMDB:", err);
    return res.status(500).json({ erro: "Erro interno ao procurar filme" });
  }
});

// ROTA: CHAT IA (GROQ)
app.post("/api/chat", authenticateToken, async (req, res) => {
  const { pergunta, filme } = req.body;

  console.log(`Utilizador ${req.user.nome} a consultar IA sobre: ${filme.title}`);
  
  // VERIFICAÇÃO FINAL: Chave GROQ
  if (!GROQ_KEY) {
      console.error("ERRO: GROQ_API_KEY não está definida!");
      return res.status(500).json({ resposta: "Chave da API da IA (GROQ) não configurada no servidor." });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // A API da GROQ usa Bearer Token
        Authorization: `Bearer ${GROQ_KEY}`, 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "É um assistente que resume filmes." },
          {
            role: "user",
            content: `${pergunta}\n\nFilme: ${filme.title}\nDescrição: ${filme.overview}`,
          },
        ],
      }),
    });

    const data = await groqRes.json();

    if (!data.choices) {
      console.error("GROQ API Error:", data); 
      return res.status(500).json({ resposta: "Erro ao gerar resposta pela IA (GROQ)." });
    }

    res.json({ resposta: data.choices[0].message.content });

  } catch (err) {
    console.error("Erro IA GROQ:", err);
    res.status(500).json({ resposta: "Erro ao conectar com a IA (GROQ)." });
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));