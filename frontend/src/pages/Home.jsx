import { useState, useEffect } from "react";
import "../App.css";
import api from "../services/api";
import { logout } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { validarToken } from "../services/validar";

export default function Home() {
  const [titulo, setTitulo] = useState("");
  const [filme, setFilme] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loadingFilme, setLoadingFilme] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);

  const [abrirModal, setAbrirModal] = useState(false);
  const [historico, setHistorico] = useState([]);

  /* ============================================================
     ========================= CARROSSEL =========================
     ============================================================ */
  const destaques = [
    "https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg",
    "https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
    "https://image.tmdb.org/t/p/original/8uVKfOJUhmybNsVh089EqLHUYEG.jpg",
    "https://image.tmdb.org/t/p/original/5mzr6JZbrqnqD8rCEvPhuCE5Fw2.jpg",
    "https://image.tmdb.org/t/p/original/egoyMDLqCxzjnSrWOz50uLlJWmD.jpg",
    "https://image.tmdb.org/t/p/original/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg",
    "https://image.tmdb.org/t/p/original/9yBVqNruk6Ykrwc32qrK2TIE5xw.jpg",
    "https://image.tmdb.org/t/p/original/2vFuG6bWGyQUzYS9d69E5l85nIz.jpg",
    "https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
  ];

  const [indexDestaque, setIndexDestaque] = useState(0);
  const [bgAtual, setBgAtual] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function checar() {
      const valido = await validarToken();
      if (!valido) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }

    checar();

    // Se a pessoa tentar editar o token no navegador
    window.addEventListener("storage", checar);

    return () => window.removeEventListener("storage", checar);
  }, [navigate]);

  // Precarregar imagem
  useEffect(() => {
    const img = new Image();
    img.src = destaques[indexDestaque];
    img.onload = () => {
      setBgAtual(destaques[indexDestaque]);
    };
  }, [indexDestaque]);

  // autoplay de 4s
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndexDestaque((i) => (i + 1) % destaques.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  const proxima = () => {
    setIndexDestaque((i) => (i + 1) % destaques.length);
  };

  const anterior = () => {
    setIndexDestaque((i) => (i - 1 + destaques.length) % destaques.length);
  };

  /* ============================================================
     ======================== BUSCAR FILME =======================
     ============================================================ */
  async function buscarFilme() {
    if (!titulo) return;
    setLoadingFilme(true);
    setFilme(null);

    try {
      const resp = await api.get(`/filme?titulo=${encodeURIComponent(titulo)}`);
      const data = resp.data;
      setFilme(data);
      setAbrirModal(true);

      setHistorico((prev) => {
        if (prev.find((f) => f.id === data.id)) return prev;
        return [data, ...prev];
      });
    } catch (err) {
      console.log("Erro ao buscar filme:", err);
    } finally {
      setLoadingFilme(false);
    }
  }

  /* ============================================================
     ========================== IA GROQ ==========================
     ============================================================ */
  async function perguntarIa() {
    if (!filme || !pergunta) return;
    setLoadingIa(true);

    try {
      const resp = await api.post("/api/chat", { pergunta, filme });
      setResposta(resp.data.resposta);
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

  /* ============================================================
     ====================== RETORNO DA HOME ======================
     ============================================================ */

  return (
    <div className="tela-dividida">

      {/* ======================== TOPO / HERO ======================== */}
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
        {/* Setas */}
        <button className="seta-esquerda" onClick={anterior}>❮</button>
        <button className="seta-direita" onClick={proxima}>❯</button>

        {/* Gradiente */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 70%)",
          }}
        />

        {/* Conteúdo */}
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
          <header style={{ textAlign: "center" }}>
            <h1 className="tituloPrincipal">🎬 Movie Genius</h1>
            <p className="tituloSecundario">
              Busque filmes e converse com a IA sobre eles!
            </p>
          </header>

          {/* Botão logout */}
          <button className="logoutBtn" onClick={logout}>Sair</button>

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
              <p className="modal-text">
                {filme.overview}
                <br /><br />
                <strong>Ano:</strong>{" "}
                {filme.release_date ? filme.release_date.split("-")[0] : "N/A"}
              </p>

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

              {loadingIa && <p style={{ marginTop: 10 }}>⌛ Gerando resposta...</p>}

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