<script module lang="ts">
    import { sleep } from "./utils/async";

    interface TextToTranslateBase {
        /**
         * The actual text to be translated, stripped of potential HTML inside
         * of it.
         */
        text: string;

        /**
         * The element on which we should send the keyboard events
         */
        element: Element;
    }

    /**
     * WHen the text is not selected, there is no range associated
     */
    interface TextToTranslateNotSelected extends TextToTranslateBase {
        /**
         * Indicates if the text to translate is currently covered by a focused
         * selection range (meaning that if you type the keyboard it will
         * delete said selection)
         */
        isSelected: false;
    }

    /**
     * If the text is selected (or has to be selected) then there is a range
     * guaranteed
     */
    interface TextToTranslateSelected extends TextToTranslateBase {
        isSelected: true;

        /**
         * The range to select when applying the selection
         */
        rangeToSelect: Range;
    }

    type TextToTranslate = TextToTranslateNotSelected | TextToTranslateSelected;

    /**
     * Detects the current selection, caret position, etc of the user to guess
     * what text is the one we need to translate currently.
     */
    function getTextToTranslate(): TextToTranslate | undefined {
        let selection = window.getSelection();
        const active = document.activeElement;
        const editable = ["INPUT", "TEXTAREA"].includes(active?.tagName ?? "");
        const contentEditable =
            active instanceof HTMLElement ? active.isContentEditable : false;

        if (editable) {
            return {
                isSelected: false,
                text: (active as HTMLInputElement | HTMLTextAreaElement).value,
                element: active!,
            };
        } else if (contentEditable) {
            const rangeToSelect =
                selection?.type !== "Range"
                    ? selectTextToTranslate(selection, active!)
                    : selection.getRangeAt(0);

            return {
                isSelected: true,
                text: rangeToSelect.toString(),
                element: active!,
                rangeToSelect,
            };
        }
    }

    /**
     * Applies the selection to the element based on the TextToTranslate info
     */
    async function applySelection(ttt: TextToTranslate) {
        console.log("Applying selection");

        if (ttt.element instanceof HTMLElement) {
            ttt.element.focus();
        }

        if (ttt.isSelected) {
            const selection = window.getSelection();

            if (!selection) {
                throw new Error("Could not get our hands on selection");
            }

            selection.removeAllRanges();
            selection.addRange(ttt.rangeToSelect);

            await sleep(0.1);
        } else {
            document.execCommand("selectAll", false, "");
        }
    }

    /**
     * If there is no current range selection, we try to find a paragraph or
     * at least some block element that contains the caret.
     */
    function findParentBlockElement(selection: Selection, active: Element) {
        if (!active.contains(selection.focusNode ?? null)) {
            return null;
        }

        let node = selection.focusNode;

        while (node && node !== active) {
            if (
                node instanceof HTMLElement &&
                [
                    "P",
                    "DIV",
                    "BLOCKQUOTE",
                    "LI",
                    "H1",
                    "H2",
                    "H3",
                    "H4",
                    "H5",
                    "H6",
                ].includes(node.tagName)
            ) {
                return node;
            }

            node = node.parentNode;
        }

        return null;
    }

    /**
     * This will run a heuristic to find and select proper text to be
     * translated within contenteditable stuff.
     */
    function selectTextToTranslate(
        selection: Selection | null,
        active: Element,
    ) {
        const range = document.createRange();

        const nodeToSelect = (function () {
            if (selection && selection.focusNode) {
                const candidate = findParentBlockElement(selection, active);

                if (candidate) {
                    return candidate;
                }
            }

            return active;
        })();

        console.log("Node to select: ", nodeToSelect);
        range.selectNodeContents(nodeToSelect);

        return range;
    }
</script>

