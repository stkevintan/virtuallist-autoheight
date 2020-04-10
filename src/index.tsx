import * as React from "react";
import { render } from "react-dom";
import { VirtualList } from "./VirtualList";

import "./styles.css";
import { of } from "rxjs";
import { ListItem } from "./ListItem";
import { IDLE_ITEM_HEIGHT } from "./util";

const data$ = of(Array.from({ length: 8000 }, (_, i) => <ListItem key={i} index={i} />));
const options$ = of({ height: IDLE_ITEM_HEIGHT });


function App() {
  return (
    <div className="App">
      <div
        style={{
          width: "60vw",
          height: 500,
          border: "1px solid #eee",
          margin: "20px auto"
        }}
      >
        <VirtualList data$={data$} options$={options$} />
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
