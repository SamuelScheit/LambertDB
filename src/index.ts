import fs from "fs";
import { join } from "path";

const path = join(__dirname, "..", "foo.txt");

const file = fs.openSync(path, "r+");
const buffer = Buffer.alloc(100);
const bytesRead = fs.readSync(file, buffer, 0, 100, 0);

console.log(buffer.toString(), bytesRead);
