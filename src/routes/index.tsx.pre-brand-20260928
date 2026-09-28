import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { DEFAULT_BRAND_IMAGE_URL } from "@/lib/config.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login do Cliente" },
      {
        name: "description",
        content: "Acesse sua conta de cliente.",
      },
      { property: "og:title", content: "Login do Cliente" },
      {
        property: "og:description",
        content: "Entre com suas credenciais de cliente para acessar canais, filmes e séries.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: DEFAULT_BRAND_IMAGE_URL },
      { property: "og:image:secure_url", content: DEFAULT_BRAND_IMAGE_URL },
      { property: "og:image:alt", content: "Aplicativo IPTV" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_BRAND_IMAGE_URL },
      { name: "twitter:image:alt", content: "Aplicativo IPTV" },
    ],
  }),
  component: PublicLoginPage,
});

function PublicLoginPage() {
  const search = Route.useSearch() as {
    username?: string;
    password?: string;
    auto?: string;
  };

  return (
    <LoginScreen
      mode="public"
      initialUsername={typeof search.username === "string" ? search.username : ""}
      initialPassword={typeof search.password === "string" ? search.password : ""}
      autoLogin={Boolean(search.auto || (search.username && search.password))}
    />
  );
}
