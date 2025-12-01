import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleRegistro(e) {
    e.preventDefault();

    const resp = await fetch("https://sitefilme-1.onrender.com/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        email,
        password: senha,   // 🔥 CORREÇÃO IMPORTANTE
      }),
    });

    const data = await resp.json();

    if (resp.ok) {
      navigate("/login");
    } else {
      setMsg(data.erro || "Erro ao registrar.");
    }
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-bg">

      <form className="form-cadastro" onSubmit={handleRegistro}>
        <h1 className="titulo-cadastro">Cadastro</h1>
        <input
          className="nome-cadastro"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <br></br>
        <input
          className="email-cadastro"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br></br>
        <input
          className="senha-cadastro"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <br></br>
        <button type="submit" className="button-cadastro">Cadastrar</button>

        <button
            className="button-cadastro-redirecionar"
            type="button"
            onClick={() => navigate("/login")}
        >
            Já tenho conta
        </button>

        {msg && <p style={{ color: "red" }}>{msg}</p>}
      </form>


      </div>
    </div>
  );
}

console.log("URL do backend:", process.env.REACT_APP_BACKEND_URL);
