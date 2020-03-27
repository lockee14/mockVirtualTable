import { ViewContainerRef } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

export interface CustomCdkVirtualScrollViewport extends CdkVirtualScrollViewport {
    viewContainerRef: ViewContainerRef;
}

export interface MockData {
    position: number;
    name: string;
    test: string;
}
