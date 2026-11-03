import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

let configured = false;

export const configureCloudinary = () => {
  if (configured) {
    return true;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
  return true;
};

export const destroyCloudinaryAsset = async (
  publicId: string,
  resourceType: string | null | undefined = "image"
) => {
  if (!configureCloudinary()) {
    return { skipped: true, reason: "Cloudinary credentials are not configured." };
  }

  return cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: resourceType || "image",
  });
};

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    resourceType?: "image" | "raw" | "auto";
    originalFilename?: string;
  }
): Promise<CloudinaryUploadResult> => {
  if (!configureCloudinary()) {
    return Promise.reject(new Error("Cloudinary credentials are not configured."));
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
        folder: options.folder,
        resource_type: options.resourceType || "auto",
        use_filename: Boolean(options.originalFilename),
        unique_filename: true,
      };
    if (options.originalFilename) {
      uploadOptions.filename_override = options.originalFilename;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};
