import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  HostListener,
} from '@angular/core';
import { EventSystem } from '@udonarium/core/system';
import { DataElement } from '@udonarium/data-element';
import { MarkDown } from '@udonarium/mark-down';

import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { ObjectStore } from '@udonarium/core/synchronize-object/object-store';
import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';

import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'game-data-element, [game-data-element]',
  templateUrl: './game-data-element.component.html',
  styleUrls: ['./game-data-element.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameDataElementComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() gameDataElement: DataElement = null;
  @Input() isEdit: boolean = false;
  @Input() isTagLocked: boolean = false;
  @Input() isValueLocked: boolean = false;

  @Input() isImage: boolean = false;
  @Input() indexNum: number = 0;

  private _name: string = '';
  get name(): string { return this._name; }
  set name(name: string) { this._name = name; this.setUpdateTimer(); }

  private _value: number | string = 0;
  get value(): number | string { return this._value; }
  set value(value: number | string) { this._value = value; this.setUpdateTimer(); }

  private _currentValue: number | string = 0;
  get currentValue(): number | string { return this._currentValue; }
  set currentValue(currentValue: number | string) { this._currentValue = currentValue; this.setUpdateTimer(); }

  private _step: number = 1;
  get step(): number { return this._step; }
  set step(step: number) { this._step = step; this.setUpdateTimer(); }

  private _currentLineValue: number = 0;
  get currentLineValue(): number { return this._currentLineValue; }
  set currentLineValue(currentLineValue: number) { this._currentLineValue = currentLineValue; this.setUpdateTimer(); }
  
  private _maxLineValue: number = 0;
  get maxLineValue(): number { return this._maxLineValue; }
  set maxLineValue(maxLineValue: number) { this._maxLineValue = maxLineValue; this.setUpdateTimer(); }
  
  private updateTimer: NodeJS.Timer = null;

  constructor(
    private panelService: PanelService,
    private modalService: ModalService,
    private changeDetector: ChangeDetectorRef,
    private domSanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    if (this.gameDataElement) this.setValues(this.gameDataElement);

    EventSystem.register(this)
      .on('UPDATE_GAME_OBJECT', event => {
        if (this.gameDataElement && event.data.identifier === this.gameDataElement.identifier) {
          this.setValues(this.gameDataElement);
          this.changeDetector.markForCheck();
        }
      })
      .on('DELETE_GAME_OBJECT', event => {
        if (this.gameDataElement && this.gameDataElement.identifier === event.data.identifier) {
          this.changeDetector.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  ngAfterViewInit() {

  }

  get imageFileUrl(): string { 
     let image:ImageFile = ImageStorage.instance.get(<string>this.gameDataElement.value);
     if (image) return image.url;
     return '';
  }

  openModal(name: string = '', isAllowedEmpty: boolean = false) {
    this.modalService.open<string>(FileSelecterComponent, { isAllowedEmpty: isAllowedEmpty }).then(value => {
//      if (!this.tabletopObject || !this.tabletopObject.imageDataElement || !value) return;
      if (!value) return;
      let element = this.gameDataElement;
      if (!element) return;
      element.value = value;
    });
  }

  updateKomaIconMaxValue(root: DataElement){
    let image = root.getFirstElementByName('image');
    let icon = root.getElementsByName('ICON');
    if(icon){
      icon[0].value = image.children.length - 1;
      if( icon[0].currentValue > icon[0].value ) icon[0].currentValue = icon[0].value;
    }
  }

  addImageElement() {
    this.gameDataElement.appendChild(DataElement.create('imageIdentifier', '', { type: 'image' }));
    const root: DataElement = <DataElement>this.gameDataElement.parent;

    this.updateKomaIconMaxValue(root);
  }

  addElement() {
    this.gameDataElement.appendChild(DataElement.create('タグ', '', {}));
  }

  deleteElement() {
    this.gameDataElement.destroy();
  }

  deleteImageElement() {
    const root: DataElement = <DataElement>this.gameDataElement.parent.parent;
    if( this.gameDataElement.parent.children[0] != this.gameDataElement){
      this.gameDataElement.destroy();
      this.updateKomaIconMaxValue(root);
    }
  }


  upElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (0 < index) {
      let prevElement = parentElement.children[index - 1];
      parentElement.insertBefore(this.gameDataElement, prevElement);
    }
  }

  downElement() {
    let parentElement = this.gameDataElement.parent;
    let index: number = parentElement.children.indexOf(this.gameDataElement);
    if (index < parentElement.children.length - 1) {
      let nextElement = index < parentElement.children.length - 2 ? parentElement.children[index + 2] : null;
      parentElement.insertBefore(this.gameDataElement, nextElement);
    }
  }


  setElementType(type: string) {
    this.gameDataElement.setAttribute('type', type);
  }

  private setValues(object: DataElement) {
    this._name = object.name;
    this._currentValue = object.currentValue;
    this._value = object.value;
    this._step = object.step;
    this._currentLineValue = object.currentLineValue;
    this._maxLineValue = object.maxLineValue;
  }

  private setUpdateTimer() {
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      if (this.gameDataElement.name !== this.name) this.gameDataElement.name = this.name;
      if (this.gameDataElement.currentValue !== this.currentValue) this.gameDataElement.currentValue = this.currentValue;
      if (this.gameDataElement.value !== this.value) this.gameDataElement.value = this.value;
      if (this.gameDataElement.step !== this.step) this.gameDataElement.step = this.step;
      if (this.gameDataElement.currentLineValue !== this.currentLineValue) this.gameDataElement.currentLineValue = this.currentLineValue;
      if (this.gameDataElement.maxLineValue !== this.maxLineValue) this.gameDataElement.maxLineValue = this.maxLineValue;
      this.updateTimer = null;
    }, 66);
  }

  escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  clickMarkDownBox(id: string) {
    console.log("マークダウンクリック:" + id);
  }

  get markdown(): MarkDown { return ObjectStore.instance.get<MarkDown>('markdwon'); }

  escapeHtmlMarkDown(text, baseId): SafeHtml{

    let textCheckBox = this.markdown.markDownCheckBox(text, baseId);
    let textTable =  this.markdown.markDownTable(textCheckBox);

    return this.domSanitizer.bypassSecurityTrustHtml("<div>" + textTable + "</div>");
  }

  @HostListener('click', ['$event'])
  click(event){
    if (this.markdown){
      console.log("event.timeStamp:" + event.timeStamp);
      this.markdown.changeMarkDownCheckBox(event.target.id, event.timeStamp);
    }
  }

  isEditLineTrigger( dataElmIdentifier) {
    let box = <HTMLInputElement>document.getElementById(dataElmIdentifier);
    if( !box )return false;
    return box.checked;
  }
  
  isEditMarkDown( dataElmIdentifier) {
    let box = <HTMLInputElement>document.getElementById(dataElmIdentifier);
    if( !box )return false;
    return box.checked;
  }

  isEditUrl( dataElmIdentifier) {
    let box = <HTMLInputElement>document.getElementById(dataElmIdentifier);
    if( !box )return false;
    return box.checked;
  }
  
  isUrlText( text ){
    if( text.match( /^https:\/\// ) )return true;
    if( text.match( /^http:\/\// ) )return true;
    return false;
  }
  
  changeChk(){
    //実処理なし
  }

  textFocus( dataElmIdentifier ){
    let box = <HTMLInputElement>document.getElementById(dataElmIdentifier);
    box.checked = true;
  }
  
}
