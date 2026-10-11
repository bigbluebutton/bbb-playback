# BigBlueButton raw録画エディター

`hiroshisuga/bbb-playback` の `refactor/external-video-hooks` ブランチをベースにした、管理者向け編集画面とRuby APIです。BBB 4.0を主対象として、BBB 3.0で共通する録画イベントも読み込みます。実サーバのraw録画を使った確認は、導入前に別コピーで行ってください。

## 編集できる内容

- 会議全体の時間軸上に、rawに保存されている音声、波形、スライドとTldraw描画、カメラ、画面共有、チャット・外部動画イベントを表示。
- 録画OFFの時間も含む時間軸上で、録画に残す区間とピー音区間を指定。録画に残す区間は最低1つ必要です。ドラッグ、時刻入力、元に戻す・やり直すに対応。
- `RecordStatusEvent` だけを置き換え、他の会議イベントを保持。保存ごとに元の `events.xml` をバックアップ。
- ピー音区間に重なるマイク音声と画面共有内の音声を加工。重なった音声をすべて消し、一つの音声素材に1kHzの置換音を入れる。映像ストリームは再エンコードせずコピー。
- 下書きは専用の状態ディレクトリへ保存。下書き保存ではrawを変更しない。
- 一覧は会議IDの開始日時に基づく過去14日。rawがない会議は警告する。保持期間や削除処理は変更しない。

raw保存だけでは公開済み録画は変わりません。保存後、管理者が別の「録画を再構築…」ボタンで `bbb-record --rebuild <meeting-id>` を実行できます。ボタンを有効にするには、後述の再構築専用ヘルパーの設置が必要です。自動で再構築することはありません。

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

「公開／非公開」はBBBの録画状態です。Greenlightで録画を一覧に載せるかどうかなど、Greenlight独自の表示設定は判定しません。「処理中」はファイル上の状態と、このエディターから依頼した再構築の状態に基づきます。実行中のワーカーやRedisキューを直接監視するものではありません。外部から依頼した処理は、処理ディレクトリ作成前のキュー待ちが「未生成」に見える場合があります。

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
  original-events.xml                 # 初回保存前のXMLの完全コピー
  original.json                       # 初期XML・素材のSHA-256と属性
  original-media/audio/...            # 初回保存時のraw音声・動画のコピー
  original-media/video/...
  original-media/deskshare/...
  draft.json                         # 下書き
  saved.json                         # 最新の編集内容
  edit-<UTC>-<random>.json             # 保存履歴・参照先・バックアップ先
  reset-<UTC>-<random>.json            # 初期化の進行・結果
  reset-<UTC>-<random>/                # 初期化前のXML・設定・下書き・加工素材
  preview/<key>/audio.webm            # 会議全体の混合音声
  preview/<key>/peaks.json            # 波形
