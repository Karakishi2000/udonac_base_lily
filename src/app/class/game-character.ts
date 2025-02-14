import { ChatPalette,BuffPalette } from './chat-palette';

import { ImageFile } from './core/file-storage/image-file';
import { ImageStorage } from './core/file-storage/image-storage';
import { SyncObject, SyncVar } from './core/synchronize-object/decorator';
import { DataElement } from './data-element';
import { TabletopObject } from './tabletop-object';
import { UUID } from '@udonarium/core/system/util/uuid';

//import { GameObjectInventoryService } from 'service/game-object-inventory.service';
import { ObjectStore } from './core/synchronize-object/object-store';

@SyncObject('character')
export class GameCharacter extends TabletopObject {
  constructor(identifier: string = UUID.generateUuid()) {
    super(identifier);
    this.isAltitudeIndicate = true;
  }

  @SyncVar() isLock: boolean = false;

  @SyncVar() rotate: number = 0;
  @SyncVar() roll: number = 0;
  @SyncVar() isDropShadow: boolean = false;

  @SyncVar() hideInventory: boolean = false;
  @SyncVar() nonTalkFlag: boolean = false;
  @SyncVar() overViewWidth: number = 270;
  @SyncVar() overViewMaxHeight: number = 250;

  @SyncVar() specifyKomaImageFlag: boolean = false;
  @SyncVar() komaImageHeignt: number = 100;

  @SyncVar() chatColorCode: string[]  = ["#000000","#FF0000","#0099FF"];
  @SyncVar() syncDummyCounter: number = 0;

  _targeted: boolean = false;
  get targeted(): boolean {
    return this._targeted;
  }
  set targeted( flag: boolean) {
    this._targeted = flag;
  }

  _selectedTachieNum: number = 0;
  get selectedTachieNum(): number {
    if( this._selectedTachieNum > ( this.imageDataElement.children.length - 1) ){
      this._selectedTachieNum = this.imageDataElement.children.length - 1;
    }
    if( this._selectedTachieNum < 0 ){
      this._selectedTachieNum = 0;
    }

    return this._selectedTachieNum;
  }

  set selectedTachieNum(num : number){
    console.log("set selectedTachieNum NUM=" + num +" len" + this.imageDataElement.children.length);

    if( num > ( this.imageDataElement.children.length - 1 ) ){
      num = this.imageDataElement.children.length - 1;
    }
    if( num < 0 ){
      num = 0;
    }
    this._selectedTachieNum = num
    console.log("set selectedTachieNum" + this._selectedTachieNum);

  }

  private getIconNumElement(): DataElement {
    const iconNum = this.detailDataElement.getFirstElementByName('ICON');
    if (!iconNum || !iconNum.isNumberResource) return null;
    return iconNum;
  }

  get imageFile(): ImageFile {
    if (!this.imageDataElement) return ImageFile.Empty;

    const iconNum = this.getIconNumElement();
    if (!iconNum) {
      const image: DataElement = this.imageDataElement.getFirstElementByName('imageIdentifier');
      const file = ImageStorage.instance.get(<string>image.value);
      return file ? file : ImageFile.Empty;
    } else {
      let n = <number>iconNum.currentValue;
      if (n > this.imageDataElement.children.length - 1) n = this.imageDataElement.children.length - 1;
      const image = this.imageDataElement.children[n];
      const file = ImageStorage.instance.get(<string>image.value);
      return file ? file : ImageFile.Empty;
    }
  }

  get name(): string { return this.getCommonValue('name', ''); }
  get size(): number { return this.getCommonValue('size', 1); }
  get chatPalette(): ChatPalette {
    for (let child of this.children) {
      if (child instanceof ChatPalette) return child;
    }
    return null;
  }

  set name(value:string) { this.setCommonValue('name', value); }

  TestExec() {
    console.log('TestExec');

  }
  get remoteController(): BuffPalette {
    for (let child of this.children) {
      if (child instanceof BuffPalette){
        return child;
      }
    }
    return null;
  }

  static create(name: string, size: number, imageIdentifier: string ): GameCharacter {
    let gameCharacter: GameCharacter = new GameCharacter();
    gameCharacter.createDataElements();
    gameCharacter.initialize();

    gameCharacter.createTestGameDataElement(name, size, imageIdentifier);

    return gameCharacter;
  }

  addExtendData(){

    this.addBuffDataElement();

    let istachie = this.detailDataElement.getElementsByName('立ち絵位置');
    if( istachie.length == 0 ){
      let testElement: DataElement = DataElement.create('立ち絵位置', '', {}, '立ち絵位置' + this.identifier);
      this.detailDataElement.appendChild(testElement);
      testElement.appendChild(DataElement.create('POS', 11, { 'type': 'numberResource', 'currentValue': '0' }, 'POS_' + this.identifier));
    }

    let iconNum = this.detailDataElement.getElementsByName('コマ画像');
    if( iconNum.length == 0 ){
      let elementKoma: DataElement = DataElement.create('コマ画像', '', {}, 'コマ画像' + this.identifier);
      this.detailDataElement.appendChild(elementKoma);

      //コマ画像作成時は立ち絵の次に差し込み
      let tachies = this.detailDataElement.getElementsByName('立ち絵位置');
      if( tachies.length != 0 ){
        let parentElement = tachies[0].parent;
        let index: number = parentElement.children.indexOf(tachies[0]);
        console.log("立ち絵の次に差し込み INdex" + index);
        if (index < parentElement.children.length - 1) {
          let nextElement = parentElement.children[index + 1];
          console.log("立ち絵の次に差し込み nextElement" + nextElement);
          
          parentElement.insertBefore(elementKoma, nextElement);
        }
      }
      elementKoma.appendChild(DataElement.create(
        'ICON',
        this.imageDataElement.children.length - 1,
        { 'type': 'numberResource', 'currentValue': 0 },
        'ICON_' + this.identifier
      ));
    }

    let isbuff = this.buffDataElement.getElementsByName('バフ/デバフ');
    if( isbuff.length == 0 ){
      let buffElement: DataElement = DataElement.create('バフ/デバフ', '', {}, 'バフ/デバフ' + this.identifier);
      this.buffDataElement.appendChild(buffElement);
    }
    if( this.remoteController == null){
      let controller: BuffPalette = new BuffPalette('RemotController_' + this.identifier);
      controller.setPalette(`コントローラ入力例：
マッスルベアー DB+2 3
クリティカルレイ A 18
セイクリッドウェポン 命+1攻+2 18`);
      controller.initialize();
      this.appendChild(controller);
    }
  }

