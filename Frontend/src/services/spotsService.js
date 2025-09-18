import API from "./api";

export const spotsService = {
  list: () => API.get("/admin/spots").then((r) => r.data),
  create: (data) => API.post("/admin/spots", data).then((r) => r.data),
  update: (id, data) => API.put(`/admin/spots/${id}`, data).then((r) => r.data),
  remove: (id) => API.delete(`/admin/spots/${id}`).then((r) => r.data),
};
