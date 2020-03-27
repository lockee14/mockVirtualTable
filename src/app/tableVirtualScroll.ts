import { ViewContainerRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { DataSource } from '@angular/cdk/table';
import { ListRange } from '@angular/cdk/collections';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import { CustomCdkVirtualScrollViewport, MockData } from './interface';

function makeData(beg = 0): MockData[] {
    const a = [];
    for (let i = beg; i < beg + 100; i++) {
        a.push({
            position: i,
            name: `name ${i}`,
            test: `placeholder ${i}`
        });
    }
    return a;
}

export class UserTableDataSource extends DataSource<any> {// implements VirtualScrollStrategy {
    private _pageSize = 100; // elements
    private _pages = 10; // pages
    private _pageOffset = 20; // elements
    private _pageCache = new Set<number>();
    private _subscription: Subscription;
    private _viewPort: CustomCdkVirtualScrollViewport;
    
    scrolledIndexChange: Observable<number>;

    matTableDataSource: MatTableDataSource<any> = new MatTableDataSource();
    private data = new BehaviorSubject([]); // = makeData();
    /*
        ne pas utiliser matTable, faire un behaviorSubject, it will be changed by scroll with next
        ici exposer un observable de ce behavior subject
        see filterByRangeStream to feed table with the correct subset of data
        comment evité d'avoir un saut de donnée lorsque un expended row est retiré?
         -keep track of the uppermost and lowermost displayed data, then render data accordingly?
            avec this._viewport.getOffsetToRenderedContentStart() je peu obtenir le 1er element afficher dans le virtual scroll
            comment calculer les mat-tab? j'ai besoin de ViewContainerRef >> je l'ai

         -
        ajoute quelque chose pour ajouter des données lorsque rendered.end = data.length
    */
    // Expose dataStream to simulate VirtualForOf.dataStream
    dataStream = this.data.asObservable();
    vcRef: ViewContainerRef;
    constructor() {
        super();
        this.data.next(makeData());
    }

    attach(viewPort: CustomCdkVirtualScrollViewport) {
        console.log('helo: ', viewPort);
        if (!viewPort) {
          throw new Error('ViewPort is undefined');
        }
        this._viewPort = viewPort;

        // Attach DataSource as CdkVirtualForOf so ViewPort can access dataStream
        this._viewPort.attach(this as any);

        // Trigger range change so that 1st page can be loaded
        // this._viewPort.setRenderedRange({ start: 0, end: 1 });
        this._subscription = this._viewPort.renderedRangeStream
            .subscribe((range: ListRange) => {
                const currentData = this.data.getValue();
                if (range.end === currentData.length) {
                    this.data.next(currentData.concat(makeData(range.end)));
                }
            });
    }

    /////////////////////////
    // Called by CDK Table //
    /////////////////////////
    connect(): Observable<any[]> {
        const tableData = this.data.asObservable();
        const filtered = this._viewPort === undefined ?
            tableData :
            this.filterByRangeStream(tableData);
        return filtered.pipe(shareReplay(1));
    }

    disconnect(): void {
      if (this._subscription) {
        this._subscription.unsubscribe();
      }
    }

    private filterByRangeStream(tableData: Observable<any[]>) {
        const rangeStream = this._viewPort.renderedRangeStream.pipe(
            startWith({} as ListRange)
        );
        const filtered = combineLatest(tableData, rangeStream).pipe(
            map(([data, { start, end }]) =>
                start === null || end === null ? data : data.slice(start, end)
            )
        );
        return filtered;
    }
}
