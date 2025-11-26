import { useState, useEffect, useCallback } from "react";
// Removemos a dependência do "./App.css" e colocamos os estilos no final do arquivo.

const BACKEND_URL = "http://localhost:3001";

// =======================================================
// Componente de Autenticação (Login/Registro)
// CORRIGIDO: Agora coleta Nome e E-mail para Registro, e E-mail para Login.
// =======================================================
const AuthForm = ({ setAuth, setIsLoading }) => {
  const [nome, setNome] = useState(""); // Novo campo para Registro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const title = isLogin ? "Fazer Login" : "Criar Conta";

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isLogin ? `${BACKEND_URL}/auth/login` : `${BACKEND_URL}/auth/register`;
    
    // CORRIGIDO: Payload dinâmico
    const payload = isLogin 
      ? { email, password }
      : { nome, email, password }; 

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (resp.ok) {
        // Sucesso: armazena token e username (que agora é o nome na resposta do backend)
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authUsername", data.username);
        setAuth({ token: data.token, username: data.username, isAuthenticated: true });
      } else {
        // Erro: exibe a mensagem de erro do backend
        setError(data.erro || "Erro na autenticação. Tente novamente.");
      }
    } catch (err) {
      setError("Não foi possível conectar ao servidor de autenticação.");
      console.error("Auth Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <h2 className="auth-title">{title}</h2>
      <form onSubmit={handleAuthSubmit} className="auth-form-body">
        
        {/* Campo de Nome (Apenas para Registro) */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Seu Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="auth-input"
            required={!isLogin}
          />
        )}

        {/* Campo de E-mail (Para Login e Registro) */}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />
        
        {/* Campo de Senha */}
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          required
        />
        <button
          type="submit"
          className="auth-button"
        >
          {isLogin ? "Entrar" : "Registrar"}
        </button>
      </form>
      {error && <p className="auth-error">{error}</p>}
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          // Limpa campos e erro ao alternar
          setNome(""); 
          setEmail("");
          setPassword("");
          setError("");
        }}
        className="auth-switch-button"
      >
        {isLogin ? "Não tem conta? Crie uma!" : "Já tem conta? Faça Login!"}
      </button>
    </div>
  );
};

