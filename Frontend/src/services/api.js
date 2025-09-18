import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:5000/api
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // set true only if using cookies/sessions
});

// Optional: attach token if you add auth later
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
