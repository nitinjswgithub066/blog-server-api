import { getOptimizedCloudinaryUrl, type CloudinaryImageVariant } from "../../utils/cloudinaryImageUrl";

export const getOptimizedImageUrl = (url: string, variant: CloudinaryImageVariant) =>
  getOptimizedCloudinaryUrl(url, variant) || url;
