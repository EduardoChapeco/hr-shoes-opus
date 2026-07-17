fetch("http://localhost:8081/_serverFn", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    payload: {
      data: { email: "test@example.com", password: "password123" },
      context: {},
    },
    serverFnId: "signInWithPassword",
    serverFnName: "signInWithPassword",
  }),
})
  .then((r) => r.text())
  .then(console.log)
  .catch(console.error);
