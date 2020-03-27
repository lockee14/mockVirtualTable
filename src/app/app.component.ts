import { Component, OnInit, ViewChild, ViewContainerRef, Output, ChangeDetectorRef } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { Observable } from 'rxjs';
import { AnimationEvent } from '@angular/animations';
import { UserTableDataSource } from './tableVirtualScroll';
import { CustomVirtualScrollStrategy } from './virtualScrollStrategy';
import { CustomCdkVirtualScrollViewport, MockData } from './interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('*', style({ height: '*', visibility: 'visible' })),
    //   transition('void <=> *', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')), // mess with expandable
    ]),
  ],
  providers: [
    {
        provide: VIRTUAL_SCROLL_STRATEGY,
        useClass: CustomVirtualScrollStrategy
    }
  ]
})
export class AppComponent implements OnInit {
    title = 'virtualscrolltable';
    @Output() test: Observable<any>;

    @ViewChild('myTable', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef; // succed to get ref
    @ViewChild('viewPort', { static: true }) viewPort: CustomCdkVirtualScrollViewport;

    dataSource = new UserTableDataSource();

    // offset: Observable<number>;
    // transform: Observable<string>;

    displayedColumns: string[] = ['position', 'name', 'test'];

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit() {
        this.dataSource.attach(this.viewPort);
        console.log(this.viewPort);
        // this.offset = this.viewPort.renderedRangeStream.pipe( // why do I need it?
        //   map(() => this.viewPort.getOffsetToRenderedContentStart()),
        //   tap(offset => console.log(offset))
        // );

        // this.transform = this.offset.pipe(
        //   map(offset => `translateY(-${offset}px)`)
        // );
    }

    ngAfterViewInit(): void {
        this.viewPort.viewContainerRef = this.viewContainerRef;
    }

    trigChangeDetection() {
        // console.log('trigChangeDetection', arguments);
        this.changeDetectorRef.detectChanges(); // trigger change detection
    }

    onRowExpand(event: AnimationEvent, data: MockData): void {
        // console.log('row expended, index:', data.position);
    }

    miscExpand(panel, ele, index) { // a revoir
    //   console.log('misc expended: ', panel, ele, index, arguments);
    }

}