// =======================================================
// Componente principal da aplicação (App)
// =======================================================
export default function App() {
  const [titulo, setTitulo] = useState("");
  const [filme, setFilme] = useState(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [loadingFilme, setLoadingFilme] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false); 
  const [historico, setHistorico] = useState([]);
  
  // Estados de autenticação
  const [auth, setAuth] = useState({
    token: null,
    username: null,
    isAuthenticated: false,
  });

  // 1. Lógica de Autenticação (Persistência)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("authUsername");
    if (token && username) {
      setAuth({ token, username, isAuthenticated: true });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUsername");
    setAuth({ token: null, username: null, isAuthenticated: false });
    setFilme(null);
    setHistorico([]);
    setModalOpen(false);
  };

  /* ======================== CARROSSEL (Lógica Original) ======================== */
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

  // PRECARREGAR IMAGEM → sem piscar
  useEffect(() => {
    const img = new Image();
    img.src = destaques[indexDestaque];
    img.onload = () => {
      setBgAtual(destaques[indexDestaque]); // só troca quando a imagem carrega
    };
  }, [indexDestaque]);

  // autoplay suave de 4s
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

  /* ======================== BUSCAR FILME (Integrado com JWT) ======================== */
  const buscarFilme = useCallback(async () => {
    // Adicionado o check de autenticação
    if (!titulo || !auth.isAuthenticated) return;
    setLoadingFilme(true);
    setFilme(null);

    try {
      const resp = await fetch(
        `${BACKEND_URL}/filme?titulo=${encodeURIComponent(titulo)}`,
        {
          headers: {
            // Adicionado o token de autorização
            "Authorization": `Bearer ${auth.token}`,
          },
        }
      );
      const data = await resp.json();

      if (!resp.ok) {
         console.error("Erro ao buscar filme:", data.erro || data.message);
         console.error(data.erro || "Falha ao buscar filme. Verifique o token ou se o filme existe.");
         return;
      }

      setFilme(data);

      setModalOpen(true); 

      setHistorico((prev) => {
        if (prev.find((f) => f.id === data.id)) return prev;
        return [data, ...prev];
      });
    } catch (err) {
      console.error("Erro ao buscar filme:", err);
    } finally {
      setLoadingFilme(false);
    }
  }, [titulo, auth]);

  /* ======================== IA (Integrado com JWT) ======================== */
  const perguntarIa = useCallback(async () => {
    // Adicionado o check de autenticação
    if (!filme || !pergunta || !auth.isAuthenticated) return;
    setLoadingIa(true);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Adicionado o token de autorização
          "Authorization": `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ pergunta, filme }),
      });

      const data = await resp.json();
      
      if (!resp.ok) {
         setResposta(data.resposta || data.erro || "Falha na IA. Verifique o token.");
         return;
      }

      setResposta(data.resposta);
    } catch (err) {
      setResposta("Erro ao gerar resposta.");
    } finally {
      setLoadingIa(false);
    }
  }, [filme, pergunta, auth]);

  const fecharModal = () => {
    setModalOpen(false); 
    setPergunta("");
    setResposta("");
  };

  // ----------------------------------------------------
  // Renderização
  // ----------------------------------------------------

  // Se não estiver autenticado, mostra o formulário de login/registro
  if (!auth.isAuthenticated) {
    return (
      <div className="app-container auth-page">
        <AuthForm setAuth={setAuth} setIsLoading={setAuthLoading} />
        {authLoading && <div className="loading-overlay">A autenticar...</div>}
        <StyleBlock />
      </div>
    );
  }

  // Se estiver autenticado, mostra a aplicação principal
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
        <button className="seta-esquerda" onClick={anterior}>❮</button>
        <button className="seta-direita"   onClick={proxima}>❯</button>
        
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
              Busque filmes e converse com a IA sobre eles! (Logado como: {auth.username})
            </p>
            <button 
                onClick={handleLogout} 
                style={{ marginTop: 10, padding: '5px 15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
                Logout
            </button>
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
              <button onClick={buscarFilme} className="buttonBuscar" disabled={loadingFilme}>
                {loadingFilme ? "Buscando..." : "Buscar"}
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
                src={f.poster_path ? `https://image.tmdb.org/t/p/w200${f.poster_path}` : "https://placehold.co/200x300/111827/a1a1aa?text=Sem+Poster"}
                alt={f.title}
                className="filme-card"
                onClick={() => {
                  setFilme(f);
                  setModalOpen(true);
                  setPergunta("");
                  setResposta("");
                }}
                onError={(e) => e.target.src = "https://placehold.co/200x300/111827/a1a1aa?text=Sem+Poster"}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: "#ddd" }}>Nenhum filme no histórico ainda.</p>
        )}
      </div>

      {/* ======================== MODAL ======================== */}
      {modalOpen && filme && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button onClick={fecharModal} className="modal-close">
              X
            </button>

            <img
              src={filme.poster_path ? `https://image.tmdb.org/t/p/w400${filme.poster_path}` : "https://placehold.co/400x600/111827/a1a1aa?text=Sem+Poster"}
              alt="Poster"
              className="modal-poster"
              onError={(e) => e.target.src = "https://placehold.co/400x600/111827/a1a1aa?text=Sem+Poster"}
            />

            <div className="modal-textos">
              <h2 className="modal-title">{filme.title}</h2>
              <p className="modal-text">{filme.overview}
              <br /><br />
              <strong>Ano:</strong> {filme.release_date ? filme.release_date.split("-")[0] : "N/A"}
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <textarea
                  className="inputIA"
                  placeholder="Pergunte algo sobre o filme..."
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  rows={3}
                />
                <button onClick={perguntarIa} className="buttonIA" disabled={loadingIa}>
                  {loadingIa ? "Enviando..." : "Enviar"}
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
      <StyleBlock />
    </div>
  );
}

