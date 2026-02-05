import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mezgebe sbhat",
    short_name: "mezgebe sbhat",
    description: "Glassy Ethiopian Orthodox audio streaming app",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#7f2d1d",
    icons: [
      {
        src: "/icon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
