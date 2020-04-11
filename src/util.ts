
export interface DataItem {
    origin: React.ReactNode;
    $index: number;
    $pos: number;
}

export const IDLE_ITEM_HEIGHT = 250;

export const getRandomHeight = (t = 50) => {
    const eps = Math.random() * t -  t >> 1;
    return IDLE_ITEM_HEIGHT + eps;
}

export const getFirstIndex = (top: number, tops: number[]) => {
    let res = 0, L = 0, R = tops.length - 1;
    while (L < R) {
        const M = (L + R) >> 1;
        if (tops[M] > top) {
            R = M;
        } else {
            res = M;
            L = M + 1;
        }
    }
    return res;
}


export const getMaxIndex = (height: number, tops: number[]) => {
    let index = tops.length - 2;
    let acc = 0;
    while (true) {
        if (acc >= height) return index;
        if (index <= 0) return 0;
        acc += tops[index] - tops[index - 1];
        index--;
    }
}


export const indexDiff = (
    slice: (DataItem | null)[],
    firstIndex: number,
    lastIndex: number
  ): [number[], number[]] => {
    const dels: number[] = [];
    const adds: number[] = [];
    const table: Record<number, boolean> = {}
    slice.forEach((item, i) => {
      if (item === null) {
        dels.push(i);
        return;
      }
      if (item.$index < firstIndex || item.$index > lastIndex) {
        dels.push(i);
      } else {
        table[item.$index] = true;
      }
    });

    for (let i = firstIndex; i <= lastIndex; i++) {
      if (!table[i]) adds.push(i);
    }

    return [adds, dels];
  }