import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { DEFAULT_BRAND_IMAGE_URL } from "@/lib/config.functions";

export const Route = createFileRoute("/dono")({
  head: () => ({
    meta: [
      { title: "Acesso do Dono | WebPlayer IPTV" },
      {
        name: "description",
        content: "Entrada administrativa exclusiva do dono do sistema.",
      },
      { property: "og:title", content: "Acesso do Dono | WebPlayer IPTV" },
      {
        property: "og:description",
        content: "Tela administrativa separada da entrada pública de clientes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: DEFAULT_BRAND_IMAGE_URL },
      { property: "og:image:secure_url", content: DEFAULT_BRAND_IMAGE_URL },
      { property: "og:image:alt", content: "WebPlayer IPTV" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_BRAND_IMAGE_URL },
      { name: "twitter:image:alt", content: "WebPlayer IPTV" },
    ],
  }),
  component: OwnerLoginPage,
});

function OwnerLoginPage() {
  return <LoginScreen mode="owner" initialUsername="magodono" />;
}
