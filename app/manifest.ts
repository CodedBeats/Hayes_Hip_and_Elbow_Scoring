import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Hayes Hip and Elbow Scoring",
        short_name: "Hayes H&E",
        description: "Canine hip & elbow radiograph scoring for veterinary specialists",
        start_url: "/",
        display: "standalone",
        background_color: "#F9F7F3",
        theme_color: "#506147",
        icons: [
            { src: "/logo/png/logo-512.png", sizes: "512x512", type: "image/png" },
            { src: "/logo/png/logo-1024.png", sizes: "1024x1024", type: "image/png" },
        ],
    };
}
