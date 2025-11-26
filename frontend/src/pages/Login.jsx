import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");

  function onClick() {

  }


  async function handleLogin(e) {
    e.preventDefault();

    const resp = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: senha, // 🔥 CORREÇÃO IMPORTANTE
      }),
    });

    const data = await resp.json();

    if (resp.ok) {
      login(data.token);      // salva o token no contexto
      navigate("/home");      // redireciona
    } else {
      setMsg(data.erro || "E-mail ou senha inválidos");
    }
  }

  return (
    <div className="login-page">
      <h1 className="titulo-login">Login</h1>

      <form onSubmit={handleLogin}>
        <input
          className="email-login"
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br></br>
        <input
          className="password-login"
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <br></br>
        <button 
          className="button-login" 
          type="button-login"
        >

            Entrar
        </button>

        <button
          className="button-redirecionar"
          type="button"
          onClick={() => navigate("/cadastro")}
        >

          Criar conta
        </button>

        {msg && <p style={{ color: "red" }}>{msg}</p>}
      </form>
    </div>
  );
}
