import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const excluded = new Set(['vendor', 'node_modules', 'public', 'storage', '.git', 'cache']);
const extensions = new Set(['.php', '.ts', '.tsx', '.js', '.mjs', '.css']);
let failed = false;

function check(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (excluded.has(entry.name)) continue;
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            check(path);
        } else if (extensions.has(extname(path))) {
            const source = readFileSync(path, 'utf8');
            const lines = source.trimEnd().split(/\r?\n/).length;
            if (lines > 400) {
                console.error(`${relative(root, path)}: ${lines} lines; ${lines > 500 ? 'hard ceiling 500 exceeded' : 'refactor required above 400'}`);
                failed = true;
            }
            if (source.includes('@' + 'dashboard')) {
                console.error(`${relative(root, path)}: obsolete dashboard alias`);
                failed = true;
            }
        }
    }
}

check(root);
process.exitCode = failed ? 1 : 0;
if (!failed) {
    console.log('Source size and alias checks passed (target 300, refactor above 400, ceiling 500).');
}
