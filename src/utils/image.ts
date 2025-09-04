import { file } from "bun";
import { randomInt } from "node:crypto";
import sharp from "sharp";

type ImageFormat = {
  format: string;
  rotation: number;
  size: readonly [number, number];
  flip: readonly [boolean, boolean];
};

export const processImage = async (path: string, format: ImageFormat) => {
  try {
    if (!file(path).exists()) {
      console.error("[process-image] File does not exist:", path);
      return null;
    }
    const temp = `rotated_image_${randomInt(9999, 999999)}.${format.format}`;
    await sharp(path)
      .resize(format.size[0], format.size[1])
      .rotate(format.rotation)
      .flip(format.flip[0])
      .flop(format.flip[1])
      .jpeg()
      .toFile(temp);

    return {
      path: temp,
      cleanup: () => file(temp).delete(),
    };
  } catch (error) {
    console.error("[process-image] Error:", error);
    return null;
  }
};
