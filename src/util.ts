export const IDLE_ITEM_HEIGHT = 180;

export const getRandomHeight = () => {
    const eps = Math.random() * 20 - 10;
    return IDLE_ITEM_HEIGHT + eps;
}