import ffmpeg from 'fluent-ffmpeg';
import "../config/environment.js";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);


// Function to convert .mov to .mp4
const convertMovToMp4 = ({ inputFile,   onStatus } = {}) => {
  if (!inputFile) {
    return Promise.reject(new Error('inputFile is required'));
  }

  const finalOutputFile =  inputFile.replace(/\.mov$/i, '.mp4');

  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-movflags +faststart'
      ])
      .toFormat('mp4')
      .on('start', (commandLine) => {
        const status = {
          status: 'start',
          commandLine,
          inputFile,
          outputFile: finalOutputFile
        };

        //console.log('FFmpeg started:', commandLine);
        onStatus?.(status);
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        const status = {
          status: 'progress',
          percent,
          inputFile,
          outputFile: finalOutputFile
        };

        //console.log(`Progress: ${percent}%`);
        onStatus?.(status);
      })
      .on('end', () => {
        const status = {
          status: 'end',
          inputFile,
          outputFile: finalOutputFile
        };

        //console.log('Conversion completed!');
        onStatus?.(status);
        resolve(status);
      })
      .on('error', (error) => {
        const status = {
          status: 'error',
          message: error.message,
          inputFile,
          outputFile: finalOutputFile
        };

        //console.error('Error:', error.message);
        onStatus?.(status);
        reject(error);
      })
      .save(finalOutputFile);
  });
};
// await convertMovToMp4({
//   inputFile: './uploads/chat-videos/580211f1-2e6c-42bf-82e2-f9c8560c1bcf.mov',
//   onStatus: (status) => {
//     console.log(status);
//   }
// });

export default convertMovToMp4;