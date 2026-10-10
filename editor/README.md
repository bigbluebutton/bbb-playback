# BBB raw録画エディター

`hiroshisuga/bbb-playback` の `refactor/external-video-hooks` ブランチをベースにした、管理者向け編集画面とRuby APIです。BBB 4.0を主対象として、BBB 3.0で共通する録画イベントも読み込みます。実サーバのraw録画を使った確認は、導入前に別コピーで行ってください。

## 編集できる内容

- 会議全体の音声、波形、スライドとTldraw描画、カメラ、画面共有、チャット・外部動画イベントを表示。
- 録画OFFの時間も含む時間軸上で、録画に残す区間とピー音区間を指定。録画に残す区間は最低1つ必要です。ドラッグ、時刻入力、元に戻す・やり直すに対応。
- `RecordStatusEvent` だけを置き換え、他の会議イベントを保持。保存ごとに元の `events.xml` をバックアップ。
- ピー音区間に重なるマイク音声と画面共有内の音声を加工。重なった音声をすべて消し、一つの音声素材に1kHzの置換音を入れる。映像ストリームは再エンコードせずコピー。
- 下書きは専用の状態ディレクトリへ保存。下書き保存ではrawを変更しない。
- 一覧は会議IDの開始日時に基づく過去14日。rawがない会議は警告する。保持期間や削除処理は変更しない。

このアプリは `bbb-record`、rebuild、publishを実行しません。公開済み録画も保存直後には変わりません。管理者が既存の運用手順で再構築してください。

## 保存方式

```
/var/bigbluebutton/recording/raw/<meeting-id>/
  events.xml                          # 新しい録画区間・素材参照
  events.xml.bak.<UTC>.<random>        # 保存前のXMLの完全コピー
  audio/<original-name>               # 元ファイルはそのまま
  audio/bbb-editor-<random>-<name>     # ピー音入りの新規素材
  deskshare/<original-name>            # 元の映像・音声
  deskshare/bbb-editor-<random>-<name>  # 映像コピー＋音声置換

/var/lib/bbb-recording-editor/<meeting-id>/
  original-events.xml                 # 初回編集の基準XML
  original-media/audio/...            # 加工した元素材のバックアップ
  original-media/deskshare/...
  draft.json                         # 下書き
  saved.json                         # 最新の編集内容
  edit-<UTC>-<random>.json             # 保存履歴・参照先・バックアップ先
  preview/<key>/audio.webm            # 会議全体の混合音声
  preview/<key>/peaks.json            # 波形
```

音声生成と検証が終わってから、生成素材をraw内に移動しXMLを一時ファイルからrenameして置き換えます。後からピー音区間を変更・削除するときも、初回の元XML・元素材を基準に再生成するため、前回のピー音は累積しません。ピー音を全て削除すると元の素材参照に戻ります。

XMLは読み込み時のSHA-256と保存直前のSHA-256を比較します。外部でXMLが変わっていた場合は保存を拒否します。保持期限のロックではなく、編集中の上書き競合を検知するためのものです。

生成素材は元音声のコンテナに合わせて音声を再エンコードします。圧縮音声ではピー音区間外も元とバイト単位で一致するとは限りません。元ファイルとバックアップは残ります。境界には短いフェードを入れます。無音で素材が存在しない時間には保存後のピー音も入りません。

## BBBサーバへの設置

例はUbuntu、配置先 `/opt/bbb-recording-editor`、サービス実行ユーザー `bigbluebutton`、HTTPSの既存Nginxを前提にしています。既存Playbackの配信先には上書きしません。

1. コード一式ZIPを `/opt` に展開するか、公開済みの作業ブランチを専用ディレクトリに取得する。

   ZIPの場合:

   ```bash
   sudo unzip bbb-recording-editor.zip -d /opt
   cd /opt/bbb-recording-editor
   npm ci
   npm run build:editor
   ```

   ブランチがGitHubへ公開された後は、次の方法でも取得できます。

   ```bash
   git clone --branch feat/raw-recording-editor https://github.com/hiroshisuga/bbb-playback.git /opt/bbb-recording-editor
   cd /opt/bbb-recording-editor
   npm ci
   npm run build:editor
   ```

   Node.js 20以上が必要です。編集画面は `build-editor/` に生成されます。従来のPlaybackは `npm run build` で従来どおりビルドできます。

2. Ruby依存関係とFFmpegを用意する。

   ```bash
   sudo apt-get install ruby ruby-nokogiri ruby-webrick ruby-minitest ffmpeg apache2-utils
   sudo install -d -o bigbluebutton -g bigbluebutton -m 0700 /var/lib/bbb-recording-editor
   ```

   Ruby 3.0以上を想定。OSパッケージの代わりに `editor/Gemfile` からBundlerで導入しても構いません（その場合はサービスも `bundle exec ruby` に合わせてください）。実行ユーザーにはraw XMLの書き換えと素材ディレクトリへの書き込み権限が必要です。

