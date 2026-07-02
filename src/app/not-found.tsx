export default function Page() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-dark)" }}>
      <div style={{ background: "var(--bg-card)", padding: 32, borderRadius: 12, textAlign: "center", maxWidth: 500 }}>
        <h1 style={{ color: "var(--secondary)", fontFamily: "Bebas Neue", fontSize: "3rem" }}>404</h1>
        <p style={{ color: "var(--text-gray)", marginBottom: 24 }}>Página não encontrada</p>
        <a href="/" className="btn-primary"><span>VOLTAR AO INÍCIO</span></a>
      </div>
    </div>
  );
}
