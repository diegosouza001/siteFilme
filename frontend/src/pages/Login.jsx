/* import React, { useState } from "react";
import supabase from "../supabaseClient.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      const session = data.session;

      if (!session) {
        setErro("Falha ao gerar sessão.");
        setLoading(false);
        return;
      }

      const resp = await fetch("http://localhost:3001/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
      });

      const json = await resp.json();

      if (!resp.ok) {
        setErro(json.error);
        setLoading(false);
        return;
      }

      localStorage.setItem("server_jwt", json.server_jwt);

      navigate("/filmes");

    } catch (e) {
      setErro("Erro: " + e.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Entrar</h1>

      <form onSubmit={handleLogin} style={{ maxWidth: 300 }}>
        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Entrar"}
        </button>
      </form>

      <button
        onClick={() => navigate("/register")}
        style={{ marginTop: 20 }}
      >
        Criar conta
      </button>
    </div>
  );
} */
