# BigBlueButton raw録画エディター

`hiroshisuga/bbb-playback` の `refactor/external-video-hooks` ブランチをベースにした、管理者向け編集画面とRuby APIです。BBB 4.0を主対象として、BBB 3.0で共通する録画イベントも読み込みます。実サーバのraw録画を使った確認は、導入前に別コピーで行ってください。

## 編集できる内容

- 会議全体の時間軸上に、rawに保存されている音声、波形、スライドとTldraw描画、カメラ、画面共有、チャット・外部動画イベントを表示。
- 録画OFFの時間も含む時間軸上で、録画に残す区間とピー音区間を指定。録画に残す区間は最低1つ必要です。ドラッグ、時刻入力、元に戻す・やり直すに対応。
- `RecordStatusEvent` だけを置き換え、他の会議イベントを保持。保存ごとに元の `events.xml` をバックアップ。
- ピー音区間に重なるマイク音声と画面共有内の音声を加工。重なった音声をすべて消し、一つの音声素材に1kHzの置換音を入れる。映像ストリームは再エンコードせずコピー。
- 下書きは専用の状態ディレクトリへ保存。下書き保存ではrawを変更しない。
- 一覧は会議IDの開始日時に基づく過去14日。rawがない会議は警告する。保持期間や削除処理は変更しない。

このアプリは `bbb-record`、rebuild、publishを実行しません。公開済み録画も保存直後には変わりません。管理者が既存の運用手順で再構築してください。

## 表示言語

ヘッダーの言語ドロップダウンで **日本語／English** を選択できます。初期言語はURLの `?locale=ja` / `?locale=en`、このエディターで前回選んだ言語、ブラウザの言語設定の順に決めます。対応していない言語は英語にフォールバックします。選択した言語はブラウザのlocalStorageに保存します。保存が禁止されているブラウザでも、その画面内では切り替えられます。

切り替えにページの再読み込みは不要です。選択中の会議、一覧の絞り込み、未保存の録画・ピー音区間、元に戻す履歴、再生位置は保持します。画面内のボタン、状態、警告、保存確認、時刻入力のラベルなどを切り替えます。会議名、チャット、ユーザーID、ファイル名、元のイベントは翻訳しません。

翻訳は `src/components/recording-editor/locales/ja.json` と `en.json` に分離しています。APIの既存の診断メッセージは `diagnostics.en.json` で画面表示時に英訳するため、サーバ側のログ・APIレスポンスは変更しません。FFmpegやOSなどが返す詳細なエラー本文は元のまま表示します。言語の追加時は同じメッセージIDのカタログと診断文の翻訳を用意し、`i18n.js` の対応言語・フォールバック処理に登録してください。通常のPlaybackの言語選択とは独立しています。

## 会議リストの状態表示と絞り込み

左側の一覧には、録画区間の有無と、BBBでの公開状態を別々のバッジで表示します。「録画区間あり」は現在のraw `events.xml` に有効な `RecordStatusEvent` の区間があるという意味で、公開済みという意味ではありません。

| 表示 | 判定・意味 |
| --- | --- |
| 録画区間あり／録画区間なし | raw XMLの録画開始・停止から判定。録画ボタンを使っていない会議は「録画区間なし」。 |
| 区間不明 | raw XMLがない、または読み込めないため録画区間を判定できない。 |
| 公開／非公開 | BBBのpublished／unpublished側の `metadata.xml` の状態から判定。「非公開」はBBBのunpublishを指す。 |
| 未生成 | 公開・非公開・処理用の録画ディレクトリと処理失敗マーカーが見つからない。 |
| 処理中 | process側のメタデータがprocessing、またはprocessed（publish待ち）。 |
| 不明 | メタデータの不足・破損・矛盾、処理失敗などで公開状態を確認できない。理由を警告表示する。 |
| rawなし | raw XMLがない、または読み込めない。公開状態とは独立して表示する。 |

