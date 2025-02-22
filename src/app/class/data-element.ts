import { Attributes } from './core/synchronize-object/attributes';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { ObjectNode } from './core/synchronize-object/object-node';
import { GameObject, ObjectContext } from './core/synchronize-object/game-object';

@SyncObject('data')
export class DataElement extends ObjectNode {
  @SyncVar() name: string;
  @SyncVar() type: string;
  @SyncVar() currentValue: number | string;
  
  @SyncVar() step: number;
  
  @SyncVar() currentLineValue: number;
  @SyncVar() maxLineValue: number;

  get isNumberResource(): boolean { return this.type != null && this.type === 'numberResource'; }
  get isNote(): boolean { return this.type != null && this.type === 'note'; }

  public static create(name: string, value: number | string = '', attributes: Attributes = {}, identifier: string = ''): DataElement {
    let dataElement: DataElement;
    if (identifier && 0 < identifier.length) {
      dataElement = new DataElement(identifier);
    } else {
      dataElement = new DataElement();
    }
    dataElement.attributes = attributes;
    dataElement.name = name;
    dataElement.value = value;
    dataElement.initialize();

    return dataElement;
  }

  getElementsByName(name: string): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('name') === name) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByName(name));
      }
    }
    return children;
  }

  getElementsByType(type: string): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('type') === type) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByType(type));
      }
    }
    return children;
  }

  getFirstElementByName(name: string): DataElement {
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (child.getAttribute('name') === name) return child;
        let match = child.getFirstElementByName(name);
        if (match) return match;
      }
    }
    return null;
  }
  
  getElementsByRegExp(re: RegExp): DataElement[] {
    let children: DataElement[] = [];
    for (let child of this.children) {
      if (child instanceof DataElement) {
        if (re.test(child.getAttribute('name'))) children.push(child);
        Array.prototype.push.apply(children, child.getElementsByRegExp(re));
      }
    }
    return children;
  }

  get myIdentifer(){
    let self: GameObject = <GameObject> this;
    return self.identifier;
  }

  get nowValueColor(): string{
    if (this.name.match(/^[SsＳｓ][AaＡａ][NnＮn]$/i) || this.name.match(/^正気度$/i) ){
      if ( this.isNumberResource ){
        let current: number = (this.currentValue as number);
        let value: number = (this.value as number);
        if ( current <= (value * 4 / 5) && current == this.currentValue && value == this.value){
          return '#D22';
        }
      }
    }
    return '#444';
  }

}
