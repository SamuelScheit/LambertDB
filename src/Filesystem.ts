import { openSync } from "fs";

export function openFile(path: string) {
	try {
		return openSync(path, "r+");
	} catch (error) {
		return openSync(path, "w+");
	}
}
