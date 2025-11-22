import { useState } from "react";
import "./App.css";

export default function App() {
  const [titulo, setTitulo] = useState("");
  const [filme, setFilme] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loadingFilme, setLoadingFilme] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);

  async function buscarFilme() {
    if (!titulo) return;
    setLoadingFilme(true);
    setFilme(null);

    // CORREÇÃO 1: Usando CRASES para Template Literal
    const resp = await fetch(`http://localhost:3001/filme?titulo=${encodeURIComponent(titulo)}`);
    const data = await resp.json();
    setFilme(data);
    setLoadingFilme(false);
  }

  async function perguntarIa() {
    if (!filme || !pergunta) return;
    setLoadingIa(true);

    const resp = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta, filme }),
    });

    const data = await resp.json();
    setResposta(data.resposta);
    setLoadingIa(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black text-white flex flex-col items-center p-10 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-6xl font-extrabold text-purple-400 drop-shadow-2xl mb-4">🎬 Movie Genius</h1>
        <p className="text-gray-300 text-lg">Busque filmes e converse com a IA sobre eles!</p>
      </header>

      {/* Busca */}
      <div className="bg-gradient-to-r from-purple-800 via-gray-800 to-purple-700 p-8 rounded-3xl shadow-2xl w-full max-w-2xl mb-10 border border-gray-600">
        <h2 className="text-3xl font-semibold mb-5 text-purple-200">Buscar Filme</h2>
        <div className="flex gap-4">
          <input 
            type="text"
            className="inputPrin"
            placeholder="Digite o nome do filme..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <button
            onClick={buscarFilme}
            className="px-6 py-4 bg-purple-500 hover:bg-purple-600 active:scale-95 rounded-2xl transition font-bold shadow-lg text-lg"
          >
            Buscar
          </button>
        </div>
        {loadingFilme && <p className="mt-4 animate-pulse text-purple-300">🔎 Buscando filme...</p>}
      </div>

      {/* Filme */}
      {filme && (
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-2xl mb-10 border border-gray-600 flex flex-col items-center">
          <h2 className="text-4xl font-bold text-purple-300 mb-5 text-center">{filme.title}</h2>
          {filme.poster_path && (
            <img // O parser deve estar reclamando da tag <img> sem fechamento. Adicionei a correção abaixo.
              // CORREÇÃO 2: Usando CRASES para Template Literal DENTRO do JSX {}
              src={`https://image.tmdb.org/t/p/w300${filme.poster_path}`}
              alt="Poster"
              className="rounded-3xl mb-5 shadow-2xl border border-gray-600 w-64"
            />
          )}
          <p className="text-gray-300 text-center text-lg">{filme.overview}</p>
        </div>
      )}

      {/* Chat IA */}
      {filme && (
        <div className="bg-gradient-to-r from-purple-900 via-gray-800 to-purple-800 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-600">
          <h2 className="text-3xl font-bold mb-5 text-purple-200 text-center">🤖 Perguntar à IA</h2>

          <textarea
            className="w-full p-5 rounded-2xl bg-gray-700 border border-gray-600 h-32 mb-5 focus:ring-2 focus:ring-purple-400 outline-none text-white placeholder-gray-400 resize-none shadow-inner text-lg"
            placeholder="Ex: Me dê um resumo simples do filme..."
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
          />

          <button
            onClick={perguntarIa}
            className="w-full py-4 bg-purple-500 hover:bg-purple-600 active:scale-95 rounded-2xl transition font-bold shadow-lg text-lg"
          >
            Enviar
          </button>

          {loadingIa && <p className="mt-4 animate-pulse text-purple-300">⌛ Gerando resposta...</p>}

          {resposta && (
            <div className="mt-6 bg-gray-700 p-6 rounded-3xl border border-gray-600 shadow-inner">
              <h3 className="font-bold mb-4 text-purple-300 text-xl text-center">Resposta da IA:</h3>
              <p className="text-gray-200 whitespace-pre-line text-lg">{resposta}</p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-16 text-gray-500 text-center text-sm">
        &copy; 2025 Movie Genius. Todos os direitos reservados.
      </footer>
    </div>
  );
}