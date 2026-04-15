 

import fs from "fs/promises";
import path from "path";


/**
 * Deletes files inside folders and then deletes the folders if older than specified days
 * @param {string} basePath - Path to scan for folders
 * @param {number} daysOld - Number of days (folders older than this will be deleted)
 */
async function deleteFoldersAndFiles(basePath, daysOld) {
  try {
    // First check if basePath exists and is a directory
    const baseStats = await fs.stat(basePath);
    if (!baseStats.isDirectory()) {
      console.warn(`Base path is not a directory: ${basePath}`);
      return;
    }

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(`Scanning base path: ${basePath}`);
    console.log(`Deleting files and folders older than ${daysOld} days (before ${cutoffDate.toLocaleString()})\n`);

    // Read all items in the base directory
    const items = await fs.readdir(basePath);

    let foldersDeleted = 0;
    let filesDeleted = 0;
    let foldersSkipped = 0;
    let filesSkipped = 0;

    for (const item of items) {
      const itemPath = path.join(basePath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // Only process directories (old logic)
        if (stats.mtime < cutoffDate) {
          console.log(`\n📁 Processing folder: ${item} (Last modified: ${stats.mtime.toLocaleString()})`);
          // Delete all files inside the folder first
          const deletedFiles = await deleteFilesInFolder(itemPath);
          filesDeleted += deletedFiles;
          // Now delete the empty folder
          await fs.rmdir(itemPath);
          console.log(`✓ Deleted folder: ${item}`);
          foldersDeleted++;
        } else {
          console.log(`⊘ Kept folder: ${item} (Last modified: ${stats.mtime.toLocaleString()})`);
          foldersSkipped++;
        }
      } else {
        // Process files directly in the base folder
        if (stats.mtime < cutoffDate) {
          await fs.unlink(itemPath);
          console.log(`✓ Deleted file: ${item}`);
          filesDeleted++;
        } else {
          filesSkipped++;
        }
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Folders deleted: ${foldersDeleted}`);
    console.log(`Files deleted: ${filesDeleted}`);
    console.log(`Folders kept: ${foldersSkipped}`);
    console.log(`Files kept: ${filesSkipped}`);

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * Recursively deletes all files in a folder and its subfolders
 * @param {string} folderPath - Path to the folder
 * @returns {number} - Count of deleted files
 */
async function deleteFilesInFolder(folderPath) {
  let deletedCount = 0;
  
  try {
    const items = await fs.readdir(folderPath);
    
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively delete files in subfolder
        deletedCount += await deleteFilesInFolder(itemPath);
        // Delete the empty subfolder
        await fs.rmdir(itemPath);
        console.log(`  ✓ Deleted subfolder: ${item}`);
      } else {
        // Delete the file
        await fs.unlink(itemPath);
        console.log(`  ✓ Deleted file: ${item}`);
        deletedCount++;
      }
    }
    
  } catch (error) {
    console.error(`  Error in folder ${folderPath}:`, error.message);
  }
  
  return deletedCount;
}

// Example usage
const basePathSet = new Set([
  path.resolve(
    path.join(
      path.dirname("./"),
      "uploads",
      "chat-audios",
    )
  ),
  path.resolve(
    path.join(
      path.dirname("./"),
      "uploads",
      "chat-documents",
    )
  ),
  path.resolve(
    path.join(
      path.dirname("./"),
      "uploads",
      "chat-images",
    )
  ),
  path.resolve(
    path.join(
      path.dirname("./"),
      "uploads",
      "chat-videos",
    )
  ),


]); // Change to your base folder path


export const runDeleteOldChatMedia = () => {
 

  const daysOld = 90; 

  // Iterate over each base path in the set
  Promise.all(
    Array.from(basePathSet).map(basePath =>
      deleteFoldersAndFiles(basePath, daysOld)
        .then(() => console.log(`\nOperation completed successfully for: ${basePath}`))
        .catch(err => console.error(`Operation failed for ${basePath}:`, err))
    )
  ).then(() => {
    console.log('\nAll operations completed!');
  });

}
runDeleteOldChatMedia();
 