require("dotenv").config();
console.log("DEBUG .env =>", process.env);

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg"); 


const TMDB_KEY = process.env.TMDB_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "your-strong-jwt-secret-key"; 
const POSTGRES_URL = process.env.POSTGRES_URL; 


const PG_CONFIG = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
};


console.log("DEBUG: POSTGRES_URL sendo usada:", POSTGRES_URL ? "Definida" : "NÃO DEFINIDA"); 


const isLocalhost = POSTGRES_URL && (POSTGRES_URL.includes("localhost") || POSTGRES_URL.includes("127.0.0.1"));


const connectionOptions = POSTGRES_URL 
  ? { connectionString: POSTGRES_URL }
  : PG_CONFIG;


connectionOptions.ssl = isLocalhost ? false : { rejectUnauthorized: false };

const db = new Pool(connectionOptions);




// Função para garantir que a tabela de usuários 
async function ensureUsersTableExists() {
  try {
    // Tenta obter uma conexão simples para verificar se a Pool está funcionando
    await db.query("SELECT 1 + 1 AS result"); 
    console.log("Conexão com o PostgreSQL bem-sucedida.");
    
    // CORRIGIDO: Usando o nome correto da sua tabela: usuarios
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

const app = express();
// A URL EXATA do seu frontend deployado na Vercel
// ATENÇÃO: Verifique se essa lista de allowedOrigins está no seu backend
const allowedOrigins = [
    // NOVA URL DE PRODUÇÃO
    'https://sitefilmetrabalho.vercel.app', 
    
    // Antiga URL da Vercel (se ainda estiver em uso para algum ambiente)
    'https://site-filme-orjl-pm718pvjs-diegos-projects-bfd38045.vercel.app', 
    'https://sitefilmetrabalho-2d1gz0d0i-diegos-projects-bfd38045.vercel.app',
    
    // Localhost para desenvolvimento
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

// ... (Resto do seu código backend)


app.use(express.json());

console.log("TMDB_KEY carregada (backend):", TMDB_KEY ? "Sim" : "Não");
console.log("GROQ_KEY carregada (backend):", GROQ_KEY ? "Sim" : "Não");

// ---------------------------
// 3. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ---------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ erro: "Token inválido ou expirado." });
    }
    req.user = user; 
    next();
  });
}



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
    console.log(`DEBUG: Hash de senha gerado para ${email}.`); 

    // 3. Inserir novo usuário (QUERY CORRIGIDA: usa 'usuarios')
    const result = await db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, senha_hash]
    );

    const user = result.rows[0];
    
    // 4. Gerar JWT
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    console.log(`DEBUG: Usuário ${user.nome} (${user.email}) registado com ID ${user.id}.`);
    console.log("DEBUG: JWT gerada:", token); // <-- NOVO LOG AQUI

    // O frontend espera 'username', então mapeamos 'nome' para 'username' na resposta
    res.status(201).json({ token, username: user.nome, message: "Utilizador registado com sucesso." });
  } catch (err) {
    console.error("ERRO CRÍTICO NO REGISTRO:", err.message, err.stack); 
    res.status(500).json({ erro: "Erro interno ao registar utilizador. Verifique o console do backend." });
  }
});

// ROTA: LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body; 

  if (!email || !password) {
    return res.status(400).json({ erro: "E-mail e palavra-passe são obrigatórios." });
  }

  try {
    // 1. Buscar usuário pelo E-mail (QUERY CORRIGIDA: usa 'usuarios')
    const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const user = result.rows[0];

    // 2. Comparar senha (usando a coluna 'senha' do banco)
    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    // 3. Gerar JWT
    const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    console.log("DEBUG: JWT gerada:", token); // <-- NOVO LOG AQUI

    // O frontend espera 'username', então mapeamos 'nome' para 'username' na resposta
    res.json({ token, username: user.nome, message: "Login efetuado com sucesso." });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno ao fazer login." });
  }
});



app.get("/filme", authenticateToken, async (req, res) => {
  const titulo = req.query.titulo;
  
  console.log(`Utilizador ${req.user.nome} a procurar filme: ${titulo}`);

  if (!titulo) {
    return res.status(400).json({ erro: "Título não fornecido" });
  }

  try {
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      titulo
    )}&language=pt-BR&api_key=${TMDB_KEY}`;

    const resp = await fetch(url);
    const json = await resp.json();

    if (!json.results || json.results.length === 0) {
      return res.status(404).json({ erro: "Filme não encontrado" });
    }

    const filme = json.results[0];
    return res.json(filme);
  } catch (err) {
    console.error("Erro TMDB:", err);
    return res.status(500).json({ erro: "Erro interno ao procurar filme" });
  }
});

// IA - USANDO GROQ - AGORA PROTEGIDA
app.post("/api/chat", authenticateToken, async (req, res) => {
  const { pergunta, filme } = req.body;

  console.log(`Utilizador ${req.user.nome} a consultar IA sobre: ${filme.title}`);

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

// ---------------------------
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

    return res.json({ valido: true });
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));

// app.listen(3001, () => console.log("Backend a correr na porta 3001"));