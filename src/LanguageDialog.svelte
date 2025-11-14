<script lang="ts">
    import { Dialog } from "@ark-ui/svelte/dialog";
    import { XIcon } from "lucide-svelte";
    import { createListCollection, Select } from "@ark-ui/svelte/select";
    import { ChevronDownIcon } from "lucide-svelte";
    import { languages } from "./languages";
    import type { SvelteComponent } from "svelte";

    let open = $state(false);
    let resolve = $state<
        ((value: string | PromiseLike<string>) => void) | null
    >(null);
    let reject = $state<((reason?: any) => void) | null>(null);

    export function askForLanguage(defaultLang: string) {
        attemptReject("askForLanguage() got called again");
        open = true;
        value = [defaultLang];

        return new Promise<string>((res, rej) => {
            resolve = res;
            reject = rej;
        });
    }

    function attemptReject(reason: string) {
        if (reject) {
            reject(reason);
        }
    }

    function nextStep(e: SubmitEvent) {
        e.preventDefault();
        open = false;

        if (resolve) {
            resolve(value[0]);
        }
    }

    interface Item {
        label: string;
        value: string;
    }

    const collection = createListCollection<Item>({
        items: [...languages]
            .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
            .map(([code, lang]) => ({
                label: `${code} - ${lang}`,
                value: code,
            })),
    });

    let value = $state<string[]>([]);
    let selectEl = $state<HTMLElement | null>(null);
</script>

<Dialog.Root
    bind:open
    onExitComplete={() => attemptReject("Dialog got closed")}
>
    <Dialog.Backdrop />
    <Dialog.Positioner>
        <Dialog.Content>
            <Dialog.Title>Pick Target Language</Dialog.Title>
            <Dialog.Description
                >Please select the language into which you would like to
                translate the selected text</Dialog.Description
            >

            <form action="" onsubmit={nextStep}>
                <Select.Root {collection} bind:value>
                    <Select.Label>Language</Select.Label>
                    <Select.Control>
                        <Select.Trigger bind:ref={selectEl}>
                            <Select.ValueText placeholder="Pick a language" />
                            <Select.Indicator>
                                <ChevronDownIcon />
                            </Select.Indicator>
                        </Select.Trigger>
                    </Select.Control>
                    <Select.Positioner>
                        <Select.Content>
                            <Select.ItemGroup>
                                <Select.ItemGroupLabel
                                    >Languages</Select.ItemGroupLabel
                                >
                                {#each collection.items as item (item.value)}
                                    <Select.Item {item}>
                                        <Select.ItemText
                                            >{item.label}</Select.ItemText
                                        >
                                        <Select.ItemIndicator
                                            >✓</Select.ItemIndicator
                                        >
                                    </Select.Item>
                                {/each}
                            </Select.ItemGroup>
                        </Select.Content>
                    </Select.Positioner>
                    <Select.HiddenSelect />
                </Select.Root>

                <div>
                    <button type="submit">Translate</button>
                </div>
            </form>

            <Dialog.CloseTrigger>
                <XIcon />
            </Dialog.CloseTrigger>
        </Dialog.Content>
    </Dialog.Positioner>
</Dialog.Root>
