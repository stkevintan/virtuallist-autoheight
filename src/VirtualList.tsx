import * as React from "react";
import {
  Observable,
  fromEvent,
  BehaviorSubject,
  Subscription,
  combineLatest
} from "rxjs";
import {
  map,
  tap,
  startWith,
  filter,
  withLatestFrom,
  pairwise
} from "rxjs/operators";

interface VirtualListOptions {
  height: number;
}

interface DataItem {
  origin: React.ReactNode;
  $pos: number;
  $index: number;
}

interface VirtualListProps {
  data$: Observable<React.ReactNode[]>;
  options$: Observable<VirtualListOptions>;
}

interface VirtualListState {
  data: DataItem[];
  scrollHeight: number;
}

const styles: React.CSSProperties = {
  position: "relative",
  height: "100%",
  width: "100%",
  overflow: "hidden overlay",
  transform: "translateY(0px)",
  contain: "strict"
};

export class VirtualList extends React.Component<
  VirtualListProps,
  VirtualListState
> {
  readonly state: VirtualListState = {
    data: [],
    scrollHeight: 0
  };

  private virtualListRef = React.createRef<HTMLDivElement>();
  private containerHeight$ = new BehaviorSubject<number>(0);
  private sub = new Subscription();
  private lastFirstIndex = -1;
  private stateDataSnapshot: any[] = [];

  componentDidMount() {
    const container = this.virtualListRef.current as HTMLElement;
    this.containerHeight$.next(container.clientHeight);

    const actualRows$ = combineLatest(
      this.containerHeight$,
      this.props.options$
    ).pipe(map(([ch, option]) => Math.ceil(ch / option.height) + 3));

    // const dataInViewSlice$ = combineLatest(this.props.data$, actualRows$).pipe(
    //   map(([data, actualRows]) => data.slice(0, actualRows))
    // );

    // this.sub.add(dataInViewSlice$.subscribe(data => this.setState({ data })));

    const scrollHeight$ = combineLatest(
      this.props.data$,
      this.props.options$
    ).pipe(map(([data, { height }]) => data.length * height));

    scrollHeight$.subscribe(height => this.setState({ scrollHeight: height }));

    const scrollWin$ = fromEvent(container, "scroll").pipe(
      map(event => (event.target as any).scrollTop),
      startWith(0)
    );

    const scrollDirection$ = scrollWin$.pipe(
      pairwise(),
      map(([prev, next]) => (next > prev ? 1 : -1)),
      startWith(1)
    );

    const shouldUpdate$ = combineLatest(
      scrollWin$,
      this.props.data$,
      this.props.options$,
      actualRows$
    ).pipe(
      map(([top, data, { height }, actualRows]) => {
        const firstIndex = Math.floor(top / height);
        const maxIndex =
          data.length < actualRows ? 0 : data.length - actualRows;
        return [Math.min(firstIndex, maxIndex), actualRows];
      }),
      filter(([curIndex]) => curIndex !== this.lastFirstIndex),
      tap(([curIndex]) => (this.lastFirstIndex = curIndex)),
      map(([firstIndex, actualRows]) => [
        firstIndex,
        firstIndex + actualRows - 1
      ])
    );

    const dataInViewSlice$ = combineLatest(
      this.props.data$,
      this.props.options$,
      shouldUpdate$
    ).pipe(
      withLatestFrom(scrollDirection$),
      map(([[data, { height }, [firstIndex, lastIndex]], dir]) => {
        const dataSlice = this.stateDataSnapshot;

        if (!dataSlice.length) {
           this.stateDataSnapshot = data
            .slice(firstIndex, lastIndex + 1)
            .map((item, index) => ({
              origin: item,
              $pos: (firstIndex + index) * height,
              $index: firstIndex + index
            }));
          return this.stateDataSnapshot;
        }

        // 获得超出窗口的item下标
        const diffSliceIndexes = this.getDifferenceIndexes(
          dataSlice,
          firstIndex,
          lastIndex
        );
        //向上补元素还是向下补元素
        let newIndex =
          dir > 0 ? lastIndex - diffSliceIndexes.length + 1 : firstIndex;

        // 将超出下标的item的值替换成进入下标的元素
        diffSliceIndexes.forEach(index => {
          const item = dataSlice[index];
          item.origin = data[newIndex];
          item.$pos = newIndex * height;
          item.$index = newIndex++;
        });

        return (this.stateDataSnapshot = dataSlice);
      })
    );

    this.sub.add(
      combineLatest(dataInViewSlice$, scrollHeight$).subscribe(
        ([data, scrollHeight]) => this.setState({ data, scrollHeight })
      )
    );
  }

  private getDifferenceIndexes(
    slice: any[],
    firstIndex: number,
    lastIndex: number
  ): number[] {
    const indexes: number[] = [];

    slice.forEach((item, i) => {
      if (item.$index < firstIndex || item.$index > lastIndex) {
        indexes.push(i);
      }
    });

    return indexes;
  }

  render() {
    return (
      <div ref={this.virtualListRef} style={styles}>
        <div
          style={{
            position: "absolute",
            height: "1px",
            width: "100%",
            transform: `translate(0px, ${this.state.scrollHeight}px)`
          }}
        />
        {this.state.data.map((item, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "100%",
              transform: `translateY(${item.$pos}px)`,
            }}
          >
            {item.origin}
          </div>
        ))}
      </div>
    );
  }
}