  clone() :this {
    let cloneObject = super.clone();

    let objectname:string;
    let reg = new RegExp('^(.*)_([0-9]+)$');
    let res = cloneObject.name.match(reg);

    let cloneNumber:number = 0;
    if(res != null && res.length == 3) {
      objectname = res[1];
      cloneNumber = parseInt(res[2]) + 1;
    } else {
      objectname = cloneObject.name ;
      cloneNumber = 2;
    }

    let list = ObjectStore.instance.getObjects(GameCharacter);
    for (let character of list ) {
      if( character.location.name == 'graveyard' ) continue;

      res = character.name.match(reg);
      if(res != null && res.length == 3 && res[1] == objectname) {
        let numberChk = parseInt(res[2]) + 1 ;
        if( cloneNumber <= numberChk ){
          cloneNumber = numberChk
        }
      }
    }

    cloneObject.name = objectname + '_' + cloneNumber;
    cloneObject.update();

    return cloneObject;

  }

  createTestGameDataElement(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    let resourceElement: DataElement = DataElement.create('リソース', '', {}, 'リソース' + this.identifier);
    let hpElement: DataElement = DataElement.create('HP', 200, { 'type': 'numberResource', 'currentValue': '200' }, 'HP_' + this.identifier);
    let mpElement: DataElement = DataElement.create('MP', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'MP_' + this.identifier);
//    let sanElement: DataElement = DataElement.create('SAN', 60, { 'type': 'numberResource', 'currentValue': '48' }, 'SAN_' + this.identifier);

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(altitudeElement);

    this.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(hpElement);
    resourceElement.appendChild(mpElement);
//    resourceElement.appendChild(sanElement);

    //TEST
    let testElement: DataElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('説明', 'ここに説明を書く\nあいうえお', { 'type': 'note' }, '説明' + this.identifier));
    testElement.appendChild(DataElement.create('メモ', '任意の文字列\n１\n２\n３\n４\n５', { 'type': 'note' }, 'メモ' + this.identifier));

    //TEST
    testElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('器用度', 24, {}, '器用度' + this.identifier));
    testElement.appendChild(DataElement.create('敏捷度', 24, {}, '敏捷度' + this.identifier));
    testElement.appendChild(DataElement.create('筋力', 24, {}, '筋力' + this.identifier));
    testElement.appendChild(DataElement.create('生命力', 24, {}, '生命力' + this.identifier));
    testElement.appendChild(DataElement.create('知力', 24, {}, '知力' + this.identifier));
    testElement.appendChild(DataElement.create('精神力', 24, {}, '精神力' + this.identifier));

    //TEST
    testElement = DataElement.create('戦闘特技', '', {}, '戦闘特技' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('Lv1', '全力攻撃', {}, 'Lv1' + this.identifier));
    testElement.appendChild(DataElement.create('Lv3', '武器習熟/ソード', {}, 'Lv3' + this.identifier));
    testElement.appendChild(DataElement.create('Lv5', '武器習熟/ソードⅡ', {}, 'Lv5' + this.identifier));
    testElement.appendChild(DataElement.create('Lv7', '頑強', {}, 'Lv7' + this.identifier));
    testElement.appendChild(DataElement.create('Lv9', '薙ぎ払い', {}, 'Lv9' + this.identifier));
    testElement.appendChild(DataElement.create('自動', '治癒適正', {}, '自動' + this.identifier));

    //
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let palette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    palette.setPalette(`チャットパレット入力例：
2d6+1 ダイスロール
１ｄ２０＋{敏捷}＋｛格闘｝　{name}の格闘！

自己バフ、リソース操作コマンド例：
&マッスルベアー/筋B+2/3
:MP-3
&マッスルベアー/筋B+2/3:MP-3

//敏捷=10+{敏捷A}
//敏捷A=10
//格闘＝１`);
    palette.initialize();
    this.appendChild(palette);

    this.addExtendData();
  }

  createTestGameDataElementCheckTable(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    let resourceElement: DataElement = DataElement.create('リソース', '', {}, 'リソース' + this.identifier);
    let hpElement: DataElement = DataElement.create('HP', 200, { 'type': 'numberResource', 'currentValue': '200' }, 'HP_' + this.identifier);
    let mpElement: DataElement = DataElement.create('MP', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'MP_' + this.identifier);

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(altitudeElement);

    this.detailDataElement.appendChild(resourceElement);
    resourceElement.appendChild(hpElement);
    resourceElement.appendChild(mpElement);

    //TEST
    let testElement: DataElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);

    let textMarkDown =`テーブル表
|[]|[]器術|[]|[]体術|[]|[]忍術|[]|[]謀術|[]|[]戦術|[]|[]妖術||
|　|[]絡繰術|　|[]騎乗術|　|[]生存術|　|[]医術|　|[]兵糧術|　|[]異形化|2|
|　|[]火術|　|[]砲術|　|[]潜伏術|　|[]毒術|　|[]鳥獣術|　|[]召喚術|3|
|　|[]水術|　|[]手裏剣術|　|[]遁走術|　|[]罠術|　|[]野戦術|　|[]死霊術|4|
|　|[]針術|　|[]手練|　|[]盗聴術|　|[]調査術|　|[]地の利|　|[]結界術|5|
|　|[]仕込み|　|[]身体操術|　|[]腹話術|　|[]詐術|　|[]意気|　|[]封術|6|
|　|[]衣装術|　|[]歩法|　|[]隠形術|　|[]対人術|　|[]用兵術|　|[]言霊術|7|
|　|[]縄術|　|[]走法|　|[]変装術|　|[]遊芸|　|[]記憶術|　|[]幻術|8|
|　|[]登術|　|[]飛術|　|[]香術|　|[]九ノ一の術|　|[]見敵術|　|[]瞳術|9|
|　|[]拷問術|　|[]骨法術|　|[]分身の術|　|[]傀儡の術|　|[]暗号術|　|[]千里眼の術|10|
|　|[]壊器術|　|[]刀術|　|[]隠蔽術|　|[]流言の術|　|[]伝達術|　|[]憑依術|11|
|　|[]掘削術|　|[]怪力|　|[]第六感|　|[]経済力|　|[]人脈|　|[]呪術|12|
`
    testElement.appendChild(DataElement.create('忍術', textMarkDown, { 'type': 'markdown' }, '忍術' + this.identifier));

    let textMarkDownNecro =
