import api from "./api";

export async function validarToken() {
  const token = localStorage.getItem("token");

  if (!token) return false;

  try {
    const res = await api.get("/auth/validar", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data.valido === true;
  } catch {
    return false;
  }
}
