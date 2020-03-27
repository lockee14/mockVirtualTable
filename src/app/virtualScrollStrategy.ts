import { VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { ListRange } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged} from 'rxjs/operators';
import { CustomCdkVirtualScrollViewport, MockData } from './interface';

export class CustomVirtualScrollStrategy implements VirtualScrollStrategy {
    _itemSize = 50;
    _maxBufferPx = 400;
    _minBufferPx = 200;
    _viewport: CustomCdkVirtualScrollViewport;

    private _scrolledIndexChange = new Subject<number>();

    /** @docs-private Implemented as part of VirtualScrollStrategy. */
    scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(distinctUntilChanged());

    constructor() {}

    onContentScrolled(): void {
        this._updateRenderedRange();
    }

    attach(viewPort: CustomCdkVirtualScrollViewport) {
        console.log('attach: ', viewPort);
        this._viewport = viewPort;
        this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
    }

    detach(): void {
        this._scrolledIndexChange.complete();
        this._viewport = null;
    }

    updateItemAndBufferSize(itemSize: number, minBufferPx: number, maxBufferPx: number) {
        console.log('updateItemAndBufferSize');
        if (maxBufferPx < minBufferPx) {
          throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
        }
        this._itemSize = itemSize;
        this._minBufferPx = minBufferPx;
        this._maxBufferPx = maxBufferPx;
        this._updateTotalContentSize();
        this._updateRenderedRange();
    }

    /** Called when the length of the data changes. */
    onDataLengthChanged(): void {
        this._updateTotalContentSize();
        this._updateRenderedRange();
    }

    /** Called when the range of items rendered in the DOM has changed. */
    onContentRendered(): void {
        this._updateRenderedRange();
    }

    /** Called when the offset of the rendered items changed. */
    onRenderedOffsetChanged(): void {}
    /**
     * Scroll to the offset for the given index.
     * @param index The index of the element to scroll to.
     * @param behavior The ScrollBehavior to use when scrolling.
     */
    scrollToIndex(index: number, behavior: ScrollBehavior): void {}

    private _updateTotalContentSize() {
        if (!this._viewport) {
          return;
        }
        this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
    }

    private _updateRenderedRange() { // modify this to avoid glitch in rendering row when one or more are expended
        if (!this._viewport) {
            console.log('_updateRenderedRange return');
            return;
        }
        const scrollOffset = this._viewport.measureScrollOffset();
        const firstVisibleIndex = scrollOffset / this._itemSize;
        const renderedRange: ListRange = this._viewport.getRenderedRange();
        const newRange: ListRange = {start: renderedRange.start, end: renderedRange.end};
        const viewportSize = this._viewport.getViewportSize();
        const dataLength = this._viewport.getDataLength();

        const divs = this._viewport.viewContainerRef.element.nativeElement.tBodies[0].getElementsByClassName('detail-row');
        const child = divs[0];
        const parent = this._viewport.viewContainerRef.element.nativeElement.tBodies[0];
        const firstDivIndex = Array.prototype.indexOf.call(parent.children, child); // avec ça je peu comparé la position du div
        const startBuffer = scrollOffset - newRange.start * this._itemSize; // account for expended div length

        let delExpand = true;

        if (startBuffer < this._minBufferPx && newRange.start !== 0) { // scroll up
            const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
            newRange.start = Math.max(0, newRange.start - expandStart);
            newRange.end = Math.min(dataLength, Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / this._itemSize));
        } else { // scroll down
            const endBuffer = newRange.end * this._itemSize - (scrollOffset + viewportSize);
            if (endBuffer < this._minBufferPx && newRange.end !== dataLength) {
                const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
                if (expandEnd > 0) {
                    newRange.end = Math.min(dataLength, newRange.end + expandEnd);
                    newRange.start = Math.max(0, Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize));
                    console.log('expandEnd > 0',
                        '\ndelta', renderedRange.end - renderedRange.start,
                        '\nfirstVisibleIndex: ', firstVisibleIndex,
                        '\npre range: ', renderedRange,
                        '\nnew range: ', newRange,
                    );
                    if (divs[0] && newRange.start - renderedRange.start >= firstDivIndex) {
                        /**
                         * je connais:
                         *      -divs[0] relative position
                         *      -le range
                         *      
                         *  kind of work but sometime it don't jump through row need to be fixed see that later
                         */
                        newRange.start = renderedRange.start;
                        console.log(
                            'delta', newRange.start - renderedRange.start,
                            '\nfirstDivIndex: ', firstDivIndex,
                            '\nadjusted firstVisibleIndex: comment faire?'
                        );
                        const delta = newRange.end - renderedRange.start;
                        if (delta * this._itemSize - divs[0].getBoundingClientRect().height > viewportSize + divs[0].getBoundingClientRect().height + this._itemSize + this._minBufferPx) {
                            newRange.start = renderedRange.start + firstDivIndex;
                            delExpand = false;
                        } else {
                            newRange.start = renderedRange.start + firstDivIndex - 1;
                        }
                    } else {
                        newRange.start = Math.max(0, Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize));
                    }
                }
            }
        }
        this._viewport.setRenderedRange(newRange);
        if (delExpand) {
            this._viewport.setRenderedContentOffset(this._itemSize * newRange.start);
        }
        this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
    }
}