```

**「rawへ保存」はXMLだけの保存ではありません。** ピー音区間があれば、重なるすべてのマイク音声・画面共有内の音声を加工してraw内に別名で追加し、XMLの素材参照を更新します。元の音声ファイルを直接上書きすることはありません。保存前の確認画面に、この音声変更・元ファイルとバックアップの保持・ウェブカム映像と外部動画サービス音声が対象外であることを表示します。下書き保存はraw音声を変更しません。

音声生成と検証が終わってから、生成素材をraw内に移動しXMLを一時ファイルからrenameして置き換えます。後からピー音区間を変更・削除するときも、初回の元XML・元素材を基準に再生成するため、前回のピー音は累積しません。ピー音を全て削除すると元の素材参照に戻ります。

XMLは読み込み時のSHA-256と保存直前のSHA-256を比較します。外部でXMLが変わっていた場合は保存を拒否します。保持期限のロックではなく、編集中の上書き競合を検知するためのものです。

生成素材は元音声のコンテナに合わせて音声を再エンコードします。圧縮音声ではピー音区間外も元とバイト単位で一致するとは限りません。元ファイルとバックアップは残ります。境界には短いフェードを入れます。無音で素材が存在しない時間には保存後のピー音も入りません。

## 同じ録画を繰り返し編集した場合の履歴

「rawへ保存」が成功するたびにXMLバックアップと編集履歴を追加します。現在のrawは最新の保存内容になりますが、過去のXMLと加工済み音声は上書き・自動削除しません。これは保存版ごとのファイル履歴であり、画面で過去の保存版を一覧表示・選択して復元する機能は未実装です。

### 1. events.xmlと編集履歴

| ファイル | 繰り返し保存した場合の扱い |
| --- | --- |
| raw内の `events.xml` | 最新の録画区間・素材参照へ置き換える。最新の1ファイルだけがBBBの再構築に使われる。 |
| raw内の `events.xml.bak.<UTC>.<random>` | 毎回、保存直前のXMLを完全コピーして別名で追加する。2回目の保存では1回目の保存結果、3回目では2回目の保存結果を保持する。 |
| 状態ディレクトリの `original-events.xml` | 初回保存前のXMLをバイト単位で完全コピーし、その後の保存・初期化でも更新しない。旧版の再出力済み基準は、内容が一致する初回XMLバックアップから元のバイト列を回収する。 |
| 状態ディレクトリの `edit-<UTC>-<random>.json` | 毎回追加する。録画区間・ピー音区間、保存後XMLのSHA-256、保存日時、XMLバックアップ先、今回の加工素材と元の音声バックアップの参照先を記録する。XML全文・音声本体は含まない。 |
| 状態ディレクトリの `saved.json` | 最新の編集内容とXMLのSHA-256で上書きする。過去版は `edit-*.json` に残る。 |
| 状態ディレクトリの `draft.json` | 下書き保存のたびに上書きする。下書きの世代別履歴は残さず、下書き保存ではraw XML・音声を変更しない。 |

例えば、初期XMLをV0、1〜3回目の保存結果をV1〜V3とすると、3回の保存成功後は次の対応になります。実際のファイル名には保存時刻とランダム値が入ります。

| 保存 | 保存直前のXMLバックアップ | 新規編集履歴が記録する保存後XML | 保存後の `events.xml` |
| --- | --- | --- | --- |
| 1回目 | V0 | V1のハッシュと編集内容 | V1 |
| 2回目 | V1 | V2のハッシュと編集内容 | V2 |
| 3回目 | V2 | V3のハッシュと編集内容 | V3 |

`edit-*.json` の `xml_backup` は**その保存の前のXML**を指し、`revision` は**その保存の後のXML**のハッシュです。同じ保存時刻のXMLバックアップと編集JSONが、そのまま同じ版を表すわけではありません。最新のV3は現在の `events.xml` にあり、次に保存するとV3のバックアップも追加されます。

2回目以降も初回の基準XMLを使い、今回指定した録画区間と素材参照からXMLを作り直します。録画開始・停止イベントは最新の区間に置き換え、他の会議イベントを保持します。エディター以外でXMLを変更し、`saved.json` のSHA-256と一致しなくなった場合は警告し、raw保存を拒否します。

画面の「元に戻す／やり直す」は、開いている画面内の区間編集に対する履歴です。元に戻す履歴は最大100段階で、会議の読み込み・raw保存成功・初期化・ページ再読み込みでリセットされます。過去のraw保存版を復元する操作ではありません。過去版の復旧は管理者がXMLバックアップと素材を確認して手動で行い、再編集する場合は編集履歴との整合も合わせてください（「現時点の制約と復旧」を参照）。

### 2. raw音声・動画

| 素材 | 繰り返し保存した場合の扱い |
| --- | --- |
| 元のマイク音声・元の画面共有ファイル | raw内の元ファイルをそのまま保持する。ピー音加工で直接上書きしない。 |
| `original-media/...` | 初回保存時にrawの `audio/`・`video/`・`deskshare/` 内のファイルをコピーし、SHA-256を記録する。2回目以降や初期化後も同じコピーを使い、上書きしない。プレゼンテーション等を含む全rawのバックアップではない。旧版では加工対象だけが保存されていたため、更新後に残存する元素材も保管する。 |
| raw内の `bbb-editor-<random>-<name>` | ピー音区間と重なる素材について、保存するたびに新しい別名ファイルを生成する。現在のXMLは今回生成した素材を参照する。過去に生成したファイルもそのまま残す。 |
| ウェブカム動画 | ピー音加工で変更・再エンコードを行わず、元のrawファイルを保持する。初回保存時に初期化用のバックアップも作る。 |
| 音声を含む画面共有動画 | ピー音が重なる場合は音声を加工し、映像ストリームを再エンコードせずコピーした新しいファイルを生成する。元の画面共有ファイルと過去の加工版も保持する。 |

ピー音入りの前回出力に、次のピー音を重ねる方式ではありません。初回の基準XMLから元素材を特定し、`original-media` の元音声バックアップを入力として、**現在指定しているピー音区間全体**を加工し直します。そのため、区間を移動・短縮・削除しても以前のピー音は累積せず、加工版を繰り返し再エンコードすることによる世代ごとの音質劣化も避けられます。ただし圧縮音声の各加工版は元素材から再エンコードするため、ピー音区間外も元ファイルとバイト単位では一致しない場合があります。

ピー音区間をすべて削除して保存すると、XMLの音声参照先は元の素材に戻り、新しい加工音声は作りません。これまで生成したピー音入りファイルは削除しません。ピー音区間が残っている場合は、録画区間だけを変更した保存やAPIから同じ内容を再保存した場合でも、該当する加工素材を新しい名前で再生成します。内容が同じ素材を再利用する重複排除処理はありません。

録画に残す区間の変更は、raw音声・動画を物理的に切り詰めたり削除したりする操作ではありません。BBBの再構築時に、最新のXMLが指定する区間と素材から再生用録画を生成します。エディター内に公開済み録画の世代別コピーは残しません。再構築は既存の再生用録画を削除・再生成します。

### raw保存と再構築の違い・ボタンの無効理由

「初期状態に戻す…」が成功した時点で、XMLと素材のrawへの復元は完了しています。変更を加えなければ「rawへ保存」を再度実行する必要はありません。構築済みのPlaybackへ反映するには、別途「録画を再構築…」を実行します。初期化後の再構築は、復元済みrawをそのまま使います。

| 操作・表示 | 意味 |
| --- | --- |
| rawへ保存 | 画面で変更した録画区間・ピー音区間をraw XMLと素材へ書き込む。変更がなく、有効な録画区間がrawにある場合はボタンを無効にする。 |
| 初期状態に戻す | 初期バックアップをrawへ復元する。これ自体がrawへの書き込みなので、再保存は不要。 |
| raw保存済み | 画面の区間編集とrawが一致する。Playbackとの一致を保証する表示ではない。 |
| 録画を再構築 | 保存済みrawからPlaybackを生成し直す。raw保存ボタンとは独立した操作。 |
| 録画への反映待ち | 保存・初期化後のrawに対応する再構築完了を、エディターがまだ確認していない。画面を再読み込みしても表示する。 |

初期XMLに有効な録画区間がない場合、画面の会議全体の区間は編集候補です。初期化はこのXMLを忠実に戻すため、再構築するには候補区間を確認してrawへ保存し、録画開始・停止イベントを追加する必要があります。この場合はraw保存を有効にし、再構築を無効にして理由を表示します。

再構築ボタンが無効な理由は、画面上に表示します。候補区間の未保存のほか、未保存の変更、BBBの処理・再構築中、または再構築専用ヘルパーがサービスから実行可能と判定されない場合があります。**raw保存だけが押せても、ヘルパーの設置状況は改善しません。** コード更新・ビルドだけではヘルパーを設置しないため、初回は「再構築ボタンの有効化」の `sudo bash editor/deploy/install-rebuild-helper.sh` が必要です。設置後にブラウザを再読み込みしてください。ヘルパーの判定は実行可能ファイルの存在確認であり、sudoやBBBコマンドの成功は実行時に検証します。

反映完了の表示は、最後の保存・初期化以降に、同じXMLのSHA-256で依頼した再構築のpresentation完了を確認した場合に限ります。エディター外で実行した再構築や公開録画の変更までは追跡しないため、未確認の状態を反映済みとは扱いません。

### 再度開いたときの状態と試聴

同じ録画を2回目以降に開くと、現在のXMLの録画区間と、XMLのSHA-256が一致する `saved.json` のピー音区間を自動的に読み込みます。**前回保存したピー音が入った状態から編集を続けられます。** 下書きは明示的に読み込むまで適用しません。保存されていない画面上の変更は再読み込みで消えます。

ブラウザでは元の会議音声に保存済み・編集中のピー音区間を重ね、「試聴にピー音を反映」を既定で有効にします。ラベルはチェックの有無で変更しません。チェックを外すと元音声を確認でき、会議を開き直すとピー音を反映した試聴へ戻ります。波形は元音声の波形であり、ピー音は別の区間表示です。前回の加工ファイルを再加工する方式ではなく、保存時には復元したピー音区間全体から新しい素材を作ります。実際のraw素材に音声が存在しない時間などでは、試聴と保存結果に差が出る場合があります。

### 完全な初期化

「初期状態に戻す…」を確認して実行すると、**このエディターで初めて保存する直前**の `events.xml` とraw音声・動画に戻します。会議収録後に別のツールで変更していた場合、その変更前まで戻す機能ではありません。

- 初期XMLはバイト単位で戻し、初回の録画区間・素材参照を復元します。初期XMLに録画区間がなくても、その状態のまま戻せます。画面では会議全体を編集候補として提示しますが、再構築するには録画区間を指定してrawへ保存する必要があります。
- 初期XMLと音声・動画のバックアップをSHA-256で検証します。欠落・破損があれば変更前に停止します。現在のXMLが読み込み時から変わった場合も拒否します。
- 初期音声・動画のうち、rawで欠落・変更されたファイルを初期バックアップから復元します。未変更のファイルはそのまま使います。
- 現在のXML、保存済み設定、下書きと、編集履歴に記録されたピー音入り加工素材を `reset-<UTC>-<random>/` に退避します。加工素材はrawから履歴ディレクトリへ移るため、古いXMLの参照先はそのままでは使えません。過去版を手動で復旧する際は、退避先の `media/<raw相対パス>` から素材も戻してください。一般の未記録ファイルを削除する処理はありません。
- 最新のピー音区間、現在の下書き、画面のUndo/Redoをリセットします。初期XML・元素材のバックアップと過去の編集JSON・XMLバックアップは保持し、初期化後に再編集しても同じ初期素材を基準に保存します。
- 保存・初期化・再構築のジョブは同じ会議で重複実行できません。再構築待ち・BBBの処理中は初期化も拒否します。初期化は `POST /api/recordings/<id>/reset` に `revision` と `confirmed: true` を渡す認証済みジョブです。

初期化だけでは公開・非公開のPlaybackは変わりません。反映には別途「録画を再構築…」が必要です。初期化前の状態や任意の過去版をGUIで選んで復元する機能は未実装です。

旧版で保存した会議は、`original-events.xml` とXML内容が一致する `events.xml.bak.*` が必要です。これがなければ初期化ボタンは使えません。バックアップ済みでない旧版の音声・動画は更新時にrawに残るものを保管するため、それ以前に外部で変更・削除された素材までは回復できません。新しい版で初めて保存する場合、初回の音声・動画のコピー分だけ容量と保存時間が増えます。

初期化中に通常の書き込みエラーが出た場合はXML・設定・素材を元の編集状態へ戻します。強制終了・電源断や、復旧自体が失敗するディスク障害では自動復旧を保証できません。`reset-*.json` の `prepared` / `completed` / `rolled_back` と退避ファイルを確認してください。

### 履歴の保持と限界

XMLバックアップ、加工素材、元素材のバックアップ、編集JSONは、このアプリからは自動削除しません。保存回数に応じて容量が増え、画面共有動画の加工版にはコピーした映像も含まれます。過去のXMLバックアップが旧加工素材を参照する場合があるため、現在のXMLから参照されていないという理由だけで旧素材を削除すると、その過去版を復旧できなくなります。

ただし、BBB自身のraw保持・削除ポリシーは変更しません。rawが削除されれば、その中のXMLバックアップ、元動画、加工素材も失われます。状態ディレクトリに編集JSONや元音声・動画のバックアップが残っていても、会議全体のraw・動画を完全に復元できる保証はありません。長期保存したい場合は、会議のrawディレクトリ全体と対応するエディターの状態ディレクトリを両方保管してください。

この説明は正常に完了した保存についてのものです。XML・メディア・履歴は複数ファイルへ書き込むため、ディスク不足やサービス停止で中断した場合には一部ファイルだけが残る可能性があります。その場合は、成功した保存として扱わず、現在のXMLのハッシュ、バックアップ、`edit-*.json`、`saved.json` と素材の存在を確認してください。

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

### 再構築ボタンの有効化（初回のみ）

通常の更新手順でコードと画面を更新した後、次を実行してください。**既存の `/etc/bbb-recording-editor.env` や認証ファイルを置き換える必要はありません。**

```bash
cd /opt/bbb-recording-editor
sudo bash editor/deploy/install-rebuild-helper.sh
```

この設置スクリプトは再構築自体を実行しません。次の専用設定を配置し、サービスを再起動します。

| 設置先 | 用途 |
| --- | --- |
| `/usr/local/sbin/bbb-recording-editor-rebuild` | root所有のPythonヘルパー。会議IDとXMLのSHA-256を検証し、1会議の `--rebuild` だけを実行 |
| `/etc/sudoers.d/bbb-recording-editor` | `bigbluebutton` ユーザーに上記ヘルパーだけのパスワード不要実行を許可 |
| `/etc/systemd/system/bbb-recording-editor.service.d/rebuild.conf` | sudoが動作するよう、このサービスの `NoNewPrivileges` をfalseに変更 |

アプリ本体は `bigbluebutton` ユーザーのまま実行します。標準サービス設定は `NoNewPrivileges=true` を維持し、ボタンを有効にする場合だけ専用drop-inで上書きします。ヘルパーはアプリのチェックアウトを参照せず、`/usr/local/sbin` にroot所有のコピーを設置します。引数は内部会議IDとXMLチェックサムの2つだけで、任意コマンド、`--rebuildall`、削除操作は受け付けません。Pythonは隔離モードで起動し、BBBコマンドへ渡す環境も固定します。

標準の `/usr/bin/bbb-record` と `/var/bigbluebutton/recording/raw` を前提にします。保存先を独自に変更した場合は、設置前にヘルパーの `RAW_ROOT` / `BBB_RECORD` を管理者が修正し、BBBの `bigbluebutton.yml` とエディターの設定と一致させてください。Python3、sudo、visudo、bbb-recordが不足すると設置を中止します。ヘルパーを更新した場合も同じ設置スクリプトを再実行します。

ブラウザを再読み込みすると「録画を再構築…」が有効になります。未設置の場合は説明付きで無効表示します。sudoやsystemdの設定が不正な場合は、実行時にエラーを表示します。

### 保存から再構築まで

1. 「rawへ保存…」で音声加工を含む保存内容を確認し、「バックアップを作成して保存」を実行する。
2. 保存成功後、「録画を再構築…」を押す。未保存の変更がある間は無効です。下書きだけを保存しても再構築に反映されません。
3. 確認画面で対象と影響を確認し、「確認して再構築を依頼」を実行する。
4. 「依頼済み」はBBBへのキュー登録が成功した状態です。再構築の完了ではありません。5秒ごとにpresentationの新しい公開完了マーカー／失敗マーカーを確認し、会議一覧も更新します。完了後、Playbackを再読み込みして音声・区間・公開状態を確認してください。

**BBBの `--rebuild` は、既存の公開・非公開の再生用録画を、インストール済みの全録画形式について削除して再生成します。** 完了まで視聴できなくなります。rawの元素材・エディターのバックアップは削除しません。非公開状態の維持は保証しません。必要なら再構築後にBBBの通常の方法で再びunpublishしてください。この影響は実行前の画面にも表示します。

保存・初期化・再構築は会議ごとに重複依頼を拒否します。再構築待ち・処理中はraw保存と初期化も拒否します。XMLの読み込み後に外部変更があれば再構築を拒否し、rootヘルパーでも実行直前にチェックサムを再検証します。外部ツールからの処理・編集・削除をロックする機能ではありません。

再構築の依頼と結果は状態ディレクトリの `rebuild-request.json` に保持するので、画面再読み込み後・APIサービス再起動後も状態確認できます。完了判定はpresentation形式の状態で、他の形式の完了を保証しません。ログはBBBの通常の処理ログと `journalctl -u bbb-recording-editor` を確認してください。コマンドエラー後でも再生用録画が削除されている場合があります。サービス停止がキュー登録の途中に重なった場合やBBBのキューから依頼が消えた場合は「依頼済み」表示が残る可能性があります。BBBが処理していないことを管理者が確認した上で、該当会議の `rebuild-request.json` を退避し、会議を開き直して再依頼してください。

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
   sudo rm -f /etc/sudoers.d/bbb-recording-editor
   sudo rm -f /usr/local/sbin/bbb-recording-editor-rebuild
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
ruby editor/test/rebuild_test.rb
python3 -B editor/test/rebuild_helper_test.py
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
- XML置き換えと履歴保存は複数ファイルの操作です。停止やディスク不足で中断した場合は、`edit-*.json`、XMLバックアップ、現在の参照先を確認してください。raw保存では自動再構築しません。再構築ボタンは別途確認して実行します。

初回状態へ戻す場合は「初期状態に戻す…」を利用できます。任意の過去版を手動で戻す場合はサービスを停止し、該当する `events.xml.bak.*` を `events.xml` に戻してください。元素材はrawに残ります。初期化で退避した加工素材を使う過去版の場合は、対応する素材もrawへ戻してください。外部でXMLを復旧・変更した後に編集を再開する場合は、その会議の状態ディレクトリも削除せず別名で退避して、新しい編集履歴を始めます。
