import { useState } from "react";
import "./App.css";

export default function App() {
  const [titulo, setTitulo] = useState("");
  const [filme, setFilme] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loadingFilme, setLoadingFilme] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);

  const [abrirModal, setAbrirModal] = useState(false);
  const [historico, setHistorico] = useState([]);

  // Buscar filme
  async function buscarFilme() {
    if (!titulo) return;
    setLoadingFilme(true);
    setFilme(null);

    const resp = await fetch(
      `http://localhost:3001/filme?titulo=${encodeURIComponent(titulo)}`
    );
    const data = await resp.json();
    setFilme(data);

    // Abrir modal automaticamente
    setAbrirModal(true);

    // Adicionar ao histórico (sem duplicar)
    setHistorico((prev) => {
      if (prev.find((f) => f.id === data.id)) return prev; // não adiciona duplicado
      return [data, ...prev];
    });

    setLoadingFilme(false);
  }

  // Perguntar à IA
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

  // Fechar modal
  const fecharModal = () => {
    setAbrirModal(false);
    setPergunta("");
    setResposta("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black text-white flex flex-col items-center p-10 font-sans">

      {/* ======================== MODAL ======================== */}
      {abrirModal && filme && (
        <div className="modal-overlay">
          <div className="modal-box flex flex-col md:flex-row gap-8">

            {/* Botão fechar */}
            <button onClick={fecharModal} className="modal-close">X</button>

            {/* Coluna esquerda: Poster */}
            <img
              src={`https://image.tmdb.org/t/p/w400${filme.poster_path}`}
              alt="Poster"
              className="modal-poster"
            />

            {/* Coluna direita: título, resumo e chat */}
            <div className="flex flex-col flex-1 gap-4">
              <h2 className="modal-title">{filme.title}</h2>
              <p className="modal-text">{filme.overview}</p>

              {/* Chat IA com botão ao lado */}
              <div className="flex gap-4 items-start">
                <textarea
                  className="inputIA flex-1 resize-none"
                  placeholder="Pergunte algo sobre o filme..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  rows={3}
                />
                <button
                  onClick={perguntarIa}
                  className="buttonIA self-start"
                >
                  Enviar
                </button>
              </div>

              {loadingIa && (
                <p className="text-purple-300 animate-pulse">⌛ Gerando resposta...</p>
              )}

              {resposta && (
                <div className="bg-gray-700 p-4 rounded-2xl shadow-inner border border-gray-600">
                  <h3 className="text-purple-300 font-bold mb-2">Resposta da IA:</h3>
                  <p className="text-gray-200 whitespace-pre-line">{resposta}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ====================== FIM MODAL ====================== */}

      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="tituloPrincipal">🎬 Movie Genius</h1>
        <p className="tituloSecundario">
          Busque filmes e converse com a IA sobre eles!
        </p>
      </header>

      {/* Busca */}
      <div className="bg-gradient-to-r from-purple-800 via-gray-800 to-purple-700 p-8 rounded-3xl shadow-2xl w-full max-w-2xl mb-10 border border-gray-600 flex gap-4 justify-center">
        <h2 className="buscarFilmeLabel">Buscar Filme</h2>
        <div className="flex gap-4">
          <input
            type="text"
            className="inputPrin"
            placeholder="Digite o nome do filme..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <button onClick={buscarFilme} className="buttonBuscar">Buscar</button>
        </div>
        {loadingFilme && (
          <p className="mt-4 animate-pulse text-purple-300">🔎 Buscando filme...</p>
        )}
      </div>

      {/* ====================== HISTÓRICO ====================== */}
      {historico.length > 0 && (
        <div className="historico-filmes flex gap-4 flex-wrap mt-6">
          {historico.map((f, index) => (
            <img
              key={index}
              src={`https://image.tmdb.org/t/p/w200${f.poster_path}`}
              alt={f.title}
              className="rounded-xl cursor-pointer hover:scale-105 transition"
              onClick={() => {
                setFilme(f);
                setAbrirModal(true);
                setPergunta("");
                setResposta("");
              }}
            />
          ))}
        </div>
      )}
      {/* ====================== FIM HISTÓRICO ====================== */}

    </div>
  );
}
