import { sleep } from "./async";

export async function insertTextLetterByLetter(
    text: string,
    delay: number = 1 / 60,
): Promise<void> {
    const characters = Array.from(text);

    for (const char of characters) {
        document.execCommand("insertText", false, char);
        await sleep(delay);
    }
}
