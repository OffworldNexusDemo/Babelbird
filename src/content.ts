import { mount } from "svelte";
import Babelbird from "./Babelbird.svelte";
import { makeChromeStorage } from "./storage.svelte";

let app: ReturnType<typeof Babelbird> | undefined;

/**
 * Idempotent loader for our app. Needless to say that we want to avoid bloating
 * the user's DOM in every single app when they might not need us. Instead, on
 * the first action that we receive we'll load the required component into the
 * DOM, but not before.
 */
async function loadTranslator() {
    if (app) {
        return;
    }

    if (!("Translator" in self) || !("LanguageDetector" in self)) {
        if (import.meta.env.MODE === "development") {
            console.error(
                "[babelbird] Translator and/or LanguageDetector not available",
            );
        }

        return;
    }

    const targetLanguage = await makeChromeStorage<string>(
        "babelbird_target_lang",
        "en",
    );

    const container = document.createElement("div");
    container.id = "_babelbird";
    document.body.appendChild(container);

    const target = document.createElement("div");
    const shadowRoot = container.attachShadow({ mode: "closed" });
    shadowRoot.appendChild(target);

    app = mount(Babelbird, {
        target: target,
        props: {
            targetLanguage,
        },
    });
}

/**
 * We're listening to the actions from the browser
 */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (import.meta.env.MODE === "development") {
        console.log(`[babelbird] Received action: ${message.action}`);
    }

    if (message.action === "translate-input") {
        await loadTranslator();
        app!.doTranslation();
    }
});

if (import.meta.env.MODE === "development") {
    console.log("[babelbird] Loaded!");
}