// =======================================================
// Estilos CSS (Recuperados do código anterior + novos de Auth)
// =======================================================
const StyleBlock = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');

      :root {
          --primary-color: #8b5cf6; /* Violet */
          --primary-hover: #7c3aed; 
          --bg-dark: #111827; /* Dark Gray */
          --bg-card: #1f2937; 
          --text-light: #f3f4f6; 
          --text-muted: #9ca3af; 
          --accent-light: #c4b5fd; 
      }
      
      body, html, #root {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          background-color: var(--bg-dark);
          color: var(--text-light);
          min-height: 100vh;
      }
      
      /* =================== Estilos de Autenticação (Novo) =================== */
      .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
      }
      .auth-page {
          align-items: center;
          justify-content: center;
          padding: 1rem;
      }
      .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000; /* Z-index alto para sobrepor */
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
      }
      .auth-box {
          padding: 1.5rem;
          background-color: rgba(31, 41, 55, 0.9);
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 384px;
          margin: auto;
      }
      .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent-light);
          text-align: center;
          margin-bottom: 1.5rem;
      }
      .auth-form-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
      }
      .auth-input {
          width: 360px;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background-color: #374151;
          border: 1px solid var(--primary-color);
          color: white;
          font-size: 1rem;
          transition: all 0.2s;
      }
      .auth-input::placeholder {
          color: var(--text-muted);
      }
      .auth-button {
          width: 100%;
          padding: 0.75rem;
          background-color: var(--primary-color);
          color: white;
          font-weight: 600;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s;
      }
      .auth-button:hover {
          background-color: var(--primary-hover);
      }
      .auth-error {
          margin-top: 1rem;
          color: #f87171;
          text-align: center;
          font-size: 0.875rem;
      }
      .auth-switch-button {
          margin-top: 1rem;
          width: 100%;
          text-align: center;
          font-size: 0.875rem;
          color: var(--accent-light);
          cursor: pointer;
          transition: color 0.2s;
      }
      .auth-switch-button:hover {
          color: #a78bfa;
      }

      /* =================== Estilos Originais (Mapeados para CSS puro) =================== */
      
      .tela-dividida {
          /* Mantido como estava, mas com background global */
          min-height: 100vh;
      }

      .topo-streaming {
          /* Mantido via style={{}} mas complementado */
          height: 400px; /* Ajuste para visualização em telas menores */
      }
      @media (min-width: 768px) {
        .topo-streaming {
            height: 500px;
        }
      }

      .seta-esquerda, .seta-direita {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3; 
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          padding: 10px;
          cursor: pointer;
          font-size: 1.5rem;
          border-radius: 50%;
          transition: background-color 0.2s;
      }
      .seta-esquerda:hover, .seta-direita:hover {
          background: rgba(0,0,0,0.8);
      }
      .seta-esquerda { left: 10px; }
      .seta-direita { right: 10px; }


      .tituloPrincipal {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
      }
      .tituloSecundario {
          color: var(--accent-light);
          font-size: 1.1rem;
          margin-top: 5px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
      }

      .box-busca {
          background-color: rgba(31, 41, 55, 0.8);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
          width: 90%;
          max-width: 500px;
      }
      .buscarFilmeLabel {
          color: var(--accent-light);
          font-size: 1.2rem;
          margin-bottom: 10px;
          text-align: center;
      }
      .inputPrin {
          flex-grow: 1;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid var(--primary-color);
          background-color: #374151;
          color: white;
      }
      .buttonBuscar {
          padding: 10px 20px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
      }
      .buttonBuscar:hover:not(:disabled) {
          background-color: var(--primary-hover);
      }
      .buttonBuscar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
      }
      .loading-message {
          animation: pulse 1.5s infinite;
      }

      /* =================== Histórico =================== */
      .fundo-roxo {
          padding: 20px;
          background-color: var(--bg-dark); /* Mantido dark para consistência */
      }
      .carrossel-filmes {
          display: flex;
          overflow-x: auto;
          gap: 15px;
          padding: 10px 0;
          -webkit-overflow-scrolling: touch;
      }
      .filme-card {
          width: 120px;
          height: 180px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: transform 0.2s, outline 0.2s;
          flex-shrink: 0;
      }
      .filme-card:hover {
          transform: scale(1.05);
          outline: 3px solid var(--primary-color);
      }


      /* =================== Modal =================== */
      .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
      }
      .modal-box {
          background-color: var(--bg-card);
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          width: 95%;
          max-width: 800px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
      }
      @media (min-width: 600px) {
        .modal-box {
            flex-direction: row;
        }
      }

      .modal-close {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          color: #ddd;
          font-size: 1.5rem;
          cursor: pointer;
      }
      .modal-poster {
          width: 100%;
          height: auto;
          max-width: 200px; 
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
      }
      @media (min-width: 600px) {
        .modal-poster {
            width: 200px;
            height: 300px;
        }
      }
      
      .modal-textos {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
      }
      .modal-title {
          font-size: 2rem;
          color: var(--accent-light);
          margin-bottom: 5px;
      }
      .modal-text {
          color: #ccc;
          margin-bottom: 15px;
          flex-grow: 1;
      }
      
      .inputIA {
          flex-grow: 1;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid var(--primary-color);
          background-color: #374151;
          color: white;
          resize: vertical;
      }
      .buttonIA {
          padding: 10px 20px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
      }
      .buttonIA:hover:not(:disabled) {
          background-color: var(--primary-hover);
      }
      .buttonIA:disabled {
          opacity: 0.5;
          cursor: not-allowed;
      }

      .resposta-box {
          background-color: #374151;
          padding: 10px;
          border-radius: 6px;
      }
      .resposta-titulo {
          color: var(--accent-light);
          font-size: 1rem;
          margin-bottom: 5px;
      }
      .resposta-texto {
          white-space: pre-wrap;
          color: #eee;
      }

      /* Keyframe para animação pulse */
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .5; }
      }
    `}</style>
)