<script lang="ts">
    import type {
        LanguageDetectorInstance,
        TranslatorInstance,
    } from "../chrome-ai";
    import LoadingIndicator from "./components/LoadingIndicator.svelte";
    import { makeChromeStorage } from "./utils/storage.svelte.js";
    import LanguageDialog from "./components/LanguageDialog.svelte";

    const {
        targetLanguage,
    }: {
        targetLanguage: Awaited<ReturnType<typeof makeChromeStorage<string>>>;
    } = $props();

    let portalRoot = $state<HTMLElement | undefined>(undefined);
    let languageDialog = $state<null | ReturnType<typeof LanguageDialog>>();

    /**
     * Either null when not loading or a number from 0 to 1 if loading has been
     * initiated.
     */
    let languageDetectorLoad = $state<null | number>(null);
    let languageDetector = $state<LanguageDetectorInstance | null>(null);

    async function getLanguageDetector() {
        try {
            if (!languageDetector) {
                languageDetectorLoad = 0;

                languageDetector = await LanguageDetector.create({
                    monitor(m) {
                        m.addEventListener("downloadprogress", (e) => {
                            languageDetectorLoad = e.loaded;
                        });
                    },
                });
            }

            return languageDetector;
        } finally {
            languageDetectorLoad = 1;
        }
    }

    let translatorLoad = $state<null | number>(null);
    let translator = $state<TranslatorInstance | null>(null);
    let translatorLangPair = $state<string>("");
    let translatorFirstByte = $state<number>(0);

    async function getTranslator(source: string, target: string) {
        try {
            const pair = `${source}:${target}`;

            if (pair !== translatorLangPair) {
                if (translator) {
                    translator.destroy();
                    translator = null;
                    translatorFirstByte = 0;
                }

                translator = await Translator.create({
                    sourceLanguage: source,
                    targetLanguage: target,
                    monitor(m) {
                        m.addEventListener("downloadprogress", (e) => {
                            translatorLoad = e.loaded;
                        });
                    },
                });
                translatorLangPair = pair;
            }

            return translator!;
        } finally {
            translatorLoad = 1;
        }
    }

    /**
     * Action function that we expose to the caller in order to trigger the
     * translation procedure.
     */
    export async function doTranslation() {
        try {
            const ttt = getTextToTranslate();

            if (!ttt?.text) {
                return;
            }

            if (import.meta.env.MODE === "development") {
                console.log(`[babelbird] Going to translate: `, ttt);
            }

            targetLanguage.current = await languageDialog!.askForLanguage(
                targetLanguage.current,
            );

            if (import.meta.env.MODE === "development") {
                console.log(
                    `[babelbird] Translating to ${targetLanguage.current}`,
                );
            }

            translatorFirstByte = 0;

            const ld = await getLanguageDetector();
            const source = (await ld.detect(ttt.text))[0].detectedLanguage;
            const t = await getTranslator(source, targetLanguage.current);

            const stream = t.translateStreaming(ttt.text);
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (import.meta.env.MODE === "development") {
                        console.log(`[babelbird] Translation done!`);
                    }
                    break;
                }

                // The issue with the current API is that it has a stupid
                // artificial random delay of 2~3s in order to prevent from
                // fingerprinting the model but as a result there is no
                // official way to know when the model is _actually_ loaded, so
                // instead we wait for the first byte to pop up.
                if (!translatorFirstByte) {
                    translatorFirstByte = 1;
                    await applySelection(ttt);
                }

                document.execCommand("insertText", false, value);

                if (import.meta.env.MODE === "development") {
                    console.log(`[babelbird] Inserted: ${value}`);
                }
            }
        } finally {
            translatorFirstByte = 1;
        }
    }

    let loadProgress = $derived.by(() => {
        if (languageDetectorLoad === null && translatorLoad === null) {
            return null;
        }

        return (
            ((languageDetectorLoad ?? 0) +
                (translatorLoad ?? 0) +
                translatorFirstByte) /
            3
        );
    });

    if (import.meta.env.MODE === "development") {
        $effect(() => {
            console.log("[babelbird] ", {
                loadProgress,
                languageDetectorLoad,
                translatorLoad,
                translatorFirstByte,
            });
        });
    }
</script>

<LoadingIndicator progress={loadProgress} />
<LanguageDialog bind:this={languageDialog} {portalRoot} />

<div class="portal-root" bind:this={portalRoot}></div>

<style lang="scss">
    @forward "./styles/dialog.scss";
    @forward "./styles/select.scss";

    :global {
        :host {
            /* Colors */
            --color-bg-overlay: rgba(255, 255, 255, 0.95);
            --color-border: rgba(0, 0, 0, 0.1);
            --color-text-primary: #333;
            --color-text-secondary: #666;
            --color-surface-muted: rgba(0, 0, 0, 0.08);
            --color-accent-from: #4f46e5;
            --color-accent-to: #6366f1;

            /* Spacing scale */
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 12px;
            --space-lg: 16px;
            --space-xl: 20px;

            /* Radius scale */
            --radius-sm: 2px;
            --radius-md: 8px;

            /* Typography */
            --font-sans:
                -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                sans-serif;
            --font-mono:
                ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace;
            --text-sm: 13px;
            --font-weight-medium: 500;
            --font-weight-semibold: 600;

            /* Effects */
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
            --backdrop-blur: blur(10px);
        }

        @media (prefers-color-scheme: dark) {
            :host {
                --color-bg-overlay: rgba(30, 30, 30, 0.95);
                --color-border: rgba(255, 255, 255, 0.1);
                --color-text-primary: #e5e5e5;
                --color-text-secondary: #a3a3a3;
                --color-surface-muted: rgba(255, 255, 255, 0.1);
            }
        }
    }

    .portal-root {
        position: absolute;
    }
</style>
