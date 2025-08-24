export const BASE = (import.meta.env && import.meta.env.VITE_API) || "http://localhost:3000";

async function j(r) {
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  users: {
    list: () => fetch(`${BASE}/api/users`).then(j),
    create: (body) =>
      fetch(`${BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(j),
    // optional (needs backend PATCH route)
    update: (id, body) =>
      fetch(`${BASE}/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(j),
  },
  requests: {
    list: () => fetch(`${BASE}/api/requests`).then(j),
    create: (body) =>
      fetch(`${BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(j),
  },
  bridges: {
    list: () => fetch(`${BASE}/api/bridges`).then(j),
  },
  donors: {
    rank: (blood_group, location, limit = 5) =>
      fetch(`${BASE}/api/donors/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blood_group, location, limit }),
      }).then(j),
  },
};
