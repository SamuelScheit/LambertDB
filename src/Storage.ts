import { appendFileSync, fstatSync, readFileSync, readSync, statSync, writeSync } from "fs";
import { STORAGE_BYTES, STORAGE_LENGTH_BYTES, STORAGE_POSITION_BYTES } from "./Constants";
import { openFile } from "./Filesystem";
import { ColumnType, Table, TableSchema } from "./Table";

/**
 * @class TableStorage
 * @description Loads and stores row/column table data in a file
 */
export class TableStorage {
	public fd!: {
		schema: number;
		table: number;
		storage: number;
	};

	constructor(public table: Table) {}

	init() {
		this.fd = {
			schema: openFile(`${this.table.path}.schema`),
			table: openFile(`${this.table.path}.table`),
			storage: openFile(`${this.table.path}.storage`),
		};
	}

	loadSchema(): TableSchema {
		try {
			return JSON.parse(readFileSync(this.fd.schema, { encoding: "utf8" }));
		} catch (error) {
			return {
				name: "",
				columns: [],
			};
		}
	}

	saveSchema(schema: TableSchema) {
		writeSync(this.fd.schema, JSON.stringify(schema, null, 4), 0, "utf8");
	}

	saveData(index: number, buffer: Buffer) {
		writeSync(this.fd.table, buffer, 0, buffer.length, this.table.row_size * index);
	}

	saveRow(index: number, columns: Buffer[]) {
		const chunks = [];

		for (var i = 0; i < columns.length; i++) {
			const column = columns[i];

			if (this.table.schema.columns[i].length) {
				chunks.push(column.subarray(0, this.table.schema.columns[i].length));
			} else {
				const buffer = Buffer.alloc(STORAGE_BYTES);
				buffer.writeUintBE(this.saveStorage(column), 0, STORAGE_POSITION_BYTES);
				buffer.writeUintBE(column.length, STORAGE_POSITION_BYTES, STORAGE_LENGTH_BYTES);
				chunks.push(buffer);
			}
		}

		const buffer = Buffer.concat(chunks);

		writeSync(this.fd.table, buffer, 0, buffer.length, index * this.table.row_size);
	}

	saveColumn(index: number, column: number, buffer: Buffer) {
		if (this.table.schema.columns[column].length) {
			buffer = buffer.subarray(0, this.table.schema.columns[column].length);
		} else {
			const location = Buffer.alloc(STORAGE_BYTES);
			location.writeUintBE(this.saveStorage(buffer), 0, STORAGE_POSITION_BYTES);
			location.writeUintBE(buffer.length, STORAGE_POSITION_BYTES, STORAGE_LENGTH_BYTES);
			buffer = location;
		}

		writeSync(
			this.fd.table,
			buffer,
			0,
			buffer.length,
			index * this.table.row_size + this.table.getColumnOffset(column)
		);
	}

	loadRow(index: number) {
		const buffer = Buffer.alloc(this.table.row_size);

		readSync(this.fd.table, buffer, {
			position: index * this.table.row_size,
		});

		const columns = [];
		let i = 0;

		for (const column of this.table.schema.columns) {
			if (column.length) {
				columns.push(buffer.subarray(i, column.length));
				i += column.length;
				continue;
			}

			const storage = this.loadStorage(
				buffer.readUintBE(i, STORAGE_POSITION_BYTES),
				buffer.readUintBE(i + STORAGE_POSITION_BYTES, STORAGE_POSITION_BYTES)
			);
			columns.push(storage);
			i += STORAGE_BYTES;
		}

		return buffer;
	}

	loadColumn(index: number, column: number) {
		const buffer = Buffer.alloc(this.table.schema.columns[column].length || STORAGE_BYTES);

		readSync(this.fd.table, buffer, {
			position: index * this.table.row_size + this.table.getColumnOffset(column),
		});

		if (this.table.schema.columns[column].length) return buffer;

		return this.loadStorage(
			buffer.readUintBE(0, STORAGE_POSITION_BYTES),
			buffer.readUintBE(STORAGE_POSITION_BYTES, STORAGE_LENGTH_BYTES)
		);
	}

	loadStorage(position: number, length: number) {
		const buffer = Buffer.alloc(length);

		readSync(this.fd.storage, buffer, {
			position: position,
		});
		return buffer;
	}

	saveStorage(buffer: Buffer) {
		const position = fstatSync(this.fd.storage).size;
		console.log("append file", readFileSync(this.fd.storage, { encoding: "utf8" }));
		appendFileSync(this.fd.storage, buffer);
		console.log("result", readFileSync(this.fd.storage, { encoding: "utf8" }));
		return position;
	}
}

export function parseData(buffer: Buffer, type: ColumnType) {
	switch (type) {
		case "INT":
			return buffer.readIntBE(0, 4);
		case "TEXT":
			return buffer.toString();
		case "BOOL":
			return buffer.readInt8(0) === 1;
		case "DATE":
			return new Date(buffer.toString());
		case "BLOB":
		default:
			return buffer;
	}
}

export function serializeData(data: any, type: ColumnType) {
	switch (type) {
		case "INT":
			return Buffer.alloc(4).writeIntBE(parseInt(data), 0, 4);
		case "TEXT":
			return Buffer.from(data);
		case "BOOL":
			return Buffer.alloc(1).writeInt8(data ? 1 : 0, 0);
		case "DATE":
			return Buffer.from(data.getTime());
		case "BLOB":
		default:
			return Buffer.from(data);
	}
}
