#!/usr/bin/env ruby
# frozen_string_literal: true

require 'webrick'
require 'base64'
require_relative 'lib/recording_editor'

module RecordingEditor
  # A single queue serializes media processing; this is not a retention lock.
  class Jobs
    def initialize
      @jobs, @queue, @mutex, @active = {}, Queue.new, Mutex.new, {}
      @worker = Thread.new do
        loop do
          id, key, block = @queue.pop
          update(id, status: 'running')
          begin
            result = block.call(->(message) { update(id, message: message) })
            update(id, status: 'done', result: result)
          rescue Error, StandardError => e
            warn "Recording editor: #{e.class}: #{e.message}"
            update(id, status: 'failed', message: e.message, error_status: e.respond_to?(:status) ? e.status : 500)
          ensure
            @mutex.synchronize { @active.delete(key) } if key
          end
        end
      end
    end

    def add(kind, key: nil, &block)
      id = SecureRandom.hex(12)
      @mutex.synchronize do
        raise Error.new('この会議には保存・再構築の処理が既にあります。完了を待ってください。', 409) if key && @active[key]
        @active[key] = id if key
        @jobs[id] = { id: id, kind: kind, status: 'queued', message: '処理待ちです。' }
      end
      @queue << [id, key, block]
      get(id)
    end

    def update(id, values)
      @mutex.synchronize { @jobs[id].merge!(values) }
    end

    def get(id)
      @mutex.synchronize { @jobs.fetch(id) { raise Error.new('処理が見つかりません。サーバが再起動した場合は会議を読み直してください。', 404) }.dup }
    end
  end

  class Application < WEBrick::HTTPServlet::AbstractServlet
    def initialize(server, repo, jobs, build_root, username, password)
      super(server)
      @repo, @jobs, @editor = repo, jobs, Editor.new(repo)
      @build_root, @username, @password = build_root, username, password
    end

    def service(req, res)
      res['Cache-Control'] = 'no-store'
      res['X-Content-Type-Options'] = 'nosniff'
      authenticate(req, res) if @username && !@username.empty?
      if %w[POST PUT DELETE PATCH].include?(req.request_method)
        raise Error.new('編集用のリクエストヘッダが必要です。', 403) unless req['X-BBB-Editor'] == '1'
        origin = req['Origin']
        if origin && URI.parse(origin).host != req.host
          raise Error.new('別サイトからの書き込み要求は受け付けません。', 403)
        end
      end
      path = req.path.delete_prefix(@repo.prefix)
      case path
      when '/api/recordings'
        require_method(req, 'GET')
        json(res, @repo.list)
      when %r{\A/api/jobs/([a-f0-9]{24})\z}
        require_method(req, 'GET')
        json(res, @jobs.get(Regexp.last_match(1)))
      when %r{\A/api/recordings/([^/]+)(.*)\z}
        recording_route(req, res, Regexp.last_match(1), Regexp.last_match(2))
      else
        raise Error.new('APIが見つかりません。', 404) if path.start_with?('/api/')
        require_method(req, 'GET', 'HEAD')
        static(req, res, path)
      end
    rescue Error => e
      json(res, { error: e.message }, e.status)
    rescue WEBrick::HTTPStatus::Unauthorized
      raise
    rescue StandardError => e
      warn "Recording editor request: #{e.class}: #{e.message}"
      json(res, { error: '処理に失敗しました。サーバのログを確認してください。' }, 500)
    end

    def authenticate(req, res)
      WEBrick::HTTPAuth.basic_auth(req, res, 'BBB Recording Editor') do |user, pass|
        # Hash comparisons avoid exposing password contents in log messages.
        Digest::SHA256.hexdigest(user.to_s) == Digest::SHA256.hexdigest(@username) &&
          Digest::SHA256.hexdigest(pass.to_s) == Digest::SHA256.hexdigest(@password)
      end
    end

    def require_method(req, *methods)
      raise Error.new('このHTTPメソッドは使えません。', 405) unless methods.include?(req.request_method)
    end

    def json(res, value, status = 200)
      res.status = status
      res['Content-Type'] = 'application/json; charset=utf-8'
      res.body = JSON.generate(value)
    end

    def payload(req)
      raise Error.new('リクエストが大きすぎます。', 413) if req.body.to_s.bytesize > 1_048_576
      data = JSON.parse(req.body.to_s)
      raise Error, 'JSONオブジェクトが必要です。' unless data.is_a?(Hash)
      data
    rescue JSON::ParserError
      raise Error, 'JSONが不正です。'
    end

    def recording_route(req, res, id, tail)
      @repo.check_id(id)
      case tail
      when ''
        require_method(req, 'GET')
        data = @repo.recording(id).to_h
        draft = File.join(@repo.state_dir(id), 'draft.json')
        data[:draft] = JSON.parse(File.read(draft)) if File.file?(draft)
        json(res, data)
      when '/draft'
        require_method(req, 'POST')
        json(res, @editor.draft(id, payload(req)))
      when '/save'
        require_method(req, 'POST')
        data = payload(req)
        json(res, @jobs.add('save', key: id) { |progress| @editor.save(id, data, progress: progress) }, 202)
      when '/reset'
        require_method(req, 'POST')
        data = payload(req)
        raise Error, '初期化の影響を確認してください。' unless data['confirmed'] == true
        json(res, @jobs.add('reset', key: id) { |progress| @editor.reset(id, data, progress: progress) }, 202)
      when '/rebuild'
        require_method(req, 'GET', 'POST')
        if req.request_method == 'GET'
          json(res, @repo.rebuild_info(id))
        else
          data = payload(req)
          raise Error, '再構築の影響を確認してください。' unless data['confirmed'] == true
          json(res, @jobs.add('rebuild', key: id) { |progress| @editor.rebuild(id, data, progress: progress) }, 202)
        end
      when '/preview'
        require_method(req, 'POST')
        rec = @repo.recording(id)
        key = rec.to_h[:preview_key]
        json(res, @jobs.add('preview') { |progress| progress.call('会議全体の音声と波形を生成しています。'); Media.new(rec).preview(key) }, 202)
      when '/events.xml'
        require_method(req, 'GET', 'HEAD')
        res['Content-Disposition'] = 'attachment; filename="events.xml"'
        serve_file(req, res, @repo.raw_file(id, 'events.xml'))
      when %r{\A/preview/([a-f0-9]{24})/audio\.webm\z}
        require_method(req, 'GET', 'HEAD')
        key = Regexp.last_match(1)
        serve_file(req, res, File.join(@repo.state_dir(id), 'preview', key, 'audio.webm'))
      when %r{\A/raw/(.+)\z}
        require_method(req, 'GET', 'HEAD')
        relative = Regexp.last_match(1)
        raise Error.new('この素材は配信できません。', 403) unless relative.match?(%r{\A(?:audio|video|deskshare|presentation)/}) && relative.match?(/\.(?:webm|mp4|mkv|flv|wav|ogg|opus|flac|m4a|svg|png|jpe?g)\z/i)
        # SVG may contain active content. It is shown as an image, and direct
        # navigation cannot execute scripts in the admin application's origin.
        res['Content-Security-Policy'] = "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'"
        serve_file(req, res, @repo.raw_file(id, relative))
      else
        raise Error.new('操作が見つかりません。', 404)
      end
    end

    def static(req, res, path)
      raise Error.new('npm run build:editorで編集画面をビルドしてください。', 503) unless File.directory?(@build_root)
      candidate = File.expand_path(path.delete_prefix('/'), @build_root)
      raise Error.new('参照先が不正です。', 403) unless candidate.start_with?(@build_root + '/') || candidate == @build_root
      candidate = File.join(@build_root, 'index.html') unless File.file?(candidate)
      serve_file(req, res, candidate)
    end

    def serve_file(req, res, file)
      raise Error.new('ファイルがありません。', 404) unless File.file?(file)
      types = { '.webm' => 'video/webm', '.mp4' => 'video/mp4', '.m4a' => 'audio/mp4',
                '.ogg' => 'audio/ogg', '.opus' => 'audio/ogg', '.wav' => 'audio/wav',
                '.flac' => 'audio/flac', '.svg' => 'image/svg+xml', '.js' => 'application/javascript',
                '.css' => 'text/css', '.html' => 'text/html; charset=utf-8', '.png' => 'image/png',
                '.jpg' => 'image/jpeg', '.jpeg' => 'image/jpeg', '.json' => 'application/json' }
      res['Content-Type'] = types.fetch(File.extname(file), 'application/octet-stream')
      res['Accept-Ranges'] = 'bytes'
      size = File.size(file)
      first, last = 0, size - 1
      if req['Range']
        range = /\Abytes=(\d*)-(\d*)\z/.match(req['Range'])
        raise Error.new('Rangeが不正です。', 416) unless range && !(range[1].empty? && range[2].empty?)
        if range[1].empty?
          first = [size - range[2].to_i, 0].max
        else
          first = range[1].to_i
          last = [range[2].to_i, last].min unless range[2].empty?
        end
        if first > last || first >= size
          res['Content-Range'] = "bytes */#{size}"
          raise Error.new('Rangeが範囲外です。', 416)
        end
        res.status = 206
        res['Content-Range'] = "bytes #{first}-#{last}/#{size}"
      end
      res['Content-Length'] = (last - first + 1).to_s
      return res.body = '' if req.request_method == 'HEAD'
      res.body = proc do |output|
        File.open(file, 'rb') do |io|
          io.seek(first)
          remaining = last - first + 1
          while remaining.positive? && (chunk = io.read([remaining, 65_536].min))
            output.write(chunk)
            remaining -= chunk.bytesize
          end
        end
      end
    end
  end
