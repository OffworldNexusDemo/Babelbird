type StorageAreaName = "local" | "sync" | "session" | "managed";

const storage = globalThis.chrome?.storage;

/**
 * Initializes a reactive store for the chrome storage. The issue with this
 * stupid API is that it's async, meaning that you can't get the current value
 * synchronously. Which isn't supported by Svelte. So this function here does
 * the async init and then the ChromeStorage takes over.
 *
 * @param key Key to use to store said value
 * @param defaultValue Default value to use if the value doesn't exist
 * @param storageArea Which area of the storage to use
 */
export async function makeChromeStorage<T = any>(
    key: string,
    defaultValue: T | undefined,
    storageArea: StorageAreaName = "sync",
) {
    if (!storage) {
        throw new Error("Storage API not available");
    }

    const { [key]: storedValue } = await storage[storageArea].get([key]);
    const initialValue = storedValue === undefined ? defaultValue : storedValue;

    return new ChromeStorage(key, initialValue, storageArea);
}

/**
 * Reactive wrapper around the Chrome storage mechanism for extensions
 */
class ChromeStorage<T = any> {
    #key: string;
    #storageArea: chrome.storage.StorageArea;
    #state = $state<{ current: T | undefined }>({ current: undefined });

    constructor(key: string, initialValue: T, storageArea: StorageAreaName) {
        this.#key = key;
        this.#storageArea = storage[storageArea];
        this.#state.current = initialValue;

        storage.onChanged.addListener(
            (
                changes: { [key: string]: chrome.storage.StorageChange },
                area: string,
            ) => {
                if (area === storageArea && Object.hasOwn(changes, key)) {
                    this.#state.current = changes[key].newValue as T;
                }
            },
        );
    }

    get current(): T | undefined {
        return this.#state.current;
    }

    set current(value: T | undefined) {
        this.#state.current = value;
        this.#storageArea.set({ [this.#key]: value }).then();
    }
}
