# ユドナリウムリリィ

このプロジェクトはユドナリウムをカスタマイズするために分岐し作成しました

ユドナリウム（Udonarium）はWebブラウザで動作するボードゲームオンラインセッション支援ツールです。
本家ユドナリウムの開発範囲は本家に著作権が有り、
追加したコードは私円柱(entyu)あるいは私が組み込んだソースの作者に著作権があります。
いずれにせよライセンスは本家のMITを引き継ぎます。
名前混同を避けるため本開発版名称はudonarium_lily　ユドナリウムリリィとします。

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TK11235/udonarium/blob/master/LICENSE)


### 立ち絵
### カウンターリモコン
### バフデバフ表示
バフかけようのウィンドウを用意し、そこから各キャラクターに補助魔法をかけます。
かかっている補助はキャラクターコマ丈夫に表示されます。

### 開発中画面

画像にタグがつけられるようになりました

![lily_sample](https://user-images.githubusercontent.com/61339319/95869259-26b41380-0da6-11eb-96fa-1e6c6858c531.png)


---------以下本家からの一部抜粋です---------------
https://github.com/TK11235/udonarium

## サーバ設置
ユーザ自身でWebサーバを用意し、そのサーバにユドナリウムリリィを設置して利用することができます。  

1. リリース版　https://github.com/entyu/udonarium_lily/releases/download/%EF%BD%961.00.1/udonarium_lily-v1.00.1.zip　をダウンロードして解凍し、Webサーバに配置してください。  
**開発者向けのソースコードをダウンロードしないように注意して下さい。**
1. [SkyWay](https://webrtc.ecl.ntt.com/)のAPIキーを取得し、APIキー情報を`assets/config.yaml`に記述します。
1. サーバに配置したユドナリウムの`index.html`にアクセスして動作することを確認してみてください。  
ユドナリウムリリィはサーバーサイドの処理を持たないので、CGIやデータベースは必要はありません。

#### SkyWay
このアプリケーションは通信処理にWebRTCを使用しています。  
WebRTC向けのシグナリングサーバとして[SkyWay](https://webrtc.ecl.ntt.com/)を利用しているため、動作確認のためにSkyWayのAPIキーが必要です。
取得したAPIキーの情報は`src/assets/config.yaml`に記述します。

#### そのほか難しいこと
本家と同じなので本家の udonarium の説明を参照してください。


