# ユドナック

このプロジェクトはユドナリウムリリィをさらにカスタマイズするために分岐し作成しました

ユドナリウム（Udonarium）はWebブラウザで動作するボードゲームオンラインセッション支援ツールです。
本家ユドナリウムの開発範囲は本家に著作権が有り、
リリィ以降追加されたコードは私空岸綴、リリィ作者円柱(entyu)様あるいはその組み込んだ各ソース部分の作者に著作権があります。
いずれにせよライセンスは本家のMITを引き継ぎます。
名前混同を避けるため本開発版名称はudonac　ユドナックとします。

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/TK11235/udonarium/blob/master/LICENSE)

# 実装済み項目
■Line付きリソースの追加（複数ゲージHP等の表現）

　□およびその操作コマンド（:name~、:name~^）

■Line付きリソースの副産物として、通常リソースへの離散化ステップ変更機能の追加

■インベントリ表示項目設定をワイルドカードに対応（*、?）

# 実装検討項目
■作成と同時に振られ、後から出目を変更できないダイスシンボル（振り忘れ・誤変更防止）

　□ダイスをコストとして消費するシステムを想定し、上記シンボルを削除すると同時にチャットに消費を宣言する処理

■上記シンボルを簡単な操作で生成・個数管理できる親オブジェクトの追加

　□最大所持数を保持しそれ以上生成しない・個人ごとのパラメータに合わせた一定個数の生成など

<br/><br/>

---------以下本家からの一部抜粋です---------------

https://github.com/TK11235/udonarium

## サーバ設置
ユーザ自身でWebサーバを用意し、そのサーバにユドナックを設置して利用することができます。  
リリィv1.05.0からYouTubeカットイン機能があります。YouTubeの規約もご確認ください。




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
自力コンパイルするかたへｖ1.02.0より--prodで自動生成される 3rdpartylicenses.txt にソフト内リンクが貼られるようにしてあります。
つけないと生成されずlicensesへのリンクが切れるのでご注意ください。


