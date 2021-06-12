import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { EventSystem, Network } from '@udonarium/core/system';
import { ResettableTimeout } from '@udonarium/core/system/util/resettable-timeout';
import { PeerCursor } from '@udonarium/peer-cursor';

import { BatchService } from 'service/batch.service';
import { CoordinateService } from 'service/coordinate.service';
import { PointerCoordinate } from 'service/pointer-device.service';

import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { ChatTab } from '@udonarium/chat-tab';
import { ChatTabList } from '@udonarium/chat-tab-list';

import { ChatMessageService } from 'service/chat-message.service';

@Component({
  selector: 'peer-cursor, [peer-cursor]',
  templateUrl: './peer-cursor.component.html',
  styleUrls: ['./peer-cursor.component.css']
})
export class PeerCursorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cursor') cursorElementRef: ElementRef;
  @ViewChild('opacity') opacityElementRef: ElementRef;
  @Input() cursor: PeerCursor = PeerCursor.myCursor;

  get iconUrl(): string { return this.cursor.image.url; }
  get name(): string { return this.cursor.name }
  get isMine(): boolean { return this.cursor.isMine; }

  private cursorElement: HTMLElement = null;
  private opacityElement: HTMLElement = null;
  private fadeOutTimer: ResettableTimeout = null;

  private updateInterval: NodeJS.Timer = null;

  private timestampInterval: NodeJS.Timer = null;
  private timestampIntervalEnable:boolean =false;

  private callcack: any = (e) => this.onMouseMove(e);

  private _x: number = 0;
  private _y: number = 0;
  private _target: HTMLElement;

  get delayMs(): number {
    let maxDelay = Network.peerIds.length * 16.6;
    return maxDelay < 100 ? 100 : maxDelay;
  }

  get delayMsHb(): number {
    let maxDelay = Network.peerIds.length * 166;
    return maxDelay < 1000 ? 1000 : maxDelay;
  }


  constructor(
    private batchService: BatchService,
    private coordinateService: CoordinateService,
    private chatMessageService: ChatMessageService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    if (!this.isMine) {
      EventSystem.register(this)
        .on('CURSOR_MOVE', event => {
          if (event.sendFrom !== this.cursor.peerId) return;
          this.batchService.add(() => {
            this.stopTransition();
            this.setAnimatedTransition();
            this.setPosition(event.data[0], event.data[1], event.data[2]);
            this.resetFadeOut();
          }, this);
        })
        .on('HEART_BEAT', event => {
//          console.log( 'HEART_BEAT\n' + event.sendFrom + ' >\n ' + this.cursor.peerId );
          if (event.sendFrom !== this.cursor.peerId) return;
            this.cursor.timestampSend = event.data[0];
            this.cursor.timestampReceive = Date.now();
            this.cursor.timeDiffDown = this.cursor.timestampReceive - this.cursor.timestampSend + PeerCursor.myCursor.debugReceiveDelay;
            this.cursor.timeDiffUp = this.cursor.timestampSend - this.cursor.timestampReceive + 100;
        });
    }
  }


  private disConnectNotified = true;
  private chkDisConnect( ){

    const timeout = PeerCursor.myCursor.timeout * 1000;
    const elapsedTime = Date.now() - this.cursor.timestampReceive;

    if( timeout <= elapsedTime){
      if(!this.disConnectNotified){
        this.disConnectNotified = true;

        const chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
        const chatTab = ObjectStore.instance.get<ChatTab>(chatTabidentifier);
        let text = this.cursor.userId + '['+this.cursor.name + '] さんとの接続確認信号が' + PeerCursor.myCursor.timeout + '秒以上途切れています。通信障害の可能性があります。';

        this.chatMessageService.sendSystemMessageOnePlayer( chatTab , text , PeerCursor.myCursor.identifier, "#006633");
      }
    }else{
      if( this.disConnectNotified == true ){
        
        setTimeout(() => {
          this.timestampInterval = null;
          const chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
          const chatTab = ObjectStore.instance.get<ChatTab>(chatTabidentifier);
          let text = this.cursor.userId + '['+this.cursor.name + '] さんと接続しました。';
          this.chatMessageService.sendSystemMessageOnePlayer( chatTab , text , PeerCursor.myCursor.identifier, "#006633");
        }, 1000);
      }
      this.disConnectNotified = false;
    }
  }

  private logoutMessage(){
    
    const chatTabidentifier = this.chatMessageService.chatTabs ? this.chatMessageService.chatTabs[0].identifier : '';
    const chatTab = ObjectStore.instance.get<ChatTab>(chatTabidentifier);
    let text = this.cursor.userId + '['+this.cursor.name + '] さんがログアウトしました。';
    this.chatMessageService.sendSystemMessageOnePlayer( chatTab , text , PeerCursor.myCursor.identifier, "#006633");
    
  }

  private timestampLoop(){
    if(!this.timestampIntervalEnable) return;
    if (!this.timestampInterval) {
      this.timestampInterval = setTimeout(() => {
        this.timestampInterval = null;

        if( PeerCursor.myCursor.peerId == this.cursor.peerId ){
          let timestanmp = Date.now() + PeerCursor.myCursor.debugTimeShift;
          EventSystem.call('HEART_BEAT', [ timestanmp ]);
        }else{
          this.chkDisConnect();
        }
        this.timestampLoop();

      }, this.delayMsHb);
    }
  }


  ngAfterViewInit() {
    if (this.isMine) {
      this.ngZone.runOutsideAngular(() => {
        document.body.addEventListener('mousemove', this.callcack);
        document.body.addEventListener('touchmove', this.callcack);
      });
    } else {
      this.cursorElement = this.cursorElementRef.nativeElement;
      this.opacityElement = this.opacityElementRef.nativeElement;
      this.setAnimatedTransition();
      this.setPosition(0, 0, 0);
      this.resetFadeOut();
    }

    this.timestampIntervalEnable = true;
    this.timestampLoop();
  }

  ngOnDestroy() {

    this.logoutMessage();

    document.body.removeEventListener('mousemove', this.callcack);
    document.body.removeEventListener('touchmove', this.callcack);
    EventSystem.unregister(this);
    this.batchService.remove(this);
    if (this.fadeOutTimer) this.fadeOutTimer.clear();

    this.timestampIntervalEnable = false;

  }

  private onMouseMove(e: any) {
    let x = e.touches ? e.changedTouches[0].pageX : e.pageX;
    let y = e.touches ? e.changedTouches[0].pageY : e.pageY;
    if (x === this._x && y === this._y) return;
    this._x = x;
    this._y = y;
    this._target = e.target;
    if (!this.updateInterval) {
      this.updateInterval = setTimeout(() => {
        this.updateInterval = null;
        this.calcLocalCoordinate(this._x, this._y, this._target);
      }, this.delayMs);
    }
  }

  private calcLocalCoordinate(x: number, y: number, target: HTMLElement) {
    if (!document.getElementById('app-table-layer').contains(target)) return;

    let coordinate: PointerCoordinate = { x: x, y: y, z: 0 };
    coordinate = this.coordinateService.calcTabletopLocalCoordinate(coordinate, target);

    EventSystem.call('CURSOR_MOVE', [coordinate.x, coordinate.y, coordinate.z]);
  }

  private resetFadeOut() {
    this.opacityElement.style.opacity = '1.0';
    if (this.fadeOutTimer == null) {
      this.fadeOutTimer = new ResettableTimeout(() => {
        this.opacityElement.style.opacity = '0.0';
      }, 3000);
    }
    this.fadeOutTimer.reset();
  }

  private stopTransition() {
    this.cursorElement.style.transform = window.getComputedStyle(this.cursorElement).transform;
  }

  private setAnimatedTransition() {
    this.cursorElement.style.transition = `transform ${this.delayMs + 33}ms linear, opacity 0.5s ease-out`;
  }

  private setPosition(x: number, y: number, z: number) {
    this.cursorElement.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(' + z + 'px)';
  }

}
