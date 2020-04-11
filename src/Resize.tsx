import React, { Component } from 'react';
import ReactDOM from 'react-dom';

declare var ResizeObserver: any;

const supportResizeObserver = typeof ResizeObserver !== 'undefined';

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%'
    },

    wrapper: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: -1,
        top: 0
    },

    resizeWrapper: {
        overflow: 'hidden',
        width: '100%',
        height: '100%'
    },

    shrink: {
        height: '200%',
        width: '200%'
    }
};

export interface IResizeProps {
    onResize?: (rect: DOMRect) => void
}

interface IResizeState {
    domWidth: number,
    domHeight: number
}
export class Resize extends Component<IResizeProps, IResizeState> {
    readonly state: IResizeState = {
        domWidth: 0,
        domHeight: 0
    }

    private resizeObserver: any;
    private wrapperRef = React.createRef<HTMLDivElement>();
    private expandRef = React.createRef<HTMLDivElement>();
    private shrinkRef = React.createRef<HTMLDivElement>();

    componentDidMount() {
        if (supportResizeObserver) {
            this.resizeObserver = new ResizeObserver((entries: any) => {
                entries.forEach((entry: any) => {
                    const { target } = entry;
                    // 修复某些case下target不在DOM中， 触发的width/height都为0
                    if (!target.parentElement) return;
                    this.onResize(target.getBoundingClientRect());
                });
            });
            const elem = ReactDOM.findDOMNode(this);
            if (elem instanceof HTMLDivElement) {
                this.resizeObserver.observe(elem);
            }
        } else {
            this.resize();
        }
    }

    componentDidUpdate() {
        if (!supportResizeObserver) {
            if (this.expandRef.current) {
                this.expandRef.current.scrollTop = this.expandRef.current.scrollHeight;
                this.expandRef.current.scrollLeft = this.expandRef.current.scrollWidth;
            }
            if (this.shrinkRef.current) {
                this.shrinkRef.current.scrollTop = this.shrinkRef.current.scrollHeight;
                this.shrinkRef.current.scrollLeft = this.shrinkRef.current.scrollWidth;
            }
        }
    }

    componentWillUnmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    private onResize = (rect: DOMRect) => {
        this.props.onResize?.(rect);
    }

    private onExpand = () => {
        const domRect = this.getRect();
        this.resize(domRect);
        this.onResize(domRect);
    }

    onShrink = () => {
        const domRect = this.getRect();
        this.resize(domRect);
        this.onResize(domRect);
    }

    resize = (rect: DOMRect = this.getRect()) => {
        const domWidth = rect.width;
        const domHeight = rect.height;
        this.setState({
            domWidth: domWidth + 1,
            domHeight: domHeight + 1
        });
    }

    getRect = () => {
        const dom = this.wrapperRef.current!;
        return dom.getBoundingClientRect();
    }



    renderPolyfillEl() {
        const { domWidth, domHeight } = this.state;
        return (
            <div style={styles.wrapper} ref={this.wrapperRef}>
                <div style={styles.resizeWrapper}
                    ref={this.expandRef}
                    onScroll={this.onExpand}>
                    <div style={{ width: domWidth, height: domHeight }}>
                    </div>
                </div>
                <div style={styles.resizeWrapper}
                    ref={this.shrinkRef}
                    onScroll={this.onShrink}>
                    <div style={styles.shrink}>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        if (supportResizeObserver) {
            return React.Children.only(this.props.children);
        }
        return (
            <div style={styles.container}>
                {this.props.children}
                {this.renderPolyfillEl()}
            </div>
        );
    }
}