「公開／非公開」はBBBの録画状態です。Greenlightで録画を一覧に載せるかどうかなど、Greenlight独自の表示設定は判定しません。「処理中」はファイル上の状態であり、実行中のワーカーやRedisキューを監視するものではありません。処理ディレクトリ作成前のキュー待ちは「未生成」に見える場合があります。

各行に「会議」と「録画区間」の長さを表示します。会議長はrawのイベント全体の時間差、録画区間長は有効な区間の合計です。rawがない場合はメタデータの会議長を利用し、区間長が分からなければ「—」を表示します。録画ボタン未使用の会議をエディターで開くと会議全体を編集候補として提示しますが、一覧で録画済みとみなすことはありません。raw保存後は一覧を更新します。表示する区間長は編集後のXMLに基づくため、管理者が再構築するまで公開済みPlaybackの長さとは異なる場合があります。

上部の選択欄で「すべて／公開／非公開／未生成／処理中／録画区間なし／rawなし／状態不明」を絞り込めます。各選択肢には該当件数を表示し、日時の新しい順を保ちます。絞り込みで選択中の会議が一覧から消えても、右側の編集画面は維持します。外部でpublish／unpublishなどを行った後は「更新」を押してください。

標準の参照先は次のとおりです。独自の保存先を使う場合は `/etc/bbb-recording-editor.env` に設定してください。既存の設定ファイルに追記しなくても標準パスは有効です。

| 環境変数 | 標準の参照先 |
| --- | --- |
| `BBB_EDITOR_PUBLISHED_ROOT` | `/var/bigbluebutton/published/presentation` |
| `BBB_EDITOR_UNPUBLISHED_ROOT` | `/var/bigbluebutton/unpublished/presentation` |
| `BBB_EDITOR_PROCESS_ROOT` | `/var/bigbluebutton/recording/process/presentation` |
| `BBB_EDITOR_STATUS_ROOT` | `/var/bigbluebutton/recording/status` |

processとstatusの既定パスは `BBB_EDITOR_RAW_ROOT` の親ディレクトリから求めます。上表は標準のraw保存先の場合です。

## 録画OFF中のメディアについて

BBB 2.6.9以降（3.0／4.0を含む）の標準設定は `recordFullDurationMedia=false` です。音声・カメラ・画面共有のメディアは、会議内で録画がONになっている区間だけ保存されます。会議全体のイベントが `events.xml` に残っていても、録画OFF中のメディアがrawに存在するとは限りません。14日間のraw保持期間も、保存されなかったメディアを復元できるという意味ではありません。

このエディターで録画区間を広げても、保存されていない音声・映像は復元できません。録画OFF中のメディアも後から利用するには、会議の作成時に `record=true` と `recordFullDurationMedia=true` が有効になっている必要があります。サーバ側の既定値は `/etc/bigbluebutton/bbb-web.properties`、会議ごとの値はcreate APIで設定できます。設定を後から変更しても、過去の会議には失われたメディアを追加できません。このアプリはBBBの収録設定を変更しません。

