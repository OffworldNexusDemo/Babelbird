/**
 * Sleeps for the given amount of seconds
 * @param sec Number of seconds to sleep
 */
export function sleep(sec: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), sec * 1000);
    });
}