3. サービス設定を配置する。

   ```bash
   sudo install -m 0600 editor/deploy/bbb-recording-editor.env.example /etc/bbb-recording-editor.env
   sudo install -m 0644 editor/deploy/bbb-recording-editor.service /etc/systemd/system/bbb-recording-editor.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now bbb-recording-editor
   ```

4. 管理者専用の認証を設定する。

   ```bash
   sudo htpasswd -c /etc/nginx/bbb-recording-editor.htpasswd admin
   ```

   `editor/deploy/nginx.conf` のlocationを、既存BBBのHTTPS `server` ブロックに追加してください。編集GUI、API、XML、raw素材、プレビューの全てに認証がかかります。サーバは `127.0.0.1:8099` にだけbindします。BBB会議内の「モデレーター」権限やGreenlightアカウントとは別の、管理者専用認証です。

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. `https://<BBB-host>/recording-editor/` を開く。まず別コピーのrawで、再生位置・スライド・音声境界・保存後の再構築結果を確認してください。

`BBB_EDITOR_RAW_ROOT`、`BBB_EDITOR_STATE_ROOT`、`BBB_EDITOR_PUBLISHED_ROOT`、`BBB_EDITOR_BUILD_ROOT`、`BBB_EDITOR_PORT` は環境変数で変更できます。URLは標準 `/recording-editor`。変更する場合はサーバの `BBB_EDITOR_PREFIX` と、ビルド時の `PUBLIC_URL` / `REACT_APP_EDITOR_PREFIX`、Nginx locationを揃えてください。

## 開発とテスト

```bash
ruby editor/test/recording_editor_test.rb
ruby editor/test/server_test.rb
CI=true npm test -- --watchAll=false --runInBand
npm run build:editor
```

音声テストは合成したWAV、映像＋AAC、OpusをFFmpegで生成します。元素材の保持、全音声の置換、映像パケットの保持、XMLイベントと時計、空区間、競合、危険な参照、認証、Range、保存ジョブを検証します。

実録画を使わずに動かす例:

```bash
ruby editor/test/make_demo.rb /tmp/bbb-editor-demo
BBB_EDITOR_RAW_ROOT=/tmp/bbb-editor-demo/raw \
BBB_EDITOR_STATE_ROOT=/tmp/bbb-editor-demo/state \
BBB_EDITOR_PUBLISHED_ROOT=/tmp/bbb-editor-demo/published \
ruby editor/server.rb
# http://127.0.0.1:8099/recording-editor/
```

開発サーバの場合は、APIを先に起動し、`BBB_EDITOR_PROXY=http://127.0.0.1:8099 npm start` で起動後 `http://localhost:3000/?editor=1` を開きます。開発用URLで使う場合、OriginとHostを一致させるため、プロキシの `changeOrigin` は有効にしません。

## 現時点の制約と復旧

BBBの録画処理には、RecordStatusEventの時刻を開始・停止のペアとして扱う経路があります。falseイベントだけを保存すると全区間が録画される可能性があるため、録画に残す区間が0個の場合はXMLへの保存を拒否します（下書きは可能）。

- 表示はrawの素材・イベントから構成します。公開済みPlaybackのレイアウトを完全に再現するものではありません。最大4つの同時カメラを表示。Tldrawの未対応形状は警告して省略しますが、保存XMLのイベントは保持します。
- BBB 3.x/4.xの `StartRecordingEvent` / `AudioTrackPublishedEvent`、WebRTCカメラ・画面共有、旧Deskshareイベントを扱います。イベントの時刻対応が不明な素材は警告します。時刻不明の音声がある場合や指定区間に不足・破損した音声がある場合は、ピー音の保存を拒否します。XMLの区間編集は可能です。
- ブラウザが再生できないFLV等の映像は表示エラーを出します。変換プレビューは未実装です。未知のイベント形式、音声が複数トラックの素材、同一音声を複数時刻に使う録画は加工を拒否します。
- 非ゼロPTS・大きな欠落や破損を含む特殊な素材は、実データで同期確認が必要です。加工後の長さが元と150ms以上違う場合は、XML更新前に失敗させます。
- 外部動画サービスの音声はrawにないため、ピー音保存の対象外です。ブラウザ試聴は会議の混合音声に対する仮処理です。保存後にBBBが混合する素材に存在しない区間では試聴と差が出ます。
- ジョブは一つずつ処理し、状態はサーバのメモリ内です。サーバ再起動後は会議を読み直してください。録画処理・raw削除中の会議は、素材が安定してから編集してください。
- 元音声バックアップ、生成素材、プレビュー、編集履歴はこのアプリでは自動削除しません。容量管理と管理者だけが読める権限は設置先で管理してください。
- XML置き換えと履歴保存は複数ファイルの操作です。停止やディスク不足で中断した場合は、`edit-*.json`、XMLバックアップ、現在の参照先を確認してください。自動再構築はしません。

元に戻す場合はサービスを停止し、該当する `events.xml.bak.*` を `events.xml` に戻してください。元素材はrawに残ります。外部でXMLを復旧・変更した後に編集を再開する場合は、その会議の状態ディレクトリも削除せず別名で退避して、新しい編集履歴を始めます。
