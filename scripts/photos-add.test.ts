import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { processPhoto } from "./photos-add";

test("processPhoto shrinks to 2400px and strips GPS/EXIF", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "np-"));
  const input = path.join(dir, "in.jpg");
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#f26b38" } })
    .withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "37/1 18/1 0/1" } })
    .jpeg()
    .toFile(input);
  expect((await exifr.parse(input))?.Make).toBe("TestCam");
  const out = path.join(dir, "out.jpg");
  await processPhoto(input, out);
  const meta = await sharp(out).metadata();
  expect(Math.max(meta.width!, meta.height!)).toBe(2400);
  expect(await exifr.parse(out)).toBeUndefined();
});
