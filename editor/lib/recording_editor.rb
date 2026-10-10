# frozen_string_literal: true

require 'nokogiri'
require 'json'
require 'digest'
require 'fileutils'
require 'open3'
require 'securerandom'
require 'time'
require 'uri'

module RecordingEditor
  class Error < StandardError
    attr_reader :status
    def initialize(message, status = 400)
      @status = status
      super(message)
    end
  end

  # All edit positions are milliseconds from the first event, NOT Unix time
  # and NOT the (trimmed/concatenated) published playback position.
  def self.ranges(value, duration)
    raise Error, '区間は配列で指定してください。' unless value.is_a?(Array) && value.size <= 500
    result = value.map do |entry|
      raise Error, '区間の形式が不正です。' unless entry.is_a?(Hash)
      a, b = entry.values_at('start_ms', 'end_ms')
      unless [a, b].all? { |n| n.is_a?(Numeric) && n.finite? } && a >= 0 && a < b && b <= duration
        raise Error, '区間は会議の範囲内で、開始 < 終了となるように指定してください。'
      end
      raise Error, '区間は1ミリ秒以上必要です。' unless b.round > a.round
      { 'start_ms' => a.round, 'end_ms' => b.round }
    end.sort_by { |r| r['start_ms'] }
    result.each_with_object([]) do |item, merged|
      if merged.last && item['start_ms'] <= merged.last['end_ms']
        merged.last['end_ms'] = [merged.last['end_ms'], item['end_ms']].max
      else
        merged << item.dup
      end
    end
  end

  def self.atomic_write(path, data, mode: 0o600)
    FileUtils.mkdir_p(File.dirname(path))
    temp = "#{path}.#{SecureRandom.hex(6)}.tmp"
    File.open(temp, File::WRONLY | File::CREAT | File::EXCL, mode) do |file|
      file.write(data)
      file.flush
      file.fsync
    end
    File.rename(temp, path)
  ensure
    FileUtils.rm_f(temp) if temp
  end

  def self.xml(data)
    raise Error, 'DTDを含むXMLは扱えません。' if data.match?(/<!DOCTYPE/i)
    doc = Nokogiri::XML(data) { |config| config.strict.nonet }
    raise Error, 'recording要素がありません。' unless doc.root&.name == 'recording'
    doc
  rescue Nokogiri::XML::SyntaxError => e
    raise Error, "events.xmlを読み込めません: #{e.message.lines.first.strip}"
  end

  def self.run(*args)
    out, err, status = Open3.capture3(*args)
    raise Error.new("メディア処理に失敗しました: #{err.lines.last(8).join.strip}", 422) unless status.success?
    out
  rescue Errno::ENOENT
    raise Error.new("実行ファイルが見つかりません: #{args.first}", 503)
  end

  class Repository
    attr_reader :raw_root, :state_root, :published_root, :prefix, :ffmpeg, :ffprobe
    def initialize(raw_root:, state_root:, published_root: '/var/bigbluebutton/published/presentation',
                   prefix: '/recording-editor', ffmpeg: 'ffmpeg', ffprobe: 'ffprobe')
      @raw_root = File.expand_path(raw_root)
      @state_root = File.expand_path(state_root)
      @published_root = File.expand_path(published_root)
      @prefix = prefix.delete_suffix('/')
      @ffmpeg, @ffprobe = ffmpeg, ffprobe
      @probes = {}
      FileUtils.mkdir_p(@state_root, mode: 0o700)
    end

    def check_id(id)
      raise Error, '会議IDの形式が不正です。' unless id.match?(/\A[a-z0-9]{40}-[0-9]{13}\z/)
      id
    end

    def raw_dir(id)
      check_id(id)
      dir = File.join(raw_root, id)
      raise Error.new('rawデータがありません。保存期限や削除状況を確認してください。', 404) unless File.directory?(dir)
      raise Error.new('rawディレクトリの参照先が不正です。', 403) unless File.realpath(dir).start_with?(File.realpath(raw_root) + '/')
      dir
    end

    def state_dir(id)
      check_id(id)
      File.join(state_root, id)
    end

    def raw_file(id, relative)
      root = raw_dir(id)
      path = File.expand_path(relative, root)
      unless path.start_with?(root + '/') && File.file?(path) && File.realpath(path).start_with?(File.realpath(root) + '/')
        raise Error.new('素材が見つからないか、参照先が不正です。', 404)
      end
      path
    end

    def file_url(id, relative)
      "#{prefix}/api/recordings/#{id}/raw/#{relative.split('/').map { |s| URI.encode_www_form_component(s).gsub('+', '%20') }.join('/')}"
    end

    def probe(path)
      stat = File.stat(path)
      key = [path, stat.size, stat.mtime.to_f]
      @probes[key] ||= JSON.parse(RecordingEditor.run(ffprobe, '-v', 'error', '-show_format', '-show_streams', '-of', 'json', path))
    end

    def recording(id)
      Recording.new(self, id)
    end

    def list(now: Time.now)
      ids = Dir.glob(File.join(raw_root, '*')).select { |p| File.directory?(p) }.map { |p| File.basename(p) }
      ids.concat(Dir.glob(File.join(published_root, '*')).select { |p| File.directory?(p) }.map { |p| File.basename(p) })
      ids.uniq.filter_map do |id|
        next unless id.match?(/\A[a-z0-9]{40}-[0-9]{13}\z/)
        # This is a list filter only; no expiry locks or retention changes.
        time = Time.at(id.split('-').last.to_i / 1000.0)
        next if time < now - 14 * 86_400 || time > now
        if File.file?(File.join(raw_root, id, 'events.xml'))
          rec = recording(id)
          { id: id, name: rec.name, date: rec.start_utc, duration_ms: rec.duration,
            raw_available: true, warnings: rec.warnings }
        else
          { id: id, name: id, date: time.iso8601, raw_available: false,
            warnings: ['rawデータがありません。'] }
        end
      rescue Error => e
        { id: id, name: id, raw_available: false, warnings: [e.message] }
      end.sort_by { |r| r[:id].split('-').last.to_i }.reverse
    end
  end

  class Recording
    attr_reader :repo, :id, :doc, :origin, :duration, :revision, :warnings, :current_doc
    STARTS = {
      'StartRecordingEvent' => ['audio', 'filename', 'StopRecordingEvent'],
      'AudioTrackPublishedEvent' => ['audio', 'filename', 'AudioTrackUnpublishedEvent'],
      'StartWebRTCShareEvent' => ['video', 'filename', 'StopWebRTCShareEvent'],
      'StartWebcamShareEvent' => ['video', 'stream', 'StopWebcamShareEvent'],
      'StartWebRTCDesktopShareEvent' => ['deskshare', 'filename', 'StopWebRTCDesktopShareEvent'],
      'DeskshareStartedEvent' => ['deskshare', 'file', 'DeskshareStoppedEvent']
    }.freeze

    def initialize(repo, id)
      @repo, @id, @warnings = repo, repo.check_id(id), []
      data = File.binread(repo.raw_file(id, 'events.xml'))
      @revision = Digest::SHA256.hexdigest(data)
      @current_doc = RecordingEditor.xml(data)
      history = history_data
      baseline = File.join(repo.state_dir(id), 'original-events.xml')
      # Original events/files remain the source for later edits, so removing or
      # moving a censor never reprocesses an already censored source.
      @doc = if history && history['revision'] == revision && File.file?(baseline)
               RecordingEditor.xml(File.binread(baseline))
             else
               warnings << '外部でevents.xmlが変更されています。編集履歴との不一致があります。' if history
               current_doc.dup
             end
      events = doc.xpath('/recording/event')
      raise Error, 'イベントがありません。' if events.empty?
      @origin = Integer(events.first['timestamp'])
      @duration = events.map { |e| Integer(e['timestamp']) }.max - origin
      raise Error, '会議の時間範囲が不正です。' unless duration.positive?
      warnings << 'イベントの時刻順が前後しています。既存イベントの順序は保存時にも維持します。' if events.each_cons(2).any? { |a, b| a['timestamp'].to_i > b['timestamp'].to_i }
    rescue Errno::ENOENT
      raise Error.new('rawデータがありません。', 404)
    rescue ArgumentError
      raise Error, 'イベントのtimestampが不正です。'
    end

    def history_data
      path = File.join(repo.state_dir(id), 'saved.json')
      File.file?(path) ? JSON.parse(File.read(path)) : nil
    end

    def name
      node = doc.at_xpath('/recording/metadata')
      node&.[]('meetingName') || node&.at_xpath('meetingName')&.text || id
    end

    def start_utc
      event = doc.at_xpath('/recording/event[timestampUTC]')
      epoch = event&.at_xpath('timestampUTC')&.text&.to_i
      (epoch && epoch.positive? ? Time.at((epoch - (event['timestamp'].to_i - origin)) / 1000.0) : Time.at(id.split('-').last.to_i / 1000.0)).utc.iso8601(3)
    end

    def time(event)
      event['timestamp'].to_i - origin
    end

    def field(event, *names)
      return nil unless event
      names.each { |n| node = event.at_xpath(n); return node.text if node }
      nil
    end

    def record_ranges(source_doc = current_doc)
      start = nil
      marks = source_doc.xpath('/recording/event[@eventname="RecordStatusEvent"]').sort_by { |e| e['timestamp'].to_i }
      return [{ 'start_ms' => 0, 'end_ms' => duration }] if marks.empty?
      marks.each_with_object([]) do |event, result|
        t = [[time(event), 0].max, duration].min
        if field(event, 'status') == 'true'
          start ||= t
        elsif start
          result << { 'start_ms' => start, 'end_ms' => t } if t > start
          start = nil
        end
      end.tap { |r| r << { 'start_ms' => start, 'end_ms' => duration } if start && start < duration }
    end

    def find_asset(kind, name)
      base = File.basename(name)
      base += '.flv' if File.extname(base).empty? && kind == 'video'
      candidates = ["#{kind}/#{base}", "#{kind}/#{id}/#{base}"]
      relative = candidates.find { |p| File.file?(File.join(repo.raw_dir(id), p)) }
      unless relative
        matches = Dir.glob(File.join(repo.raw_dir(id), kind, '**', '*')).select { |p| File.file?(p) && File.basename(p) == base }
        relative = matches.first.delete_prefix(repo.raw_dir(id) + '/') if matches.size == 1
      end
      relative
    end

    def assets
      return @assets if @assets
      @assets = []
      @unmapped_audio = []
      active = {}
      nodes = doc.xpath('/recording/event').sort_by { |e| e['timestamp'].to_i }
      nodes.each do |event|
        entry = STARTS[event['eventname']]
        if entry
          kind, key, stop_name = entry
          next unless %w[VOICE WEBCAM Deskshare bbb-webrtc-sfu].include?(event['module'])
          filename = field(event, key)
          next unless filename
          relative = find_asset(kind, filename)
          asset = { 'id' => "clip-#{@assets.size}", 'kind' => kind,
                    'filename' => filename, 'reference_field' => key,
                    'relative' => relative, 'start_ms' => [time(event), 0].max,
                    'end_ms' => duration, 'user' => field(event, 'userId', 'userid') }
          @assets << asset
          active[[stop_name, File.basename(filename)]] = asset
        else
          key = %w[filename stream file].find { |f| event.at_xpath(f) }
          if key
            asset = active.delete([event['eventname'], File.basename(field(event, key))])
            asset['end_ms'] = [time(event), duration].min if asset
          end
        end
      end
      @assets.each do |asset|
        if asset['relative']
          begin
            info = repo.probe(repo.raw_file(id, asset['relative']))
            streams = info.fetch('streams', [])
            audio = streams.find { |s| s['codec_type'] == 'audio' }
            asset['audio_count'] = streams.count { |s| s['codec_type'] == 'audio' }
            asset['has_audio'] = !audio.nil?
            asset['has_video'] = streams.any? { |s| s['codec_type'] == 'video' }
            asset['audio_codec'] = audio&.[]('codec_name')
            asset['sample_rate'] = audio&.[]('sample_rate')&.to_i
            asset['channels'] = audio&.[]('channels')
            seconds = info.dig('format', 'duration') || streams.filter_map { |s| s['duration'] }.max
            asset['file_duration_ms'] = (Float(seconds) * 1000).round if seconds
            asset['start_pts'] = Float(info.dig('format', 'start_time') || 0)
            asset['url'] = repo.file_url(id, asset['relative'])
          rescue Error, ArgumentError => e
            asset['error'] = "素材を調査できません: #{e.message}"
          end
        else
          asset['error'] = "素材がありません: #{File.basename(asset['filename'])}"
        end
        warnings << asset['error'] if asset['error']
      end
      # Files with no timing event are listed, but are never guessed into the
      # timeline or rewritten: a filename's timestamp is not a safe clock map.
      known = @assets.filter_map { |a| a['relative'] }
      %w[audio video deskshare].each do |kind|
        Dir.glob(File.join(repo.raw_dir(id), kind, '**', '*')).each do |path|
          next unless File.file?(path)
          relative = path.delete_prefix(repo.raw_dir(id) + '/')
          next if known.include?(relative) || File.basename(path).start_with?('bbb-editor-')
          warnings << "時間対応が不明な素材（加工対象外）: #{relative}"
          if %w[audio deskshare].include?(kind) && path.match?(/\.(wav|webm|opus|ogg|flac|mp4|m4a|mkv|flv)\z/i)
            begin
              @unmapped_audio << relative if repo.probe(repo.raw_file(id, relative)).fetch('streams', []).any? { |s| s['codec_type'] == 'audio' }
            rescue Error
              @unmapped_audio << relative
            end
          end
        end
      end
      @assets
    end

    def audible_assets
      assets.select { |a| %w[audio deskshare].include?(a['kind']) && a['has_audio'] && !a['error'] }
    end

    def unmapped_audio
      assets
      @unmapped_audio
    end

    def visual_events
      presentation = nil
      page = 1
      doc.xpath('/recording/event').filter_map do |event|
        type = event['eventname']
        data = { 'time_ms' => time(event), 'type' => type }
        case type
        when 'SharePresentationEvent'
          presentation = field(event, 'presentationName')
          page = 1
          data.merge!('presentation' => presentation, 'page' => page)
        when 'GotoSlideEvent'
          page = field(event, 'slide', 'id').to_i + 1
          data.merge!('presentation' => field(event, 'presentationName') || presentation, 'page' => page)
        when 'ResizeAndMoveSlideEvent'
          data['camera'] = %w[xOffset yOffset widthRatio heightRatio].to_h { |k| [k, field(event, k).to_f] }
        when 'AddTldrawShapeEvent'
          data.merge!('presentation' => field(event, 'presentation') || presentation,
                      'page' => field(event, 'pageNumber') ? field(event, 'pageNumber').to_i + 1 : page,
                      'shape_id' => field(event, 'shapeId'), 'shape' => JSON.parse(field(event, 'shapeData') || '{}'))
        when 'DeleteTldrawShapeEvent', 'UndoShapeEvent', 'UndoAnnotationEvent', 'ClearPageEvent', 'ClearWhiteboardEvent'
          data.merge!('presentation' => field(event, 'presentation') || presentation,
                      'page' => field(event, 'pageNumber') ? field(event, 'pageNumber').to_i + 1 : page,
                      'shape_id' => field(event, 'shapeId', 'shapeID', 'id'))
        when 'SendPublicChatEvent', 'PublicChatEvent'
          data.merge!('name' => field(event, 'sender', 'senderName', 'name'), 'message' => field(event, 'message'))
        when 'StartExternalVideoRecordEvent'
          data['url'] = field(event, 'externalVideoUrl', 'externalVideoURL')
        when 'UpdateExternalVideoRecordEvent'
          data.merge!('state' => field(event, 'state'), 'status' => field(event, 'status'), 'position' => field(event, 'time'), 'rate' => field(event, 'rate'))
        when 'StopExternalVideoRecordEvent', 'SetScreenshareAsContentEvent', 'SetPresentationIsOpenEvent', 'ParticipantJoinEvent', 'ParticipantLeftEvent', 'ParticipantTalkingEvent'
          data['fields'] = event.element_children.to_h { |n| [n.name, n.text] }
        else
          next
        end
        data
      rescue JSON::ParserError
        warnings << "描画イベントを読み込めません: #{time(event)}ms"
        nil
      end.sort_by { |e| e['time_ms'] }
    end

    def slides
      Dir.glob(File.join(repo.raw_dir(id), 'presentation', '**', '*')).filter_map do |path|
        next unless File.file?(path) && path.match?(/\.(svg|png|jpe?g)\z/i)
        relative = path.delete_prefix(repo.raw_dir(id) + '/')
        parts = relative.split('/')
        page = File.basename(path)[/(?:slide-?|thumb-|^)(\d+)\.(?:svg|png|jpe?g)\z/i, 1]
        next unless page
        { 'presentation' => parts[1], 'page' => page.to_i, 'relative' => relative, 'url' => repo.file_url(id, relative) }
      end.sort_by { |s| [s['presentation'], s['page'], s['relative'].end_with?('.svg') ? 0 : 1] }
    end

    def to_h
      media = assets
      events = visual_events
      history = history_data
      { id: id, name: name, start_utc: start_utc, origin_timestamp: origin, duration_ms: duration,
        revision: revision, record_ranges: record_ranges, original_record_ranges: record_ranges(doc),
        beep_ranges: history && history['revision'] == revision ? history.fetch('beep_ranges', []) : [],
        assets: media, slides: slides, events: events, warnings: warnings.uniq,
        published_url: "/playback/presentation/2.3/#{id}",
        preview_key: Digest::SHA256.hexdigest([revision, *media.filter_map { |a| a['relative'] && File.stat(repo.raw_file(id, a['relative'])).then { |s| "#{a['relative']}:#{s.size}:#{s.mtime.to_f}" } }].join('|'))[0, 24] }
    end

    def edited_xml(record_ranges, replacements = {})
      raise Error, '録画に残す区間を1つ以上指定してください。BBBは空区間を安全に扱えません。' if record_ranges.empty?
      updated = doc.dup
      old = updated.xpath('/recording/event[@eventname="RecordStatusEvent"]')
      actor = old.filter_map { |e| field(e, 'userId') }.first || field(updated.at_xpath('/recording/event[@eventname="ParticipantJoinEvent"]'), 'userId')
      actor ||= 'recording-editor'
      old.each(&:remove)
      # Keep every non-mark event in its original relative order, including
      # existing same-timestamp events and state before a retained interval.
      marks = record_ranges.flat_map { |r| [[r['start_ms'], true], [r['end_ms'], false]] }
      marks.each do |offset, enabled|
        node = Nokogiri::XML::Node.new('event', updated)
        node['timestamp'] = (origin + offset).to_s
        node['module'], node['eventname'] = 'PARTICIPANT', 'RecordStatusEvent'
        real = Time.parse(start_utc) + offset / 1000.0
        { 'date' => real.iso8601(3), 'timestampUTC' => (real.to_f * 1000).round.to_s,
          'status' => enabled.to_s, 'userId' => actor }.each do |key, value|
          child = Nokogiri::XML::Node.new(key, updated)
          child.content = value
          node.add_child(child)
        end
        before = updated.xpath('/recording/event').find { |e| e['timestamp'].to_i > origin + offset }
        before ? before.add_previous_sibling(node) : updated.root.add_child(node)
      end
      updated.xpath('/recording/event').each do |event|
        event.element_children.each do |node|
          replacement = replacements[[event['module'], event['eventname'], node.name, node.text]]
          node.content = replacement if replacement
        end
      end
      updated.to_xml
    end
  end

  class Media
    attr_reader :rec
    def initialize(rec)
      @rec = rec
    end

    # Match the legacy short WAV/Vorbis correction used by BBB Audio.render.
    # Opus and ordinary PTS gaps are kept on the event clock, never rescaled.
    def speed(asset)
      length = asset['file_duration_ms']
      span = asset['end_ms'] - asset['start_ms']
      return 1.0 unless length && span.positive?
      ratio = length.to_f / span
      legacy = File.extname(asset['relative']).downcase == '.wav' || asset['audio_codec'] == 'vorbis'
      legacy && ratio < 0.997 && (1 - ratio).abs < 0.05 ? ratio : 1.0
    end

    def preview(key)
      raise Error, 'プレビュー識別子が不正です。' unless key.match?(/\A[a-f0-9]{24}\z/)
      dir = File.join(rec.repo.state_dir(rec.id), 'preview', key)
      result = File.join(dir, 'audio.webm')
      peaks_path = File.join(dir, 'peaks.json')
      return { audio_url: "#{rec.repo.prefix}/api/recordings/#{rec.id}/preview/#{key}/audio.webm", peaks: JSON.parse(File.read(peaks_path)) } if File.file?(result) && File.file?(peaks_path)
      FileUtils.mkdir_p(dir)
      # Limit open inputs and graph size even for many LiveKit publications.
      partials = rec.audible_assets.each_slice(20).with_index.map do |batch, batch_i|
        path = File.join(dir, "mix-#{batch_i}.flac")
        command = [rec.repo.ffmpeg, '-nostdin', '-v', 'error', '-y']
        filter = []
        batch.each_with_index do |asset, i|
          command += ['-i', rec.repo.raw_file(rec.id, asset['relative'])]
          seconds = (asset['end_ms'] - asset['start_ms']) / 1000.0
          filter << "[#{i}:a:0]aresample=48000:async=1000:first_pts=0,atempo=#{speed(asset)},atrim=duration=#{seconds},apad=whole_dur=#{seconds},adelay=#{asset['start_ms']}:all=1[a#{i}]"
        end
        labels = batch.each_index.map { |i| "[a#{i}]" }.join
        filter << "#{labels}amix=inputs=#{batch.size}:duration=longest:normalize=0,apad,atrim=duration=#{rec.duration / 1000.0}[mix]"
        script = File.join(dir, "mix-#{batch_i}.filter")
        File.write(script, filter.join(';'))
        command += ['-filter_complex_script', script, '-map', '[mix]', '-ac', '2', '-c:a', 'flac', path]
        RecordingEditor.run(*command)
        path
      end
      command = [rec.repo.ffmpeg, '-nostdin', '-v', 'error', '-y']
      if partials.empty?
        command += ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
      else
        partials.each { |path| command += ['-i', path] }
        command += ['-filter_complex', "#{partials.each_index.map { |i| "[#{i}:a]" }.join}amix=inputs=#{partials.size}:normalize=0,alimiter=level=false"]
      end
      command += ['-t', (rec.duration / 1000.0).to_s, '-c:a', 'libopus', '-b:a', '96k', result]
      RecordingEditor.run(*command)
      peaks = waveform(result)
      RecordingEditor.atomic_write(peaks_path, JSON.generate(peaks))
      partials.each { |path| FileUtils.rm_f(path) }
      { audio_url: "#{rec.repo.prefix}/api/recordings/#{rec.id}/preview/#{key}/audio.webm", peaks: peaks }
    end

    def waveform(path)
      peaks = Array.new(2048, 0.0)
      samples_per_bin = [rec.duration / 1000.0 * 8000 / peaks.size, 1].max
      index = 0
      Open3.popen3(rec.repo.ffmpeg, '-nostdin', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '8000', '-f', 'f32le', '-') do |input, output, errors, wait|
        input.close
        error_reader = Thread.new { errors.read }
        while (bytes = output.read(8192))
          bytes.unpack('e*').each do |sample|
            bin = [(index / samples_per_bin).to_i, peaks.size - 1].min
            peaks[bin] = [peaks[bin], sample.abs].max
            index += 1
          end
        end
        raise Error, "波形生成に失敗しました: #{error_reader.value}" unless wait.value.success?
      end
      peaks.map { |p| p.round(4) }
    end

    def encoder(asset)
      case File.extname(asset['relative']).downcase
      when '.wav' then ['pcm_s16le', 'wav']
      when '.flac' then ['flac', 'flac']
      when '.ogg' then [asset['audio_codec'] == 'opus' ? 'libopus' : 'libvorbis', 'ogg']
      when '.opus' then ['libopus', 'opus']
      when '.webm' then [asset['audio_codec'] == 'vorbis' ? 'libvorbis' : 'libopus', 'webm']
      when '.mkv' then ['libopus', 'matroska']
      when '.mp4', '.m4a' then ['aac', 'mp4']
      when '.flv' then ['aac', 'flv']
      else raise Error, "音声加工に未対応の形式です: #{asset['relative']}"
      end
    end

    # Suppress ALL overlapping microphone/screenshare sources. Only one source
    # carries the replacement tone at a time, avoiding multiple mixed beeps.
    def carrier_ranges(beeps, assets)
      result = Hash.new { |h, k| h[k] = [] }
      beeps.each do |range|
        boundaries = [range['start_ms'], range['end_ms']]
        assets.each { |a| boundaries.concat([a['start_ms'], audible_end(a)].select { |t| t > range['start_ms'] && t < range['end_ms'] }) }
        boundaries.uniq.sort.each_cons(2) do |a, b|
          carrier = assets.find { |s| s['start_ms'] <= a && audible_end(s) >= b }
          result[carrier['id']] << { 'start_ms' => a, 'end_ms' => b } if carrier
        end
      end
      result
    end

    def audible_end(asset)
      return asset['end_ms'] unless asset['file_duration_ms']
      [asset['end_ms'], asset['start_ms'] + (asset['file_duration_ms'] / speed(asset)).round].min
    end

    def expression(ranges)
      ranges.map { |r| "gte(t,#{r['start_ms'] / 1000.0})*lt(t,#{r['end_ms'] / 1000.0})" }.join('+').then { |s| s.empty? ? '0' : s }
    end

    def local_ranges(ranges, asset)
      factor = speed(asset)
      ranges.filter_map do |range|
        a = [range['start_ms'], asset['start_ms']].max
        b = [range['end_ms'], asset['end_ms']].min
        next unless b > a
        { 'start_ms' => ((a - asset['start_ms']) * factor).round,
          'end_ms' => ((b - asset['start_ms']) * factor).round }
      end
    end

    def redact(beeps, output_dir, progress: ->(_) {})
      sources = rec.audible_assets
      unless beeps.empty?
        unavailable = rec.assets.select do |a|
          %w[audio deskshare].include?(a['kind']) && a['error'] && beeps.any? { |r| r['start_ms'] < a['end_ms'] && r['end_ms'] > a['start_ms'] }
        end
        raise Error, '指定区間に不足・破損した音声素材があります。素材の警告を確認してください。' unless unavailable.empty?
        raise Error, "時刻対応が不明な音声を安全に加工できません: #{rec.unmapped_audio.join(', ')}" unless rec.unmapped_audio.empty?
      end
      raise Error, '加工できる音声素材がありません。' if !beeps.empty? && sources.empty?
      duplicates = sources.group_by { |a| a['relative'] }.select { |_path, items| items.size > 1 }
      raise Error, '同じ素材が複数の時刻に対応しています。安全に加工できません。' if !beeps.empty? && !duplicates.empty?
      carriers = carrier_ranges(beeps, sources)
      replacements = {}
      outputs = []
      sources.each_with_index do |asset, index|
        mask = local_ranges(beeps, asset)
        next if mask.empty?
        raise Error, '複数音声トラックを含む素材の加工には未対応です。' if asset['audio_count'] != 1
        codec, format = encoder(asset)
        original = rec.repo.raw_file(rec.id, asset['relative'])
        backup = File.join(rec.repo.state_dir(rec.id), 'original-media', asset['relative'])
        FileUtils.mkdir_p(File.dirname(backup))
        FileUtils.copy_file(original, backup) unless File.file?(backup)
        # Original filenames remain present. New raw files get new references
        # in events.xml only after every output has been generated and checked.
        name = "bbb-editor-#{SecureRandom.hex(6)}-#{File.basename(original)}"
        relative = File.join(File.dirname(asset['relative']), name)
        output = File.join(output_dir, name)
        tone = local_ranges(carriers[asset['id']], asset)
        envelope = tone.map do |r|
          a, b = r.values_at('start_ms', 'end_ms').map { |t| t / 1000.0 }
          "gte(t,#{a})*lt(t,#{b})*max(0,min(1,min((t-#{a})/0.005,(#{b}-t)/0.005)))"
        end.join('+')
        envelope = '0' if envelope.empty?
        filter = "aresample=async=1000:first_pts=0,aeval=exprs='if(#{expression(mask)},0.12*sin(2*PI*1000*t)*(#{envelope}),val(ch))':c=same"
        command = [rec.repo.ffmpeg, '-nostdin', '-v', 'error', '-y', '-i', backup, '-filter_complex', "[0:a:0]#{filter}[censored]",
                   '-map', '0:v?', '-map', '[censored]', '-c:v', 'copy', '-c:a', codec]
        command += ['-ar', asset['sample_rate'].to_s] if asset['sample_rate']
        command += ['-f', format, output]
        RecordingEditor.run(*command)
        check = rec.repo.probe(output)
        new_length = Float(check.dig('format', 'duration') || 0) * 1000
        expected = asset['file_duration_ms']
        raise Error, "加工後の音声長が一致しません: #{asset['relative']}" if expected && (new_length - expected).abs > 150
        rec.doc.xpath('/recording/event').each do |event|
          possible = Recording::STARTS.select { |_name, spec| spec[0] == asset['kind'] }.flat_map { |name, spec| [name, spec[2]] }
          next unless possible.include?(event['eventname'])
          key = %w[filename file stream].find { |k| event.at_xpath(k) }
          next unless key
          value = rec.field(event, key)
          next unless File.basename(value) == File.basename(asset['filename'])
          replacements[[event['module'], event['eventname'], key, value]] = value.sub(/[^\/]+\z/, name)
        end
        outputs << { source: asset['relative'], backup: backup, staged: output, relative: relative }
        progress.call("音声加工 #{index + 1}/#{sources.size}")
      end
      [replacements, outputs]
    end
  end

  class Editor
    attr_reader :repo
    def initialize(repo)
      @repo = repo
    end

    def save(id, payload, progress: ->(_) {})
      rec = repo.recording(id)
      raise Error.new('events.xmlが変更されています。会議を読み直してください。', 409) unless payload['revision'] == rec.revision
      history = rec.history_data
      raise Error.new('外部のXML変更と編集履歴が一致しません。編集履歴を退避してから読み直してください。', 409) if history && history['revision'] != rec.revision
      records = RecordingEditor.ranges(payload['record_ranges'], rec.duration)
      raise Error, '録画に残す区間を1つ以上指定してください。BBBは空区間を安全に扱えません。' if records.empty?
      beeps = RecordingEditor.ranges(payload['beep_ranges'] || [], rec.duration)
      root = repo.state_dir(id)
      FileUtils.mkdir_p(root)
      baseline = File.join(root, 'original-events.xml')
      RecordingEditor.atomic_write(baseline, rec.doc.to_xml) unless history
      staging = File.join(root, "staging-#{SecureRandom.hex(6)}")
      FileUtils.mkdir_p(staging)
      replacements, outputs = Media.new(rec).redact(beeps, staging, progress: progress)
      xml = rec.edited_xml(records, replacements)
      current = repo.raw_file(id, 'events.xml')
      raise Error.new('処理中にevents.xmlが変更されました。保存していません。', 409) unless Digest::SHA256.file(current).hexdigest == rec.revision
      stat = File.stat(current)
      backup = "#{current}.bak.#{Time.now.utc.strftime('%Y%m%dT%H%M%S')}.#{SecureRandom.hex(3)}"
      FileUtils.copy_file(current, backup)
      outputs.each do |item|
        target = File.join(repo.raw_dir(id), item[:relative])
        File.rename(item[:staged], target)
        File.chmod(stat.mode & 0o777, target)
        File.chown(stat.uid, stat.gid, target) if Process.uid.zero?
      end
      # Write-ahead information is kept even if the XML replacement fails.
      result = { 'record_ranges' => records, 'beep_ranges' => beeps,
                 'xml_backup' => backup, 'outputs' => outputs.map { |o| o.reject { |k, _v| k == :staged } },
                 'revision' => Digest::SHA256.hexdigest(xml), 'saved_at' => Time.now.utc.iso8601 }
      revision_file = File.join(root, "edit-#{Time.now.utc.strftime('%Y%m%dT%H%M%S')}-#{SecureRandom.hex(3)}.json")
      RecordingEditor.atomic_write(revision_file, JSON.pretty_generate(result))
      RecordingEditor.atomic_write(current, xml, mode: stat.mode & 0o777)
      File.chown(stat.uid, stat.gid, current) if Process.uid.zero?
      RecordingEditor.atomic_write(File.join(root, 'saved.json'), JSON.pretty_generate(result))
      progress.call('XMLとraw音声を保存しました。録画の再構築は管理者が手動で実行してください。')
      result
    ensure
      FileUtils.rm_rf(staging) if staging
    end

    def draft(id, payload)
      rec = repo.recording(id)
      raise Error.new('events.xmlが変更されています。会議を読み直してください。', 409) unless payload['revision'] == rec.revision
      records = RecordingEditor.ranges(payload['record_ranges'], rec.duration)
      beeps = RecordingEditor.ranges(payload['beep_ranges'] || [], rec.duration)
      data = { revision: rec.revision, record_ranges: records, beep_ranges: beeps }
      RecordingEditor.atomic_write(File.join(repo.state_dir(id), 'draft.json'), JSON.pretty_generate(data))
      data
    end
  end
end
