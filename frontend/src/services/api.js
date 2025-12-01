import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "https://sitefilme-1.onrender.com",
});
console.log("BACKEND URL:", process.env.REACT_APP_BACKEND_URL);

export default api;




