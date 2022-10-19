import { describe, beforeAll, test } from "@jest/globals";
import { mkdirSync, rmSync, unlinkSync } from "fs";
import { dirname } from "path";
import { TableStorage } from "../src/Storage";

const db_path = __dirname + "/../tmp/db";

beforeAll(() => {
	rmSync(dirname(db_path), { recursive: true, force: true });
	mkdirSync(dirname(db_path), { recursive: true });
});

describe("Storage", () => {
	const storage = new TableStorage(db_path);

	test("init", () => {
		storage.init();
		storage.setSchema({
			name: "test",
			columns: [
				{ name: "id", type: "INT", length: 4 },
				{ name: "name", type: "TEXT", length: 4 },
				{ name: "test", type: "TEXT" },
			],
		});
	});

	test("save row", () => {
		storage.saveRow(
			0,
			Buffer.concat([
				Buffer.from([1, 2, 3, 4]),
				Buffer.from("test"),
				Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
				Buffer.from([0, 0, 0, 0, 0, 1, 0, 0]),
			])
		);
	});

	test("read entire row", () => {
		storage.loadRow(0);
	});

	test("read row by columns", () => {
		storage.loadColumn(0, 0);
		storage.loadColumn(0, 1);
		storage.loadColumn(0, 2);
	});
});
