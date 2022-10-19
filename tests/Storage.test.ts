import { describe, beforeAll, test } from "@jest/globals";
import { mkdirSync, rmSync, unlinkSync } from "fs";
import { dirname } from "path";
import { TableStorage } from "../src/Storage";
import { Table } from "../src/Table";

const db_path = __dirname + "/../tmp/db";

beforeAll(() => {
	// rmSync(dirname(db_path), { recursive: true, force: true });
	mkdirSync(dirname(db_path), { recursive: true });
});

describe("Storage", () => {
	const table = new Table({ name: "test", path: db_path });

	test("init", () => {
		table.storage.init();
		table.setSchema({
			name: "test",
			columns: [
				{ name: "id", type: "INT" },
				{ name: "name", type: "TEXT", length: 4 },
				{ name: "test", type: "TEXT" },
			],
		});
	});

	test("save row", () => {
		table.storage.saveRow(0, [Buffer.from([1, 2, 3, 4]), Buffer.from("test"), Buffer.from("dynamic text length")]);
	});

	test("read entire row", () => {
		table.storage.loadRow(0);
	});

	test("read row by columns", () => {
		table.storage.loadColumn(0, 0);
		table.storage.loadColumn(0, 1);
		table.storage.loadColumn(0, 2);
	});
});
