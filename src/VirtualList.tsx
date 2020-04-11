import * as React from "react";
import {
  Observable,
  fromEvent,
  BehaviorSubject,
  Subscription,
  combineLatest,
  Subject
} from "rxjs";
import {
  map,
  startWith,
  withLatestFrom,
  distinctUntilChanged,
  bufferTime,
  filter,
} from "rxjs/operators";
import { indexOfLessOrEqual, getMaxIndex, DataItem, indexDiff } from "./util";
import { Resize } from "./Resize";

interface VirtualListOptions {
  height: number;
  preload?: number;
}


interface VirtualListProps {
  data$: Observable<React.ReactNode[]>;
  options$: Observable<VirtualListOptions>;

}

interface VirtualListState {
  data: (DataItem | null)[];
  scrollHeight: number;
}


export enum Direction {
  Up,
  Down
}

export class VirtualList extends React.Component<
  VirtualListProps,
  VirtualListState
  > {
  readonly state: VirtualListState = {
    data: [],
    scrollHeight: 0
  };

  private readonly defaultPreload = 3;
  private virtualListRef = React.createRef<HTMLDivElement>();
  private containerHeight$ = new BehaviorSubject<number>(0);
  private sub = new Subscription();
  private dataSlice: (DataItem | null)[] = [];

  private rowTops$ = new BehaviorSubject<number[]>([]);
  private resizeCall$ = new Subject<[number, number]>()

  componentDidMount() {
    const container = this.virtualListRef.current as HTMLElement;

    this.sub.add(combineLatest(
      this.props.data$,
      this.props.options$,
    ).pipe(
      // append a extra row to calculate the scroll height later.
      map(([data, { height }]) => Array.from({ length: 1 + data.length }, (_, i) => i * height))
    ).subscribe(rows => this.rowTops$.next(rows)));

    const scrollHeight$ = this.rowTops$.pipe(map(tops => tops[tops.length - 1] ?? 0));

    this.sub.add(scrollHeight$.subscribe(height => this.setState({ scrollHeight: height })));

    const scrollWin$ = fromEvent(container, "scroll").pipe(
      map(event => (event.target as any).scrollTop),
      startWith(0)
    );

    // const scrollDirection$ = scrollWin$.pipe(
    //   pairwise(),
    //   map(([prev, next]) => (next > prev ? Direction.Down : Direction.Up)),
    //   startWith(Direction.Down)
    // );

    const sliceBorder$ = combineLatest(
      scrollWin$,
      this.rowTops$,
      this.containerHeight$
    ).pipe(
      withLatestFrom(this.props.options$),
      map(([[top, tops, containerHeight], options]) => {
        const preload = options.preload || this.defaultPreload;
        const firstIndex = indexOfLessOrEqual(top, tops);
        let maxIndex = getMaxIndex(containerHeight, tops) - preload;
        if (maxIndex < 0) maxIndex = 0;
        if (maxIndex <= firstIndex) return [maxIndex, tops.length - 2] as const;
        const lastIndex = indexOfLessOrEqual(top + containerHeight, tops) + preload;
        return [firstIndex, lastIndex] as const;
      }),
      distinctUntilChanged((x, y) => x[0] === y[0] && x[1] === y[1])
    );

    const dataInViewSlice$ = combineLatest(
      this.props.data$,
      sliceBorder$,
      this.rowTops$
    ).pipe(
      map(([data, [firstIndex, lastIndex], tops]) => {
        if (!this.dataSlice.length) {
          this.dataSlice = data
            .slice(firstIndex, lastIndex + 1)
            .map((item, index) => ({
              origin: item,
              $pos: tops[firstIndex + index],
              $index: firstIndex + index
            }));
          return this.dataSlice;
        }

        // 获得超出窗口的item下标
        const [adds, dels] = indexDiff(this.dataSlice, firstIndex, lastIndex);

        // 将超出下标的item的值替换成进入下标的元素
        let addIndex = 0;
        let delIndex = 0;
        while (addIndex < adds.length && delIndex < dels.length) {
          const index = dels[delIndex++];
          const $index = adds[addIndex++]
          const item = this.dataSlice[index];
          if (item) {
            item.$index = $index;
            item.origin = data[item.$index];
          } else {
            this.dataSlice[index] = {
              $index,
              $pos: 0, // will correct soon
              origin: data[$index]
            }
          }
        }

        for (let i = delIndex; i < dels.length; i++) {
          this.dataSlice[dels[i]] = null;
        }

        for (let i = addIndex; i < adds.length; i++) {
          this.dataSlice.push({
            $index: adds[i],
            origin: data[adds[i]],
            $pos: 0 // will correct soon
          });
        }

        for (const item of this.dataSlice) {
          if (item) {
            item.$pos = tops[item.$index]
          }
        }

        return this.dataSlice
      }),
    );

    this.sub.add(this.resizeCall$.pipe(
      bufferTime(500),
      filter(calls => calls.length > 0),
      map(calls => calls.sort((x, y) => x[0] - y[0])),
      withLatestFrom(this.rowTops$),
    ).subscribe(([calls, tops]) => {
      let callIndex = 0;
      let delta = 0;
      for (let i = calls[0][0]; i < tops.length; i++) {
        tops[i] += delta;
        if (i + 1 === tops.length) break;
        if (callIndex < calls.length && i === calls[callIndex][0]) {
          delta += calls[callIndex][1] - tops[i + 1] + tops[i] - delta;
          callIndex++;
        }
      }
      this.rowTops$.next(tops);
    }));

    this.sub.add(
      combineLatest(dataInViewSlice$, scrollHeight$).subscribe(
        ([data, scrollHeight]) => this.setState({
          data,
          scrollHeight
        })
      )
    );
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }
  



  private onContainerResize = (rect: DOMRect) => {
    this.containerHeight$.next(rect.height);
  }

  private onItemResize = (rect: DOMRect, index: number) => {
    this.resizeCall$.next([index, rect.height]);
  }

  render() {
    return (
      <Resize onResize={this.onContainerResize}>
        <div ref={this.virtualListRef} className='visual-list-container'>
          <div
            className="visual-list-marker"
            style={{
              transform: `translate(0px, ${this.state.scrollHeight}px)`
            }}
          />
          {this.state.data.map((item, i) => item && (
            <div
              key={i}
              className="visual-list-item"
              style={{
                transform: `translateY(${item.$pos}px)`,
              }}
            >
              <Resize onResize={rect => this.onItemResize(rect, item.$index)}>
                {item.origin}
              </Resize>
            </div>
          ))}
        </div>
      </Resize>
    );
  }
}
