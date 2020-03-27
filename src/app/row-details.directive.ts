import { Directive, HostBinding, HostListener, Input, TemplateRef, ViewContainerRef, ViewRef, ChangeDetectorRef } from '@angular/core';

@Directive({
  selector: '[appRowDetails]'
})
export class RowDetailsDirective {
  /**
   * how to remove previously opened row? :
   * -get element by class "expended" then remove it manualy
   * -something else?
   * 
   * réecrit ce truc toi même
   */
  private i: number;
  private row: any;
  private tRef: TemplateRef<any>;
  private opened: boolean;
  private lastCreatedView: ViewRef;

  @HostBinding('class.expanded')
  get expended(): boolean {
    // console.log('expended: ', this);
    return this.opened;
  }

  @Input()
  set appRowDetails(value: any) {
    // console.log('appRowDetails: ', value);
    if (value !== this.row) {
      this.row = value;
      // this.render();
    }
  }

  @Input('DetailRow')
  set template(value: TemplateRef<any>) {
    // console.log('DetailRow: ', value);
    if (value !== this.tRef) {
      // this.tRef.clear()
      this.tRef = value;
      // this.render();
    }
  }

  @Input('Index')
  set index(value: number) {
    if (value !== this.i) {
      // this.tRef.clear()
      this.i = value;
      // this.render();
    }
  }
  constructor(
    public vcRef: ViewContainerRef,
    public viewRef: ViewRef,
    public changeDetectorRef: ChangeDetectorRef) {
        // console.log('row-detail constructor: ', this.vcRef, this.vcRef.element.nativeElement);
        // this.vcRef.element.nativeElement.addEventListener('click', this.test.bind(this));
    }

    // test(e) {
    //     console.log('papa: ', e);
    //     setTimeout(() => console.log(this.changeDetectorRef.detectChanges()), 200);
    // }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    // console.log('cliked!!!!!', this.opened, this.vcRef.length, this.vcRef.indexOf(this.viewRef), this.vcRef, this.lastCreatedView);
    console.log(this.i)
    // this.vcRef.remove();
    // console.log('event: ', event);
    // const x: any = event.target;
    // console.log('found?: ', x.closest('.concierge'));
    // console.log('index: ', this.i, 'row: ', this.row);
    // if (x.closest('.concierge') !== null || x.closest('.status') !== null) { // for avoiding row open on concierge select 'click'
    //   return;
    // }
    this.toggle();
  }

  toggle(): void {
    if (this.opened) {
    //   console.log('normalement l\'element doit etre suppr');
      this.vcRef.clear();
      this.changeDetectorRef.detectChanges(); // ca fonctionne
    } else {
      // console.log('call render');
      this.render();
    }
    // console.log(this.vcRef.length, this.viewRef);
    this.opened = this.vcRef.length > 0;
  }

  private render(): void {
    this.vcRef.clear();
    // console.log('in render: ', this.tRef, this.row, this.tRef && this.row);
    if (this.tRef && this.row) {
      // console.log('createEmbeddedView', this.tRef, this.row);
      this.lastCreatedView = this.vcRef.createEmbeddedView(this.tRef, { $implicit: {data: this.row, index: this.i}});
    }
  }

}
