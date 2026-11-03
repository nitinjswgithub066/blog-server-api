export type CloudinaryImageVariant =
  | "cover"
  | "card"
  | "thumbnail"
  | "inline"
  | "avatar"
  | "og";

const CLOUDINARY_TRANSFORMS: Record<CloudinaryImageVariant, string> = {
  cover: "w_1200,h_675,c_fill,g_auto,f_auto,q_auto",
  card: "w_600,h_338,c_fill,g_auto,f_auto,q_auto",
  thumbnail: "w_320,h_180,c_fill,g_auto,f_auto,q_auto",
  inline: "w_900,c_limit,f_auto,q_auto",
  avatar: "w_300,h_300,c_fill,g_auto,f_auto,q_auto",
  og: "w_1200,h_630,c_fill,g_auto,f_auto,q_auto",
};

const TRANSFORM_SEGMENT_PATTERN = /(^|,)(w_|h_|c_|g_|f_|q_)/;

export const getOptimizedCloudinaryUrl = (
  url: string | null | undefined,
  variant: CloudinaryImageVariant
) => {
  if (!url) {
    return null;
  }

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const transform = CLOUDINARY_TRANSFORMS[variant];
  const [prefix, uploadRest] = url.split("/upload/");

  if (!prefix || !uploadRest) {
    return url;
  }

  const segments = uploadRest.split("/");
  const firstSegment = segments[0];
  const hasExistingTransform = firstSegment ? TRANSFORM_SEGMENT_PATTERN.test(firstSegment) : false;
  const assetPath = hasExistingTransform ? segments.slice(1).join("/") : uploadRest;

  return `${prefix}/upload/${transform}/${assetPath}`;
};
