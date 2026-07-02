import dynamic from "next/dynamic";

const CheckoutWrapper = dynamic(() => import("./CheckoutWrapper"), { ssr: false });

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)" }}>
      <CheckoutWrapper />
    </div>
  );
}
