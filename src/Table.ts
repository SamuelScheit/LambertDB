import { STORAGE_BYTES } from "./Constants";
import { parseData, TableStorage } from "./Storage";

const DatatypeBytes = {
	BOOL: 1,
	DATE: 6,
	INT: 4,
} as Record<ColumnType, number>;

export class Table {
	public storage: TableStorage;
	public schema!: TableSchema;
	public row_size!: number;
	public path: string;
	public columns: Record<string, ColumnInfo> = {};

	constructor(public options: { path: string; name: string }) {
		this.storage = new TableStorage(this);
		this.path = options.path;
	}

	init() {
		this.storage.init();
		this.setSchema(this.storage.loadSchema());
		this.schema.name = this.options.name;
	}

	setSchema(schema: TableSchema) {
		this.schema = schema;
		this.row_size = this.getColumnOffset(this.schema.columns.length);
		this.schema.columns.forEach((column, index) => {
			this.columns[column.name] = column;
			column.index = index;
			column.length = DatatypeBytes[column.type] || column.length;
		});
		this.storage.saveSchema(schema);
	}

	getColumnOffset(columns: number) {
		return this.schema.columns.slice(0, columns).reduce((a, b) => a + (b.length || STORAGE_BYTES), 0);
	}

	getColumn(row: number, column: string) {
		const buffer = this.storage.loadColumn(row, this.columns[column].index!);

		return parseData(buffer, this.columns[column].type);
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
	index?: number;
}

export type ColumnType = "TEXT" | "INT" | "BOOL" | "DATE" | "BLOB";
