// const { exec } = require("child_process");
// const path = require("path");

// const inputPath = "../uploads/videos/laboratory.mp4"; // Replace with your video file path
// const outputPath = "../uploads/image/thumbnail/laboratory.png"; // Replace with your desired thumbnail path

// // Extract thumbnail at 5 seconds (change `-ss 00:00:05`)
// const command = `ffmpeg -ss 00:00:05 -i "${inputPath}" -frames:v 1 -q:v 2 "${outputPath}"`;

// exec(command, (err, stdout, stderr) => {
//   if (err) {
//     console.error("Thumbnail generation failed:", err.message);
//     return;
//   }
//   console.log("Thumbnail saved at:", outputPath);
// });

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Directories
const videoDir = path.join(__dirname, "../uploads/videos");
const thumbnailDir = path.join(__dirname, "../uploads/image/thumbnail");

// Ensure thumbnail output directory exists
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Read video files
fs.readdir(videoDir, (err, files) => {
  if (err) {
    console.error("Failed to read video directory:", err.message);
    return;
  }

  // Process each video file
  files
    .filter((file) => file.toLowerCase().endsWith(".mp4"))
    .forEach((originalFile) => {
      const originalPath = path.join(videoDir, originalFile);

      // Replace spaces with underscores in file name
      const safeFileName = originalFile.replace(/\s+/g, "_");
      const safePath = path.join(videoDir, safeFileName);

      // Rename if needed
      if (originalFile !== safeFileName) {
        fs.renameSync(originalPath, safePath);
        console.log(`Renamed: "${originalFile}" -> "${safeFileName}"`);
      }

      const fileNameWithoutExt = path.parse(safeFileName).name;
      const thumbnailPath = path.join(
        thumbnailDir,
        `${fileNameWithoutExt}.png`
      );

      // Generate thumbnail
      const command = `ffmpeg -ss 00:00:05 -i "${safePath}" -frames:v 1 -q:v 2 "${thumbnailPath}"`;

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error(
            `❌ Failed to create thumbnail for ${safeFileName}:`,
            err.message
          );
          return;
        }
        console.log(
          `✅ Thumbnail created for ${safeFileName}: ${thumbnailPath}`
        );
      });
    });
});
