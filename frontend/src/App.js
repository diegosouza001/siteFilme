import { useState, useEffect } from "react";
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

  /* ======================== CARROSSEL ======================== */
  const destaques = [
    "/wJODKEzcb2XYqGpoqf4v7b4j4T2.jpg",
    "/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    "/gSkfBGXRE9snMSKWOuN8TYdIvP7.jpg",
    "/gpWiyFvffnYbS7MApNrWdiG8HCA.jpg",
    "/uKb22E0nlzr914bA8XX2IxaaH7S.jpg",
  ];

  const [indexDestaque, setIndexDestaque] = useState(0);
  const [bgAtual, setBgAtual] = useState("");

  // PRECARREGAR IMAGEM → sem piscar
  useEffect(() => {
    const url = `https://image.tmdb.org/t/p/original${destaques[indexDestaque]}`;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setBgAtual(url); // só troca quando a imagem carrega
    };
  }, [indexDestaque]);

  // autoplay suave de 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setIndexDestaque((i) => (i + 1) % destaques.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  /* ======================== BUSCAR FILME ======================== */
  async function buscarFilme() {
    if (!titulo) return;
    setLoadingFilme(true);
    setFilme(null);

    try {
      const resp = await fetch(
        `http://localhost:3001/filme?titulo=${encodeURIComponent(titulo)}`
      );
      const data = await resp.json();
      setFilme(data);

      setAbrirModal(true);

      setHistorico((prev) => {
        if (prev.find((f) => f.id === data.id)) return prev;
        return [data, ...prev];
      });
    } catch (err) {
      console.error("Erro ao buscar filme:", err);
    } finally {
      setLoadingFilme(false);
    }
  }

  /* ======================== IA ======================== */
  async function perguntarIa() {
    if (!filme || !pergunta) return;
    setLoadingIa(true);

    try {
      const resp = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, filme }),
      });

      const data = await resp.json();
      setResposta(data.resposta);
    } catch (err) {
      setResposta("Erro ao gerar resposta.");
    } finally {
      setLoadingIa(false);
    }
  }

  const fecharModal = () => {
    setAbrirModal(false);
    setPergunta("");
    setResposta("");
  };

  return (
    <div className="tela-dividida">

      {/* ======================== TOPO COM CARROSSEL ======================== */}
      <div
        className="topo-streaming"
        style={{
          backgroundImage: bgAtual ? `url(${bgAtual})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.8s ease-in-out",
          position: "relative",
        }}
      >
        {/* gradiente sobre imagem */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1100,
            margin: "0 auto",
            paddingTop: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 25,
          }}
        >
          {/* Header */}
          <header style={{ textAlign: "center" }}>
            <h1 className="tituloPrincipal">🎬 Movie Genius</h1>
            <p className="tituloSecundario">
              Busque filmes e converse com a IA sobre eles!
            </p>
          </header>

          {/* Busca */}
          <div className="box-busca">
            <h2 className="buscarFilmeLabel">Buscar Filme</h2>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <input
                type="text"
                className="inputPrin"
                placeholder="Digite o nome do filme..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <button onClick={buscarFilme} className="buttonBuscar">
                Buscar
              </button>
            </div>

            {loadingFilme && (
              <p style={{ marginTop: 10, color: "#d8b4fe" }}>
                🔎 Buscando filme...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ======================== HISTÓRICO ======================== */}
      <div className="fundo-roxo">
        {historico.length > 0 ? (
          <div className="carrossel-filmes">
            {historico.map((f, index) => (
              <img
                key={index}
                src={`https://image.tmdb.org/t/p/w200${f.poster_path}`}
                alt={f.title}
                className="filme-card"
                onClick={() => {
                  setFilme(f);
                  setAbrirModal(true);
                  setPergunta("");
                  setResposta("");
                }}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: "#ddd" }}>Nenhum filme no histórico ainda.</p>
        )}
      </div>

      {/* ======================== MODAL ======================== */}
      {abrirModal && filme && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button onClick={fecharModal} className="modal-close">
              X
            </button>

            <img
              src={`https://image.tmdb.org/t/p/w400${filme.poster_path}`}
              alt="Poster"
              className="modal-poster"
            />

            <div className="modal-textos">
              <h2 className="modal-title">{filme.title}</h2>
              <p className="modal-text">{filme.overview}</p>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <textarea
                  className="inputIA"
                  placeholder="Pergunte algo sobre o filme..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  rows={3}
                />
                <button onClick={perguntarIa} className="buttonIA">
                  Enviar
                </button>
              </div>

              {loadingIa && (
                <p style={{ marginTop: 10 }}>⌛ Gerando resposta...</p>
              )}

              {resposta && (
                <div className="resposta-box" style={{ marginTop: 12 }}>
                  <h3 className="resposta-titulo">Resposta da IA:</h3>
                  <p className="resposta-texto">{resposta}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