`|損傷|使用|タイミング|コスト|射程|効果|
|[]こぶし|[]|アクション|2|0|肉弾攻撃1|
|[]うで|[]|ジャッジ|1|0|支援1|`

    testElement.appendChild(DataElement.create('ネクロニカ的パーツ', textMarkDownNecro, { 'type': 'markdown' }, 'ネクロニカ的パーツ' + this.identifier));

    testElement.appendChild(DataElement.create('宝物への依存', '[][][][] 幼児退行', { 'type': 'markdown' }, 'ネクロニカ的未練' + this.identifier));

    this.overViewWidth = 800;
    this.overViewMaxHeight = 620;

    //TEST
    testElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('器用度', 24, {}, '器用度' + this.identifier));
    testElement.appendChild(DataElement.create('敏捷度', 24, {}, '敏捷度' + this.identifier));
    testElement.appendChild(DataElement.create('筋力', 24, {}, '筋力' + this.identifier));
    testElement.appendChild(DataElement.create('生命力', 24, {}, '生命力' + this.identifier));
    testElement.appendChild(DataElement.create('知力', 24, {}, '知力' + this.identifier));
    testElement.appendChild(DataElement.create('精神力', 24, {}, '精神力' + this.identifier));

    //TEST
    testElement = DataElement.create('戦闘特技', '', {}, '戦闘特技' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('Lv1', '全力攻撃', {}, 'Lv1' + this.identifier));
    testElement.appendChild(DataElement.create('Lv3', '武器習熟/ソード', {}, 'Lv3' + this.identifier));
    testElement.appendChild(DataElement.create('Lv5', '武器習熟/ソードⅡ', {}, 'Lv5' + this.identifier));
    testElement.appendChild(DataElement.create('Lv7', '頑強', {}, 'Lv7' + this.identifier));
    testElement.appendChild(DataElement.create('Lv9', '薙ぎ払い', {}, 'Lv9' + this.identifier));
    testElement.appendChild(DataElement.create('自動', '治癒適正', {}, '自動' + this.identifier));

    //
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let palette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    palette.setPalette(`チャットパレット入力例：
2d6+1 ダイスロール
１ｄ２０＋{敏捷}＋｛格闘｝　{name}の格闘！

自己バフ、リソース操作コマンド例：
&マッスルベアー/筋B+2/3
:MP-3
&マッスルベアー/筋B+2/3:MP-3

//敏捷=10+{敏捷A}
//敏捷A=10
//格闘＝１`);
    palette.initialize();
    this.appendChild(palette);

    this.addExtendData();
  }


  createTestGameDataElementExtendSample(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

//    let resourceElement: DataElement = DataElement.create('リソース', '', {}, 'リソース' + this.identifier);
//    let hpElement: DataElement = DataElement.create('HP', 200, { 'type': 'numberResource', 'currentValue': '200' }, 'HP_' + this.identifier);
//    let mpElement: DataElement = DataElement.create('MP', 100, { 'type': 'numberResource', 'currentValue': '100' }, 'MP_' + this.identifier);

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(altitudeElement);

//    this.detailDataElement.appendChild(resourceElement);
//    resourceElement.appendChild(hpElement);
//    resourceElement.appendChild(mpElement);

    //TEST
    let testElement: DataElement = DataElement.create('情報', '', {}, '情報' + this.identifier);
    this.detailDataElement.appendChild(testElement);
    testElement.appendChild(DataElement.create('説明',
`このキャラクターはキャラクターBの補助用のコマを作るときのサンプルです。
まず、このキャラクターはキャラクターシートの設定で「テーブルインベントリ非表示」「発言をしない」のチェックが入っています。
このように設定したキャラクターは「非表示」で足元のサークルの色が青に変わり、テーブルインベントリやリリィ追加機能のカウンターリモコンに表示されなくなります。
戦闘非参加キャラを立ち絵やコマのためにテーブルに出したい場合に使用できます。
また、プロフ等の追加情報を表示するためのコマ等、発言が不要な場合、「発言をしない」のチェックを入れることでチャットタブ等のリストに表示されなくなります。
部位数が10あるモンスターの駒を出したけど頭だけ喋ればいい、等の場合に使います。このチェックをONにするとコマの上のキャラ名が白地に黒文字に変わります。
次に、ポップアップのサイズ設定です。リリィではキャラクターシートからポップアップの横幅、最大縦幅を変更可能な様に拡張しています。
これで遊ぶ仲間が許してくれれば、数千文字のプロフィールを書いても大丈夫です。\n
なお、ポップアップする項目の設定は インベントリ＞設定＞表示項目 で行います。
リリィでは説明のため初期の項目に情報をに追加しているので、情報の子項目のこの文章である「説明」と「持ち物」が表示されています。
定義されていても持っていない項目は表示されないのでこのコマからはHPや能力値を削っています。
ゲームごとに使いやすいように使ってください。
`, { 'type': 'note' }, '説明' + this.identifier));
    testElement.appendChild(DataElement.create('持ち物',
`こういった文章も見やすくなります。
アイテム1：3個　効果〇〇
アイテム2：3個　効果パーティ内一人のHPをXXする
アイテム3：3個　効果敵一人の魔法を△する
アイテム4：3個　効果A
アイテム5：3個　効果B`,
 { 'type': 'note' }, '持ち物' + this.identifier));

    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let palette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    palette.setPalette(`チャットパレット入力例：
2d6+1 ダイスロール
１ｄ２０＋{敏捷}＋｛格闘｝　{name}の格闘！
//敏捷=10+{敏捷A}
//敏捷A=10
//格闘＝１`);
    palette.initialize();
    this.appendChild(palette);
    this.addExtendData();
  }
  
  createTestGameDataElementLineResourceA(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();
    this.overViewWidth = 300;
    this.overViewMaxHeight = 400;

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(altitudeElement);

    let apElement: DataElement = DataElement.create('AP', '', {}, 'AP' + this.identifier);
    let coreApElement: DataElement = DataElement.create('コアAP', 50, { 'type': 'lineResource', 'currentValue': '50', 'currentLineValue': '3', 'maxLineValue': '3', 'step': '10' }, 'コアAP_' + this.identifier);
    let rightApElement: DataElement = DataElement.create('右腕部AP', 50, { 'type': 'lineResource', 'currentValue': '50', 'currentLineValue': '2', 'maxLineValue': '2', 'step': '10' }, '右腕部AP_' + this.identifier);
    let leftApElement: DataElement = DataElement.create('左腕部AP', 50, { 'type': 'lineResource', 'currentValue': '50', 'currentLineValue': '2', 'maxLineValue': '2', 'step': '10' }, '左腕部AP_' + this.identifier);
    let paApElement: DataElement = DataElement.create('脚部AP', 40, { 'type': 'lineResource', 'currentValue': '40', 'currentLineValue': '3', 'maxLineValue': '3', 'step': '10' }, '脚部AP_' + this.identifier);

    this.detailDataElement.appendChild(apElement);
    apElement.appendChild(coreApElement);
    apElement.appendChild(rightApElement);
    apElement.appendChild(leftApElement);
    apElement.appendChild(paApElement);

    let bulletsElement: DataElement = DataElement.create('残弾数', '', {}, '残弾数' + this.identifier);
    let raBulletsElement: DataElement = DataElement.create('RA残弾数', 6, { 'type': 'lineResource', 'currentValue': '6', 'currentLineValue': '2', 'maxLineValue': '2' }, 'RA残弾数_' + this.identifier);
    let laBulletsElement: DataElement = DataElement.create('LA残弾数', 1, { 'type': 'lineResource', 'currentValue': '0', 'currentLineValue': '0', 'maxLineValue': '0' }, 'LA残弾数_' + this.identifier);
    let rbBulletsElement: DataElement = DataElement.create('RB残弾数', 4, { 'type': 'lineResource', 'currentValue': '4', 'currentLineValue': '4', 'maxLineValue': '4' }, 'RB残弾数_' + this.identifier);
    let lbBulletsElement: DataElement = DataElement.create('LB残弾数', 4, { 'type': 'lineResource', 'currentValue': '4', 'currentLineValue': '2', 'maxLineValue': '2' }, 'LB残弾数_' + this.identifier);

    this.detailDataElement.appendChild(bulletsElement);
    bulletsElement.appendChild(raBulletsElement);
    bulletsElement.appendChild(laBulletsElement);
    bulletsElement.appendChild(rbBulletsElement);
    bulletsElement.appendChild(lbBulletsElement);

    let testElement: DataElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    testElement.appendChild(DataElement.create('レベル', 10, {}, 'レベル' + this.identifier));
    testElement.appendChild(DataElement.create('対システム障害', 2, {}, '対システム障害' + this.identifier));
    testElement.appendChild(DataElement.create('サーチ', 1, {}, 'サーチ' + this.identifier));
    testElement.appendChild(DataElement.create('ハッキング', 1, {}, 'ハッキング' + this.identifier));
    testElement.appendChild(DataElement.create('マニューバ', 0, {}, 'マニューバ' + this.identifier));
    testElement.appendChild(DataElement.create('通常移動コスト', 3, {}, '通常移動コスト' + this.identifier));
    testElement.appendChild(DataElement.create('通常回避コスト', 2, {}, '通常回避コスト' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('コア防御性能', '', {}, 'コア防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('コア対弾防御', 0, {}, 'コア対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('コア対爆防御', 0, {}, 'コア対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('コア対E防御', 0, {}, 'コア対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('右腕部防御性能', '', {}, '右腕部防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('右腕部対弾防御', 0, {}, '右腕部対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('右腕部対爆防御', 0, {}, '右腕部対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('右腕部対E防御', 0, {}, '右腕部対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('左腕部防御性能', '', {}, '左腕部防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('左腕部対弾防御', 0, {}, '左腕部対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('左腕部対爆防御', 0, {}, '左腕部対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('左腕部対E防御', 0, {}, '左腕部対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('脚部防御性能', '', {}, '脚部防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('脚部対弾防御', 0, {}, '脚部対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('脚部対爆防御', 0, {}, '脚部対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('脚部対E防御', 0, {}, '脚部対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('ダメージ計算', '', {}, 'ダメージ計算' + this.identifier);
    testElement.appendChild(DataElement.create('攻撃属性', '爆', {}, '攻撃属性' + this.identifier));
    testElement.appendChild(DataElement.create('被弾Hit数', 3, {}, '被弾Hit数' + this.identifier));
    testElement.appendChild(DataElement.create('威力補正', -10, {}, '威力補正' + this.identifier));
    testElement.appendChild(DataElement.create('AP損害', 100, {'type': 'numberResource', 'currentValue': '0'}, 'AP損害' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    //
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let chatPalette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    chatPalette.setPalette(`◆行動リスト
◆　移動アクション
【通常移動】コスト：{通常移動コスト}⃣
【アサルトブースト移動】コスト：4⃣

◆　攻撃アクション（Alt+クリックで対象を選択）
◆　　RA
【RA:アサルトライフル（1Hit）】\\nレンジ：1　コスト：3⃣　◆ :RA残弾数-1\\n弾｜スナイプ　1 Hit　威力補正：+5\\n　&RAリロード/このターンRA使用不可/1
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=1 t:威力補正=5
【RA:アサルトライフル（2Hit）】\\nレンジ：1　コスト：3⃣4⃣　◆◆ :RA残弾数-2\\n弾｜スナイプ　2 Hit　威力補正：+5\\n　&RAリロード/このターンRA使用不可/1
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=2 t:威力補正=5
【RA:アサルトライフル（3Hit）】\\nレンジ：1　コスト：3⃣4⃣5⃣　◆◆◆ :RA残弾数-3\\n弾｜スナイプ　3 Hit　威力補正：+5\\n　&RAリロード/このターンRA使用不可/1
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=3 t:威力補正=5 

◆　　LA
【LA:パルスブレード（1Hit）】\\nレンジ：0　コスト：ゾロ2\\nE｜メレー　1 Hit　威力補正：0\\n　&LAリロード/このターンLA使用不可/1
　【ヒットレート付与】t:攻撃属性>E t:被弾Hit数=1 t:威力補正=0
【LA:パルスブレード（2Hit）】\\nレンジ：0　コスト：ゾロ3\\nE｜メレー　2 Hit　威力補正：0\\n　&LAリロード/このターンLA使用不可/1
　【ヒットレート付与】t:攻撃属性>E t:被弾Hit数=2 t:威力補正=0

◆　　RB
【RB:4連装ミサイル】\\nレンジ：2　コスト：7⃣　◆◆ :RB残弾数-2\\n爆｜ミサイル　2 Hit　威力補正：+5\\n　&RBリロード/このターンRB使用不可/1
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=2 t:威力補正=5

◆　　LB
【LB:小型2連双対ミサイル（レンジ1）】\\nレンジ：1　コスト：7⃣　◆◆ :RB残弾数-2\\n爆｜ミサイル　2 Hit　威力補正：+5\\n　&LBリロード/このターンLB使用不可/1
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=2 t:威力補正=5
【LB:小型2連双対ミサイル（レンジ2）】\\nレンジ：2　コスト：8⃣　◆◆ :RB残弾数-2\\n爆｜ミサイル　2 Hit　威力補正：+5\\n　&LBリロード/このターンLB使用不可/1
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=2 t:威力補正=5



◆被攻撃処理
１．相手のヒットレート付与後、任意回数の回避を行う
【通常回避】コスト：{通常回避コスト}⃣ :被弾Hit数-1
【クイックブースト回避】コスト：1⃣1⃣ :被弾Hit数-2

２．それ以上回避を行わない場合、AP損害を計算する
【AP損害計算】 :AP損害=({被弾Hit数}+({威力補正})/10U)*10-10L :AP損害+10

３．被弾する部位をランダムに決定する。
choice[1: コア, 2: コア, 3: 右腕部, 4: 左腕部, 5: 脚部, 6: 脚部]\\n【被弾部位決定】

４．被弾部位のAPを減少する
【コアAP損害】 :コアAP-({AP損害}-{コア対{攻撃属性}防御})Z
【右腕部AP損害】 :右腕部AP-({AP損害}-{右腕部対{攻撃属性}防御})Z
【左腕部AP損害】 :左腕部AP-({AP損害}-{左腕部対{攻撃属性}防御})Z
【PA_AP損害】 :脚部AP-({AP損害}-{脚部対{攻撃属性}防御})Z

５．AP損害によりLineを全損した場合、既定の処理を行う
&スタッガー/コア直撃+行動不可/1`);
    chatPalette.initialize();
    this.appendChild(chatPalette);

    let buffPalette: BuffPalette = new BuffPalette('BuffPalette_' + this.identifier);
    buffPalette.setPalette(`カメラ障害 ミサイル系アタック不可 1
ACS障害 AP損害10でスタッガー 1
スタッガー コア直撃+行動不可 1
コア直撃 コア確定Hit+防御無視 1`);
    buffPalette.initialize();
    this.appendChild(buffPalette);

    this.addExtendData();
  }

  createTestGameDataElementLineResourceB(name: string, size: number, imageIdentifier: string) {
    this.createDataElements();
    this.overViewWidth = 300;

    let nameElement: DataElement = DataElement.create('name', name, {}, 'name_' + this.identifier);
    let sizeElement: DataElement = DataElement.create('size', size, {}, 'size_' + this.identifier);
    let altitudeElement: DataElement = DataElement.create('altitude', 0, {}, 'altitude_' + this.identifier);

    if (this.imageDataElement.getFirstElementByName('imageIdentifier')) {
      this.imageDataElement.getFirstElementByName('imageIdentifier').value = imageIdentifier;
    }

    this.commonDataElement.appendChild(nameElement);
    this.commonDataElement.appendChild(sizeElement);
    this.commonDataElement.appendChild(altitudeElement);

    let apElement: DataElement = DataElement.create('AP', '', {}, 'AP' + this.identifier);
    let coreApElement: DataElement = DataElement.create('コアAP', 70, { 'type': 'lineResource', 'currentValue': '70', 'currentLineValue': '3', 'maxLineValue': '3', 'step': '10' }, 'コアAP_' + this.identifier);
    let rightApElement: DataElement = DataElement.create('右ﾌﾚｰﾑAP', 50, { 'type': 'lineResource', 'currentValue': '50', 'currentLineValue': '2', 'maxLineValue': '2', 'step': '10' }, '右ﾌﾚｰﾑAP_' + this.identifier);
    let leftApElement: DataElement = DataElement.create('左ﾌﾚｰﾑAP', 50, { 'type': 'lineResource', 'currentValue': '50', 'currentLineValue': '2', 'maxLineValue': '2', 'step': '10' }, '左ﾌﾚｰﾑAP_' + this.identifier);
    let paApElement: DataElement = DataElement.create('PA_AP', 60, { 'type': 'lineResource', 'currentValue': '60', 'currentLineValue': '1', 'maxLineValue': '1', 'step': '10' }, 'PA_AP_' + this.identifier);

    this.detailDataElement.appendChild(apElement);
    apElement.appendChild(coreApElement);
    apElement.appendChild(rightApElement);
    apElement.appendChild(leftApElement);
    apElement.appendChild(paApElement);

    let testElement: DataElement = DataElement.create('能力', '', {}, '能力' + this.identifier);
    testElement.appendChild(DataElement.create('レベル', 20, {}, 'レベル' + this.identifier));
    testElement.appendChild(DataElement.create('解析目標値', 11, {}, '解析目標値' + this.identifier));
    testElement.appendChild(DataElement.create('対システム障害値', 11, {}, '対システム障害値' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('コア防御性能', '', {}, 'コア防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('コア対弾防御', 10, {}, 'コア対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('コア対爆防御', 10, {}, 'コア対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('コア対E防御', 0, {}, 'コア対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('右ﾌﾚｰﾑ防御性能', '', {}, '右ﾌﾚｰﾑ防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('右ﾌﾚｰﾑ対弾防御', 10, {}, '右ﾌﾚｰﾑ対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('右ﾌﾚｰﾑ対爆防御', 10, {}, '右ﾌﾚｰﾑ対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('右ﾌﾚｰﾑ対E防御', 0, {}, '右ﾌﾚｰﾑ対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('左ﾌﾚｰﾑ防御性能', '', {}, '左ﾌﾚｰﾑ防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('左ﾌﾚｰﾑ対弾防御', 10, {}, '左ﾌﾚｰﾑ対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('左ﾌﾚｰﾑ対爆防御', 10, {}, '左ﾌﾚｰﾑ対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('左ﾌﾚｰﾑ対E防御', 0, {}, '左ﾌﾚｰﾑ対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('PA防御性能', '', {}, 'PA防御性能' + this.identifier);
    testElement.appendChild(DataElement.create('PA対弾防御', 10, {}, 'PA対弾防御' + this.identifier));
    testElement.appendChild(DataElement.create('PA対爆防御', 10, {}, 'PA対爆防御' + this.identifier));
    testElement.appendChild(DataElement.create('PA対E防御', 10, {}, 'PA対E防御' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    testElement = DataElement.create('ダメージ計算', '', {}, 'ダメージ計算' + this.identifier);
    testElement.appendChild(DataElement.create('攻撃属性', '爆', {}, '攻撃属性' + this.identifier));
    testElement.appendChild(DataElement.create('被弾Hit数', 3, {}, '被弾Hit数' + this.identifier));
    testElement.appendChild(DataElement.create('威力補正', -10, {}, '威力補正' + this.identifier));
    testElement.appendChild(DataElement.create('AP損害', 100, {'type': 'numberResource', 'currentValue': '0'}, 'AP損害' + this.identifier));
    this.detailDataElement.appendChild(testElement);

    //
    let domParser: DOMParser = new DOMParser();
    let gameCharacterXMLDocument: Document = domParser.parseFromString(this.rootDataElement.toXml(), 'application/xml');

    let chatPalette: ChatPalette = new ChatPalette('ChatPalette_' + this.identifier);
    chatPalette.setPalette(`◆行動リスト
【百五十六連装ミサイル（↑KQJ）】\\nレンジ：1-2　対象：ALL\\n爆｜ミサイル　2 Hit　威力補正：-10
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=2 t:威力補正=-10
【百五十六連装ミサイル（10~6）】\\nレンジ：1-2　対象：ALL\\n爆｜ミサイル　3 Hit　威力補正：-10
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=3 t:威力補正=-10
【百五十六連装ミサイル（5~A↓）】\\nレンジ：1-2　対象：ALL\\n爆｜ミサイル　4 Hit　威力補正：-10
　【ヒットレート付与】t:攻撃属性>爆 t:被弾Hit数=4 t:威力補正=-10

【三連ガトリング（↑KQJ）】\\nレンジ：1　対象：1\\n弾｜ガトリング　2 Hit　威力補正：+10
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=2 t:威力補正=10
【三連ガトリング（10~6）】\\nレンジ：1　対象：1\\n弾｜ガトリング　3 Hit　威力補正：+10
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=3 t:威力補正=10
【三連ガトリング（5~A↓）】\\nレンジ：1　対象：1\\n弾｜ガトリング　4 Hit　威力補正：+10
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=4 t:威力補正=10

【四連ショットガン（↑KQJ）】\\nレンジ：0　対象：1体\\n弾｜スプレッド　1 Hit　威力補正：+10
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=1 t:威力補正=10
【四連ショットガン（10~A↓）】\\nレンジ：0　対象：1体\\n弾｜スプレッド　2 Hit　威力補正：+10
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=2 t:威力補正=10

【可変式超高温バーナー（↑K~A↓）】\\nレンジ：0-1　対象：1エリア\\n弾｜メレー　2 Hit　威力補正：0
　【ヒットレート付与】t:攻撃属性>弾 t:被弾Hit数=2 t:威力補正=0

【パルスアーマー再展開】 :PA_AP={PA_AP^} :PA_AP~={PA_AP~^}



◆被攻撃処理
１．相手のヒットレート付与後、任意回数の回避を行う
【回避】 :被弾Hit数-1

２．それ以上回避を行わない場合、AP損害を計算する
【AP損害計算】 :AP損害=({被弾Hit数}+({威力補正})/10U)*10-10L :AP損害+10

３．被弾する部位をランダムに決定する。（被弾部位決定に別の条件がある場合スキップ）
choice[1: コア, 2: コア, 3: 右ﾌﾚｰﾑ, 4: 右ﾌﾚｰﾑ, 5: 左ﾌﾚｰﾑ, 6: 左ﾌﾚｰﾑ]\\n【被弾部位決定】

４．被弾部位のAPを減少する
【コアAP損害】 :コアAP-({AP損害}-{コア対{攻撃属性}防御})Z
【右ﾌﾚｰﾑAP損害】 :右ﾌﾚｰﾑAP-({AP損害}-{右ﾌﾚｰﾑ対{攻撃属性}防御})Z
【左ﾌﾚｰﾑAP損害】 :左ﾌﾚｰﾑAP-({AP損害}-{左ﾌﾚｰﾑ対{攻撃属性}防御})Z
【PA_AP損害】 :PA_AP-({AP損害}-{PA対{攻撃属性}防御})Z

５．AP損害によりLineを全損した場合、既定の処理を行う
【パルスアーマー消失】 &スタッガー/コア直撃+行動不可/1:PA_AP=0 :PA_AP~=0
&スタッガー/コア直撃+行動不可/1`);
    chatPalette.initialize();
    this.appendChild(chatPalette);

    let buffPalette: BuffPalette = new BuffPalette('BuffPalette_' + this.identifier);
    buffPalette.setPalette(`カメラ障害 ミサイル系アタック不可 1
ACS障害 AP損害10でスタッガー 1
スタッガー コア直撃+行動不可 1
コア直撃 コア確定Hit+防御無視 1`);
    buffPalette.initialize();
    this.appendChild(buffPalette);

    this.addExtendData();
  }

  deleteBuff(name: string):boolean{
    if (this.buffDataElement.children){
      const dataElm = this.buffDataElement.children[0];
      const data = (dataElm as DataElement).getFirstElementByName(name);
      if(!data)return false;
      data.destroy();
      return true;
    }
    return false;
  }

  decreaseBuffRound(){
    if (this.buffDataElement.children){
      const dataElm = this.buffDataElement.children[0];
      for (const data  of dataElm.children){
        let oldNumS = '';
        let sum: number;
        oldNumS = (data.value as string);
        sum = parseInt(oldNumS);
        sum = sum - 1;
        data.value = sum;
      }
    }
  }

  increaseBuffRound(){
    if (this.buffDataElement.children){
      const dataElm = this.buffDataElement.children[0];
      for (const data  of dataElm.children){
        let oldNumS = '';
        let sum: number;
        oldNumS = (data.value as string);
        sum = parseInt(oldNumS);
        sum = sum + 1;
        data.value = sum;
      }
    }
  }

  deleteZeroRoundBuff(){
    if (this.buffDataElement.children){
      const dataElm = this.buffDataElement.children[0];
      for (const data  of dataElm.children){
        let oldNumS = '';
        let num: number;
        oldNumS = (data.value as string);
        num = parseInt(oldNumS);
        if ( num <= 0){
        data.destroy();
        }
      }
    }
  }

  addBuffRound(name: string, _info?: string , _round?: number){
    let info = '';
    let round = 3;
    if(_info ){
      info = _info;
    }
    if(_round != null){
      round = _round;
    }
    if(this.buffDataElement.children){
      let dataElm = this.buffDataElement.children[0];
      let data = this.buffDataElement.getFirstElementByName( name );
      if ( data ){
        data.value = round;
        data.currentValue = info;
      }else{
        dataElm.appendChild(DataElement.create(name, round , { type: 'numberResource', currentValue: info }, ));
      }
    }
  }


  chkChangeStatusName(name: string): boolean{
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return false;
    if(data.type == 'numberResource'){ return true;}
    if(data.type == 'lineResource'){ return true;}
    if(data.type == ''){ return true;}
    if(data.type == 'note'){ return true;}
    return false;
  }

  chkChangeStatus(name: string, nowOrMax: string, isLine ?: boolean): boolean{
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return false;
    if(data.type == 'numberResource'){
      if((nowOrMax == 'now' || nowOrMax =='max') && !isLine){
        return true;
      }
    }else if(data.type == 'lineResource'){
      if(nowOrMax == 'now' || nowOrMax =='max'){
        return true;
      }
    }else if(data.type == ''){
      if(nowOrMax == 'now'){
        return true;
      }
    }else if(data.type == 'note'){
      if(nowOrMax == 'now'){
        return true;
      }
    }
    return false;
  }

  getStatusType(name: string, nowOrMax: string, isLine ?: boolean): string{
    let type = '';
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return null;
    
    if(data.type == 'numberResource'){
      if(nowOrMax == 'now' && !isLine){
        type = 'currentValue';
      }else if(nowOrMax == 'max' && !isLine){
        type = 'value';
      }else{
        return null;
      }
    }else if(data.type == 'lineResource'){
      if(isLine){
        if(nowOrMax == 'now'){
          type = 'currentLineValue';
        }else if(nowOrMax == 'max'){
          type = 'maxLineValue';
        }
      }else{
        if(nowOrMax == 'now'){
          type = 'currentValue';
        }else if(nowOrMax == 'max'){
          type = 'value';
        }
      }
    }else if(data.type == ''){
      if(nowOrMax == 'now' && !isLine){
        type = 'value';
      }else{
        return null;
      }
    }else{
      return null;
    }
    return type;
  }

  getStatusTextType(name: string): string{
    let type = '';
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return null;
    
    if(data.type == 'numberResource'){
      type = 'currentValue';
    }else{
      type = 'value';
    }
    return type;
  }

  getStatusValue(name: string, nowOrMax: string, isLine ?: boolean): number{
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return null;
    let type = this.getStatusType(name, nowOrMax, isLine);
    if(type == null) return null;

    let oldNumS = '';
    let newNum: number;
    let sum: number;
    console.log('getStatusValue type' + type);

    if ( type == 'value') {
      oldNumS = (data.value as string);
    }
    if ( type == 'currentValue'){
      oldNumS = (data.currentValue as string);
    }
    if ( type == 'maxLineValue') {
      oldNumS = String(data.maxLineValue);
    }
    if ( type == 'currentLineValue'){
      oldNumS = String(data.currentLineValue);
    }
    return parseInt(oldNumS);
  }

  setStatusValue(name: string, nowOrMax: string, setValue: number, isLine ?: boolean): boolean{
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return false;
    let type = this.getStatusType(name, nowOrMax, isLine);
    if(type == null) return false;

    if ( type == 'value') {
      data.value = setValue;
    }
    if ( type == 'currentValue'){
      data.currentValue = setValue;
    }
    if ( type == 'currentLineValue'){
      data.currentLineValue = setValue;
    }
    if ( type == 'maxLineValue') {
      data.maxLineValue = setValue;
    }
    return true;
  }

  setStatusText(name: string, text: string): boolean{
    const data = this.detailDataElement.getFirstElementByName(name);
    if(!data)return false;
    let type = this.getStatusTextType(name);
    if(type == null) return false;
    if ( type == 'value') {
      data.value = text;
    }
    if ( type == 'currentValue'){
      data.currentValue = text;
    }
    return true;
  }


  changeStatusValue(name: string, nowOrMax: string, addValue: number, limitMin ?: boolean ,limitMax ?: boolean, isLine ?: boolean ): string{
    const data = this.detailDataElement.getFirstElementByName(name);
    let text = '';
    let type = this.getStatusType(name, nowOrMax, isLine);
    if(!data)return text;

    let newNum: number;
    let oldNum :number = this.getStatusValue(name,nowOrMax,isLine);
    if(oldNum == null) return text;
    let sum = oldNum + addValue;

    let maxRecoveryMess = '';
    if ( type == 'value') {
      if ( limitMin && sum <= 0 && limitMin){
        maxRecoveryMess = '(最小)';
        sum = 0;
      }
      this.setStatusValue(name, nowOrMax, sum);
    }
    if ( type == 'currentValue'){
      if ( sum >= data.value && limitMax){
        maxRecoveryMess = '(最大)';
        sum = this.getStatusValue(name,'max');
      }
      if ( limitMin && sum <= 0 && limitMin){
        maxRecoveryMess = '(最小)';
        sum = 0;
      }
      this.setStatusValue(name, nowOrMax, sum);
    }
    if ( type == 'maxLineValue') {
      if ( limitMin && sum <= 0 && limitMin){
        maxRecoveryMess = '(最小)';
        sum = 0;
      }
      this.setStatusValue(name, nowOrMax, sum, true);
    }
    if ( type == 'currentLineValue'){
      if ( sum >= data.maxLineValue && limitMax){
        maxRecoveryMess = '(最大)';
        sum = this.getStatusValue(name,'max',true);
      }
      if ( limitMin && sum <= 0 && limitMin){
        maxRecoveryMess = '(最小)';
        sum = 0;
      }
      this.setStatusValue(name, nowOrMax, sum, true);
    }
    text = text + '[' + this.name + ' ' + oldNum + '>' + sum + maxRecoveryMess + '] ';
    return text;
  }

}
