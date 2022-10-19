import { openSync, readFileSync, readSync, writeFileSync, writeSync } from "fs";
import { basename } from "path";
import { STORAGE_BYTES, STORAGE_LENGTH_BYTES, STORAGE_POSITION_BYTES } from "./Constants";
import { openFile } from "./Filesystem";

/**
 * in memory table store persisted to disk
 */
export class TableStorage {
	public fd!: {
		schema: number;
		table: number;
		storage: number;
	};
	public row_size!: number;
	public schema!: TableSchema;

	constructor(public path: string) {}

	init() {
		this.fd = {
			schema: openFile(`${this.path}.schema`),
			table: openFile(`${this.path}.table`),
			storage: openFile(`${this.path}.storage`),
		};

		this.loadSchema();
	}

	setSchema(schema: TableSchema) {
		this.schema = schema;
		this.processSchema();
	}

	loadSchema() {
		if (this.schema) return;

		try {
			this.schema = JSON.parse(readFileSync(this.fd.schema, { encoding: "utf8" }));
		} catch (error) {
			this.schema = {
				name: basename(this.path),
				columns: [],
			};
		}

		this.processSchema();
	}

	processSchema() {
		this.row_size = this.schema.columns.reduce((a, b) => a + (b.length || STORAGE_BYTES), 0);

		this.saveSchema();
	}

	saveSchema() {
		writeSync(this.fd.schema, JSON.stringify(this.schema), 0, "utf8");
	}

	saveRow(index: number, buffer: Buffer) {
		writeSync(this.fd.table, buffer, 0, buffer.length, this.row_size * index);
	}

	loadRow(index: number) {
		const buffer = Buffer.alloc(this.row_size);

		readSync(this.fd.table, buffer, {
			position: index * this.row_size,
		});

		const columns = [];
		let i = 0;

		for (const column of this.schema.columns) {
			if (column.length) {
				columns.push(buffer.subarray(i, column.length));
				i += column.length;
				continue;
			}

			const pointer = buffer.readUintLE(i, STORAGE_POSITION_BYTES);
			const length = buffer.readUintLE(i + STORAGE_POSITION_BYTES, STORAGE_LENGTH_BYTES);
			i += STORAGE_BYTES;

			const storage = this.loadStorage(pointer, length);
			columns.push(storage);
		}

		return buffer;
	}

	loadColumn(index: number, column: number) {
		const buffer = Buffer.alloc(this.schema.columns[column].length || STORAGE_BYTES);

		readSync(this.fd.table, buffer, {
			position: index * this.row_size,
		});

		if (this.schema.columns[column].length) return buffer;

		const pointer = buffer.readUintLE(0, STORAGE_POSITION_BYTES);
		const length = buffer.readUintLE(STORAGE_POSITION_BYTES, STORAGE_LENGTH_BYTES);

		return this.loadStorage(pointer, length);
	}

	loadStorage(position: number, length: number) {
		const buffer = Buffer.alloc(length);

		readSync(this.fd.storage, buffer, {
			position: position,
		});
		return buffer;
	}
}

export interface TableSchema {
	name: string;
	columns: ColumnInfo[];
	last_row?: number;
}

export interface ColumnInfo {
	name: string;
	type: ColumnType;
	length?: number; // in bytes, undefined if the column length is dynamic
	primary_key?: boolean;
	auto_increment?: boolean;
}

export type ColumnType = "TEXT" | "INT" | "BOOL" | "DATE";
