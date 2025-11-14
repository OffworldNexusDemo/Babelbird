<script module lang="ts">
    interface TextToTranslate {
        /**
         * Indicates if the text to translate is currently covered by a focused
         * selection range (meaning that if you type the keyboard it will
         * delete said selection)
         */
        isSelected: boolean;

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
                element: active,
            };
        } else if (contentEditable) {
            const selectionIsRange = selection?.type === "Range";

            if (!selectionIsRange) {
                const range = selectTextToTranslate(selection, active!);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }

            return {
                isSelected: true,
                text: selection?.toString() ?? "",
                element: active,
            };
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

        range.selectNodeContents(nodeToSelect);

        return range;
    }
</script>

<script lang="ts">
    import type {
        LanguageDetectorInstance,
        TranslatorInstance,
    } from "../chrome-ai";

    /**
     * Either null when not loading or a number from 0 to 1 if loading has been
     * initiated.
     */
    let languageDetectorLoad = $state<null | number>(null);
    let languageDetector = $state<LanguageDetectorInstance | null>(null);

    async function getLanguageDetector() {
        if (!languageDetector) {
            languageDetector = await LanguageDetector.create({
                monitor(m) {
                    m.addEventListener("downloadprogress", (e) => {
                        languageDetectorLoad = e.loaded;
                    });
                },
            });
        }

        return languageDetector;
    }

    let translatorLoad = $state<null | number>(null);
    let translator = $state<TranslatorInstance | null>(null);
    let translatorLangPair = $state<string>("");

    async function getTranslator(source: string, target: string) {
        const pair = `${source}:${target}`;

        if (pair !== translatorLangPair) {
            if (translator) {
                await translator.destroy();
                translator = null;
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
    }

    /**
     * Action function that we expose to the caller in order to trigger the
     * translation procedure.
     */
    export async function doTranslation() {
        const ttt = getTextToTranslate();

        if (!ttt) {
            return;
        }

        if (import.meta.env.MODE === "development") {
            console.log(`[babelbird] Going to translate: `, ttt);
        }

        if (!ttt.isSelected) {
            document.execCommand("selectAll", false, "");
        }

        const ld = await getLanguageDetector();
        const source = (await ld.detect(ttt.text))[0].detectedLanguage;
        const t = await getTranslator(source, "fr");

        const stream = t.translateStreaming(ttt.text);
        const reader = stream.getReader();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            document.execCommand("insertText", false, value);
        }
    }

    let loadProgress = $derived((languageDetectorLoad + translatorLoad) / 2);

    if (import.meta.env.MODE === "development") {
        $effect(() => {
            console.log("[babelbird] ", {
                loadProgress,
                languageDetectorLoad,
                translatorLoad,
            });
        });
    }
</script>
