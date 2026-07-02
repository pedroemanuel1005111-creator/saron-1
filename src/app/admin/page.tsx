import dynamic from "next/dynamic";

const AdminPanel = dynamic(() => import("@/components/AdminPanel"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-dark)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "4rem" }}>🍔</div>
        <p style={{ color: "#B0B0B0", marginTop: 16 }}>Carregando painel...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <AdminPanel />;
}
