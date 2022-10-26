import fs, { closeSync, fstatSync, openSync } from "fs";

for (let i = 17; i < 32; i++) {
	var fd = openSync(__dirname + "/test.txt", "r+");

	describe("fs - watermark: " + (Math.pow(2, i) / 1024 / 1024).toFixed(1) + "mb", () => {
		const highWaterMark = Math.pow(2, i) - 1;
		const { size } = fstatSync(fd);
		global.gc!();

		test("sync consecutive", () => {
			// fd = openSync(__dirname + "/test.txt", "r+");
			for (let i = 0; i * highWaterMark < size; i++) {
				fs.readSync(fd, Buffer.allocUnsafe(highWaterMark), 0, highWaterMark, i * highWaterMark);
			}
		});

		// test("readStream", async () => {
		// 	fd = openSync(__dirname + "/test.txt", "r+");
		// 	return new Promise((resolve) => {
		// 		const stream = fs.createReadStream("", { fd: fd, highWaterMark, start: 0 });
		// 		stream.on("end", () => {
		// 			resolve(null);
		// 		});
		// 		stream.on("data", (d) => {
		// 			// console.log("data", d);
		// 		});
		// 	});
		// });

		// test("callback parallel", () => {
		// 	fd = openSync(__dirname + "/test.txt", "r+");
		// 	return new Promise((resolve) => {
		// 		let sizeRead = 0;
		// 		for (let i = 0; i * highWaterMark <= size; i++) {
		// 			fs.read(
		// 				fd,
		// 				Buffer.alloc(highWaterMark),
		// 				0,
		// 				highWaterMark,
		// 				i * highWaterMark,
		// 				(err, bytesRead, buffer) => {
		// 					sizeRead += buffer.length;
		// 					// console.log("read", bytesRead, buffer);
		// 					if (sizeRead - 1 >= size) {
		// 						resolve(null);
		// 					}
		// 				}
		// 			);
		// 		}
		// 	});
		// });

		// test("async", () => {
		// 	return fs.promises.readFile(__dirname + "/test.txt");
		// });
	});
}