詳細は [BBBの録画区間編集に関する公式説明](https://docs.bigbluebutton.org/development/recording/#how-do-i-change-the-startstop-recording-marks) を参照してください。

## 複数ウェブカムの表示と編集

- 再生位置が各素材の開始時刻以上・終了時刻未満にあり、素材調査でエラーがなく映像トラックが存在するカメラを表示候補にします。同時表示は最大4本で、開始イベントの時刻順に先頭4本を選びます。
- 同時に5本以上ある場合、5本目以降はプレビューに表示しません。表示中の映像が終了すると、その時点の候補から再び先頭4本を選びます。表示対象の手動選択、ページ切替、非表示カメラ数の通知は未実装です。右側ペーンは縦にスクロールできますが、5本目以降を見るためのスクロールではありません。
- 同一参加者の複数カメラも、それぞれ別の素材として表示枠を使います。管理者本人・発表者・発言者を優先したり、参加者ごとに1本へまとめたりする処理はありません。ラベルはイベント内のユーザーIDで、取得できなければ「カメラ」と表示します。参加者名への変換は未実装です。
- タイムラインには全カメラ素材を1本の「カメラ」トラックに並べます。同時刻の区間は重なり、後に描かれた区間が前の区間を隠すことがあります。参加者別・カメラ別のトラック分割は未実装です。
- 映像はブラウザがrawファイルを直接再生し、会議の再生位置・再生速度に同期させます。各映像はミュートし、音声は別途生成した会議音声を使います。ブラウザが再生できない映像は表示エラーになります。その映像の代わりに5本目以降のカメラを自動選択する処理はありません。
- ウェブカムのプレビュー生成でサーバが映像を再エンコードすることはありません。素材数が多いと初回のファイル調査に時間がかかる場合があり、同時再生する映像の解像度等によってブラウザの負荷も増えます。
- **最大4本の制限はプレビュー表示だけです。** 録画区間は会議全体に共通で、非表示のカメラ素材・イベントも保存時に除外・削除しません。ピー音加工の対象はマイク音声と画面共有内の音声で、ウェブカム映像は変更しません。特定の参加者・カメラだけを録画から除外する機能はありません。

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

例はUbuntu、配置先 `/opt/bbb-recording-editor`、サービス実行ユーザー `bigbluebutton`、既存BBBのNginxを前提にしています。公開URLはHTTPSです。以下の相対パスを使うコマンドは、リポジトリのルート `/opt/bbb-recording-editor` で実行してください。既存Playbackの配信先には上書きしません。

1. コード一式ZIPを `/opt` に展開するか、公開済みの作業ブランチを専用ディレクトリに取得する。

   ZIPの場合:

   ```bash
   sudo unzip bbb-recording-editor.zip -d /opt
   cd /opt/bbb-recording-editor
   npm ci
   npm run build:editor
   ```

   GitHubのブランチから取得する場合:

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

   `htpasswd` コマンドは `apache2-utils` パッケージに含まれます。`apt install htpasswd` では導入できません。`ruby-minitest` はテスト用です。

   **aptがカスタムBBBパッケージの依存関係で失敗する場合は、「aptが使えない場合」を先に参照してください。** 依存ライブラリが未導入のままサービスを起動すると、NokogiriのLoadErrorなどで停止します。

   サービスと同じユーザー・Rubyで、依存ライブラリを読み込めることを確認します。

   ```bash
   sudo -u bigbluebutton /usr/bin/ruby -e \
     'require "nokogiri"; require "webrick"; puts "OK"'
   ```

   `OK` が表示されてから次へ進んでください。Ruby 3.0以上を想定。OSパッケージの代わりに `editor/Gemfile` からBundlerで導入しても構いません（その場合はサービスも `bundle exec ruby` に合わせてください）。実行ユーザーにはraw XMLの書き換えと素材ディレクトリへの書き込み権限が必要です。

3. サービス設定を配置する。

   ```bash
   sudo install -m 0600 editor/deploy/bbb-recording-editor.env.example /etc/bbb-recording-editor.env
   sudo install -m 0644 editor/deploy/bbb-recording-editor.service /etc/systemd/system/bbb-recording-editor.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now bbb-recording-editor
   ```

4. Nginxを通さず、編集アプリ本体の起動を確認する。

   ```bash
   sudo systemctl status bbb-recording-editor --no-pager
   curl -sS -I http://127.0.0.1:8099/recording-editor/
   ```

   標準設定なら `200 OK` が返ります。再起動直後に接続できない場合は、起動ログの `WEBrick::HTTPServer#start: ... port=8099` を確認してから再実行してください。サービスが停止している場合は「起動・接続の切り分け」を参照してください。組み込み認証を別途有効にした場合は、ここでも認証が必要です。

5. 管理者専用の認証を設定する。

   **Linuxのログインユーザー・パスワードとは別です。** 以下の例では、ユーザー名 `admin` と、コマンド実行時に入力するパスワードをブラウザで使います。GreenlightアカウントやBBB会議内の「モデレーター」権限とも別の認証です。

   初回作成:

   ```bash
   sudo htpasswd -c /etc/nginx/bbb-recording-editor.htpasswd admin
   ```

   既存ファイルへのユーザー追加・パスワード変更では `-c` を付けません（`-c` はファイルを新規作成・上書きします）。

   ```bash
   sudo htpasswd /etc/nginx/bbb-recording-editor.htpasswd admin
   ```

   `htpasswd: command not found` で、aptも使えない場合は、後述のOpenSSLによる代替手順を使ってください。

   Ubuntu標準のNginx実行ユーザー `www-data` が認証ファイルを読めるようにします。Nginxの実行ユーザーを変更している場合は、グループ名を合わせてください。

   ```bash
   sudo chown root:www-data /etc/nginx/bbb-recording-editor.htpasswd
   sudo chmod 640 /etc/nginx/bbb-recording-editor.htpasswd
   ```

6. **Nginxの設定ファイルをインストールして反映する。**

   標準的なBBB構成では、既存BBBの `server` ブロックが `/etc/bigbluebutton/nginx/*.nginx` を読み込みます。リポジトリ内に `editor/deploy/nginx.conf` があるだけでは有効になりません。次のコマンドで、読み込み対象のディレクトリへ `.nginx` 拡張子で配置してください。

   ```bash
   sudo install -D -m 0644 \
     /opt/bbb-recording-editor/editor/deploy/nginx.conf \
     /etc/bigbluebutton/nginx/recording-editor.nginx

   sudo nginx -t
   ```

   `test is successful` が出てから反映します。

   ```bash
   sudo systemctl reload nginx
   ```

   独自のNginx構成でこのディレクトリを読み込んでいない場合は、公開ホストへのリクエストを処理する既存BBBの `server` ブロック内に、同梱設定を一度だけincludeしてください。すでにlocationを手動追加している場合は重複させません。同梱設定は `server` ブロックを含まないため、`/etc/nginx/conf.d/` へそのまま配置する方法は使えません。

   編集GUI、API、XML、raw素材、プレビューの全てに認証がかかります。アプリ本体は `127.0.0.1:8099` にだけbindします。

7. 公開URLの認証・接続を確認する。

   ```bash
   curl -sS -I https://<BBB-host>/recording-editor/
   curl -u admin -I https://<BBB-host>/recording-editor/
   ```

   未認証の一つ目は `401 Unauthorized` / `401 Authorization Required`、パスワードを入力する二つ目は `200 OK` が正常です。パスワードをコマンド引数に書かず、入力プロンプトで入力してください。

   ブラウザで `https://<BBB-host>/recording-editor/` を開き、手順5の認証情報を使います。まず別コピーのrawで、再生位置・スライド・音声境界・保存後の再構築結果を確認してください。

`BBB_EDITOR_RAW_ROOT`、`BBB_EDITOR_STATE_ROOT`、`BBB_EDITOR_PUBLISHED_ROOT`、`BBB_EDITOR_BUILD_ROOT`、`BBB_EDITOR_PORT` は環境変数で変更できます。URLは標準 `/recording-editor`。変更する場合はサーバの `BBB_EDITOR_PREFIX` と、ビルド時の `PUBLIC_URL` / `REACT_APP_EDITOR_PREFIX`、Nginx locationを揃えてください。

### 既存インストールの更新

画面とRuby APIの両方を変更した更新では、ビルドとサービス再起動の両方が必要です。作業ブランチをGitで取得した標準構成なら、次の手順を使います。

```bash
cd /opt/bbb-recording-editor
git pull --ff-only
npm run build:editor
# ビルドが成功したことを確認してから実行
sudo systemctl restart bbb-recording-editor
```

その後、ブラウザを再読み込みしてください。ビルドに失敗した場合は新しい画面が配信されません。手動でソースを変更していて `git pull` が拒否された場合は、変更を確認・退避してから更新してください。標準パスを使う今回の一覧表示更新では、既存のNginx設定や認証ファイルの再配置は不要です。

### aptが使えない場合

カスタムビルドのBBBでは、`bigbluebutton` メタパッケージが要求する `bbb-apps-akka` のバージョンと、導入済みのカスタム版のバージョンが一致せず、無関係なパッケージの追加もaptに拒否されることがあります。今回のgl2では、要求バージョン `2:4.0.0~rc.5+20261007T140917-git.local-build-0a2ccd433e` と、カスタム版 `0.0.4` の不一致が表示されました。

この状態で、編集アプリを入れるためだけに `apt --fix-broken install` を実行しないでください。既存のBBBパッケージを変更・削除する可能性があります。以下は、Ruby・RubyGems・OpenSSL・FFmpegがすでにある場合の代替手順です。apt全体の依存関係を修復するものではありません。

NokogiriをRubyGemsから導入します。

```bash
sudo /usr/bin/gem install nokogiri --no-document
```

WEBrickも読み込めない場合だけ、追加します（今回のgl2ではOSパッケージが導入済みでした）。

```bash
sudo /usr/bin/gem install webrick --version '~> 1.8' --no-document
```

手順2のRuby読み込み確認を実行し、状態ディレクトリも作成してください。サービスの `ExecStart=/usr/bin/ruby ...` は変更不要です。gemの導入が失敗する場合は、エラーに加えて `/usr/bin/ruby -v` と `/usr/bin/gem --version` を確認してください。

`htpasswd` がない場合は、OpenSSLでNginxの認証ファイルを作成できます。次のコマンドは、パスワード入力後、既存ファイルをバックアップして **`admin` 1名の構成に置き換えます**。既存の他のユーザーも保持したい場合は、`htpasswd` による更新手順を使ってください。

```bash
sudo sh -c '
set -e
editor_hash=$(openssl passwd -6)
editor_file=/etc/nginx/bbb-recording-editor.htpasswd
if [ -f "$editor_file" ]; then
  cp -p "$editor_file" "$editor_file.bak.$(date +%Y%m%d%H%M%S)"
fi
umask 027
printf "admin:%s\n" "$editor_hash" > "$editor_file"
chown root:www-data "$editor_file"
chmod 640 "$editor_file"
'
```

認証ファイルのパスワード更新だけならNginxのreloadは不要です。location設定の追加・変更には、手順6の設定チェックとreloadが必要です。

### 起動・接続の切り分け

アプリ本体、Nginxの振り分け、管理者認証の順に確認します。

| 症状 | 確認・対処 |
|---|---|
| localhost:8099に接続できない | サービスの状態と最新ログを確認。NokogiriのLoadErrorなら依存ライブラリを導入し、下記のreset-failedとrestartを実行 |
| 再起動直後だけcurlが接続失敗する | WEBrickの待ち受け開始ログを確認して再試行。`systemctl restart` の完了だけでは待ち受け開始を保証しない |
| 音声プレビューの `mix-*.flac` 生成が終了しない | 初版では、遅れて始まる音声と速度補正の組み合わせで先頭無音の時刻が不正になり、末尾無音生成が終了しない場合があった。修正版へ更新し、サービスを再起動して画面を再読み込みし、プレビューを再実行。修正版は無音・遅延適用後の時刻を正規化し、無音生成と出力を会議長に制限する。画質・音質は変更しない。キャッシュ識別子も変更するため、旧プレビューは再利用しない |
| localhostは200だが公開URLでGreenlightの404 | Nginxのlocationが適用されていない。設定ファイルの配置、include先、`nginx -t`、reloadを確認 |
| 認証画面が繰り返し出る／401 | LinuxやGreenlightのログイン情報ではなく、認証ファイルに作成したユーザー名・パスワードを使う |
| 認証後に403や500 | パスワード違いだけとは断定せず、Nginxとアプリの最新ログを確認。認証ファイルの存在・読み取り権限も確認 |

```bash
sudo systemctl status bbb-recording-editor --no-pager
sudo ss -lntp 'sport = :8099'
sudo journalctl -u bbb-recording-editor --since "5 minutes ago" --no-pager
```

起動失敗を繰り返して `Start request repeated too quickly` になった場合は、原因を直した後で再起動します。

```bash
sudo systemctl reset-failed bbb-recording-editor
sudo systemctl restart bbb-recording-editor
curl -sS -I http://127.0.0.1:8099/recording-editor/
```

公開URL側の問題は、次で読み込まれた設定とエラーを確認します。

```bash
sudo nginx -T 2>&1 | grep -n -C 5 -E \
  'server_name|include.*bigbluebutton/nginx|recording-editor|8099'
sudo tail -n 30 /var/log/nginx/error.log
```

ログの日時にも注意してください。gl2では、13:34のNokogiriエラーが残っていても、13:52の最新ログではWEBrickが正常起動していました。

### gl2での導入経過と、初版READMEに不足していた説明

2026-10-10、BBB 4.0のgl2で初版READMEに沿って導入し、ブラウザから編集画面へ接続できることを確認しました。録画編集・再構築の動作確認まで完了したという意味ではありません。

| 作業・つまずき | 実施した対処・結果 | 初版READMEの記載状況 |
|---|---|---|
| コード配置・編集画面ビルド・systemd設定 | READMEに沿って導入。サービスの起動ログが記録された | 記載あり |
| 公開URLでGreenlightのReact Routerによる404 | 配信HTMLがGreenlightであることを確認し、localhostのバックエンドと別に切り分けた | 切り分け手順・期待するHTTPステータスの記載なし |
| サービスがNokogiriのLoadErrorで停止 | `ruby-nokogiri` のapt導入を試したが、BBBのバージョン依存関係で失敗。RubyGemsでNokogiriを導入 | aptの必要パッケージは記載あり。aptが失敗する環境向けのRubyGems手順は記載なし |
| 連続失敗によるsystemdの起動制限と、再起動直後のcurl失敗 | `reset-failed` と `restart` を実行。最新のWEBrick起動ログを確認し、curl再実行でlocalhostが200になった | 起動確認、reset-failed、古いログとの区別の記載なし。直後のcurl失敗は起動タイミングによる可能性があるが、原因は断定していない |
| localhostは200だが公開URLでは引き続きGreenlightの404 | 同梱設定を `/etc/bigbluebutton/nginx/recording-editor.nginx` にインストールし、設定チェック・reloadで編集アプリへ振り分けた | 「locationをserverブロックに追加」とチェック・reloadは記載あり。具体的な配置先とインストールコマンドは記載なし |
| 認証情報が不明／403を表示 | Linuxログインとは別の認証であることを確認。403の具体的な原因はログでは確認されていない | `htpasswd ... admin` とGreenlight・モデレーター権限との違いは記載あり。Linuxログインとの違いは明記なし |
| `htpasswd: command not found`、`apt install htpasswd` も失敗 | OpenSSLで認証ファイルを作成し、パスワードを設定すると編集画面が動いた | `apache2-utils` とhtpasswd作成コマンドは記載あり。両者の対応、OpenSSLの代替手順、認証ファイルの権限設定は記載なし |

上記の不足を、設置手順とトラブル対処へ反映しています。技術的な参考: [BBBのNginx追加設定](https://docs.bigbluebutton.org/administration/customize/)、[Nokogiriの導入](https://nokogiri.org/tutorials/installing_nokogiri.html)、[NginxのBasic認証](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)。

## アンインストール

以下は、標準の配置先・設定ファイル名で導入した場合の手順です。配置先や環境変数を変更している場合は、削除前に `/etc/bbb-recording-editor.env` を確認してパスを合わせてください。

**アンインストールは編集内容の取り消しではありません。** 編集済みのraw `events.xml` とピー音入り素材はそのまま残ります。元の録画へ戻したい場合は、先に「現時点の制約と復旧」の手順でXMLを復旧してください。公開済み録画を変更するための再構築は、引き続き管理者が実行します。

1. 保存・プレビュー生成ジョブが終わっていることを確認し、サービスを停止・自動起動を解除する。

   ```bash
   sudo systemctl disable --now bbb-recording-editor
   ```

2. Nginxの振り分け設定を撤去する。

   `server` ブロックにlocationを直接追加した場合は、そのエディター用locationを削除してください。同梱ファイルを個別にincludeした場合は、そのinclude行も削除してください。標準の `/etc/bigbluebutton/nginx/*.nginx` による読み込みでは、include行自体は残します。

   ```bash
   sudo rm -f /etc/bigbluebutton/nginx/recording-editor.nginx
   sudo nginx -t
   ```

   `test is successful` が出てから反映します。失敗した場合は、残った個別includeなどを直して、設定チェックを再実行してください。

   ```bash
   sudo systemctl reload nginx
   ```

3. systemd設定、環境設定、専用の認証ファイルを削除する。

   認証ファイルを他のlocationでも使っている場合は、下記の認証ファイル・認証バックアップの削除コマンドを省略してください。

   ```bash
   sudo systemctl reset-failed bbb-recording-editor
   sudo rm -f /etc/systemd/system/bbb-recording-editor.service
   sudo rm -rf /etc/systemd/system/bbb-recording-editor.service.d
   sudo systemctl daemon-reload
   sudo rm -f /etc/bbb-recording-editor.env
   sudo rm -f /etc/nginx/bbb-recording-editor.htpasswd
   sudo rm -f /etc/nginx/bbb-recording-editor.htpasswd.bak.*
   ```

   `.service.d` は、独自に追加したサービスの上書き設定がある場合も撤去するためのものです。

4. アプリの配置ディレクトリを削除する。

   ```bash
   sudo rm -rf /opt/bbb-recording-editor
   ```

   ソース、`node_modules/`、`build-editor/` も削除されます。独自の変更や、このディレクトリ内に別途置いたバックアップが必要なら、先に退避してください。

5. 停止・設定撤去を確認する。

   ```bash
   sudo ss -lntp 'sport = :8099'
   sudo nginx -T 2>&1 | grep -n -E 'recording-editor|8099'
   ```

   標準ポート8099の待ち受けと、エディター用のNginx設定が残っていないことを確認します。公開URLは、既存のGreenlightなどへ渡って404になる場合があります。

### 残すデータと、任意の追加削除

通常のアンインストールでは、次のデータを残します。

| 場所 | 残す理由 |
|---|---|
| `/var/lib/bbb-recording-editor/` | 元XML・元素材のバックアップ、編集履歴、下書き、プレビュー。再導入時の編集基準や復旧に使う |
| `/var/bigbluebutton/recording/raw/` | BBBのraw録画。編集済みXML、XMLバックアップ、元の素材、ピー音入り素材を含む |
| `/var/bigbluebutton/published/` | BBBの公開済み録画 |

状態ディレクトリも不要な場合は、必要なバックアップを別の場所に保存した上で、次を実行します。`BBB_EDITOR_STATE_ROOT` を変更している場合は、その配置先に読み替えてください。

```bash
sudo rm -rf /var/lib/bbb-recording-editor
```

この削除により、再導入しても従来の編集履歴を引き継げなくなります。raw内の `bbb-editor-*` 素材は編集済み `events.xml` から参照されるため、アプリ撤去時にまとめて削除しないでください。raw・公開録画の保持や削除は、従来のBBB運用で管理してください。

Ruby、Nokogiri、WEBrick、FFmpeg、`apache2-utils` などの共用パッケージ・gemは、BBBや他のアプリでも使用する可能性があるため、この手順では削除しません。

## 開発とテスト

```bash
ruby editor/test/recording_editor_test.rb
ruby editor/test/meeting_list_test.rb
ruby editor/test/server_test.rb
CI=true npm test -- --watchAll=false --runInBand
npm run build:editor
```

音声テストは合成したWAV、映像＋AAC、OpusをFFmpegで生成します。元素材の保持、全音声の置換、映像パケットの保持、XMLイベントと時計、空区間、競合、危険な参照、認証、Range、保存ジョブを検証します。会議リストのテストでは、公開・非公開・処理中・rawなし・不明の判定、録画区間の合計、絞り込みと保存後の更新も確認します。

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
