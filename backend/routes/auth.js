import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Cadastro
router.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ msg: "Preencha todos os campos" });

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, hashedSenha]
    );
    const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: "30" });
    res.json({ usuario: result.rows[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ msg: "Preencha todos os campos" });

  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Usuário não encontrado" });

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) return res.status(401).json({ msg: "Senha incorreta" });

    const token = jwt.sign({ id: usuario.id, email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erro no servidor" });
  }
});

export default router;
