require("dotenv").config();
console.log("DEBUG .env =>", process.env);

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_KEY = process.env.TMDB_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

console.log("TMDB_KEY carregada (backend):", TMDB_KEY);
console.log("GROQ_KEY carregada (backend):", GROQ_KEY);

// ---------------------------
// ROTA: BUSCAR FILME NA TMDB
// ---------------------------
app.get("/filme", async (req, res) => {
  const titulo = req.query.titulo;

  if (!titulo) {
    return res.status(400).json({ erro: "Título não informado" });
  }

  try {
    console.log("Buscando filme:", titulo);

    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      titulo
    )}&language=pt-BR&api_key=${TMDB_KEY}`;

    const resp = await fetch(url);
    const json = await resp.json();

    console.log("Resposta TMDB:", json);

    if (!json.results || json.results.length === 0) {
      return res.status(404).json({ erro: "Filme não encontrado" });
    }

    const filme = json.results[0];
    return res.json(filme);
  } catch (err) {
    console.error("Erro TMDB:", err);
    return res.status(500).json({ erro: "Erro interno ao buscar filme" });
  }
});

// ---------------------------
// IA - USANDO GROQ
// ---------------------------
app.post("/api/chat", async (req, res) => {
  const { pergunta, filme } = req.body;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // CORRIGIDO: Uso de crases para Template Literal
        Authorization: `Bearer ${GROQ_KEY}`, 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Você é um assistente que resume filmes." },
          {
            role: "user",
            // CORRIGIDO: Uso de crases para Template Literal
            content: `${pergunta}\n\nFilme: ${filme.title}\nDescrição: ${filme.overview}`,
          },
        ],
      }),
    });

    const data = await groqRes.json();
    console.log("Resposta GROQ:", data);

    if (!data.choices) {
      // Adicionado um log para depuração caso a IA retorne um erro sem 'choices'
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
app.listen(3001, () => console.log("Backend rodando na porta 3001"));