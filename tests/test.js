// require("fs").writeFileSync(__dirname + "/test.txt", Buffer.alloc(0));
require("fs").appendFileSync(__dirname + "/test.txt", Buffer.allocUnsafe(1024 * 1024 * 1024));
