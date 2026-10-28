import path from "node:path";
import { verifyBackup } from "./manifest.mjs";
import { BackupError } from "./config.mjs";

const folder = process.argv[2];
if (!folder || process.argv.length !== 3) {
  console.error("Uso: npm run backup:verify -- backups/<pasta>");
  process.exitCode = 1;
} else {
  try {
    const manifest = await verifyBackup(path.resolve(folder));
    console.log(
      `Integridade conferida: ${manifest.summary.products} produtos e ${manifest.summary.photos} fotos\nIsso não substitui o ensaio de restauração`,
    );
  } catch (error) {
    console.error(
      error instanceof BackupError
        ? error.message
        : "Falha ao verificar o backup",
    );
    process.exitCode = 1;
  }
}
