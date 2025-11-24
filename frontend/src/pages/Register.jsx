/* import React, { useState } from "react";
import supabase from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // CRIA CONTA NO SUPABASE
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome }, // salva o nome no perfil do user_metadata
        },
      });

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      const session = data.session;

      if (!session) {
        setErro("Conta criada, mas nenhum token foi gerado.");
        setLoading(false);
        return;
      }

      // GERA JWT DO SEU BACKEND
      const response = await fetch("http://localhost:3001/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: session.access_token }),
      });

      const json = await response.json();

      if (!response.ok) {
        setErro(json.error);
        setLoading(false);
        return;
      }

      // GUARDA O JWT DO SERVIDOR
      localStorage.setItem("server_jwt", json.server_jwt);

      // REDIRECIONA
      navigate("/filmes");

    } catch (e) {
      setErro(e.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Criar conta</h1>

      <form onSubmit={handleRegister} style={{ maxWidth: 300 }}>
        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          type="email"
          placeholder="Seu email"
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
          {loading ? "Criando conta..." : "Registrar"}
        </button>
      </form>

      <button
        style={{ marginTop: 20 }}
        onClick={() => navigate("/")}
      >
        Já tenho conta — Entrar
      </button>
    </div>
  );
} */