end

if $PROGRAM_NAME == __FILE__
  repo = RecordingEditor::Repository.new(
    raw_root: ENV.fetch('BBB_EDITOR_RAW_ROOT', '/var/bigbluebutton/recording/raw'),
    state_root: ENV.fetch('BBB_EDITOR_STATE_ROOT', '/var/lib/bbb-recording-editor'),
    published_root: ENV.fetch('BBB_EDITOR_PUBLISHED_ROOT', '/var/bigbluebutton/published/presentation'),
    unpublished_root: ENV.fetch('BBB_EDITOR_UNPUBLISHED_ROOT', '/var/bigbluebutton/unpublished/presentation'),
    process_root: ENV['BBB_EDITOR_PROCESS_ROOT'],
    status_root: ENV['BBB_EDITOR_STATUS_ROOT'],
    prefix: ENV.fetch('BBB_EDITOR_PREFIX', '/recording-editor')
  )
  username, password = ENV['BBB_EDITOR_USERNAME'], ENV['BBB_EDITOR_PASSWORD']
  abort 'BBB_EDITOR_USERNAMEとBBB_EDITOR_PASSWORDは両方設定してください。' if username.to_s.empty? != password.to_s.empty?
  server = WEBrick::HTTPServer.new(BindAddress: '127.0.0.1', Port: Integer(ENV.fetch('BBB_EDITOR_PORT', '8099')),
                                 AccessLog: [], MaxClients: 16)
  build = File.expand_path(ENV.fetch('BBB_EDITOR_BUILD_ROOT', '../build-editor'), __dir__)
  server.mount(repo.prefix, RecordingEditor::Application, repo, RecordingEditor::Jobs.new, build, username, password)
  %w[INT TERM].each { |signal| trap(signal) { server.shutdown } }
  server.start
end
