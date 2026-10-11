# frozen_string_literal: true
require 'minitest/autorun'
require 'tmpdir'
require 'net/http'
require_relative '../server'

class ServerTest < Minitest::Test
  def setup
    @dir = Dir.mktmpdir('bbb-http-')
    @id = "#{'b' * 40}-#{(Time.now.to_f * 1000).to_i - 1000}"
    @raw = File.join(@dir, 'raw', @id)
    FileUtils.mkdir_p(File.join(@raw, 'audio'))
    @xml = '<recording><metadata meetingName="HTTP test"/><event timestamp="1000" module="PARTICIPANT" eventname="ParticipantJoinEvent"><timestampUTC>100000</timestampUTC></event><event timestamp="5000" module="MEETING" eventname="EndAndKickAllEvent"/></recording>'
    File.write(File.join(@raw, 'events.xml'), @xml)
    File.binwrite(File.join(@raw, 'audio', 'test.wav'), '0123456789')
    @repo = RecordingEditor::Repository.new(raw_root: File.join(@dir, 'raw'), state_root: File.join(@dir, 'state'), published_root: File.join(@dir, 'published'))
    @server = WEBrick::HTTPServer.new(BindAddress: '127.0.0.1', Port: 0, Logger: WEBrick::Log.new(File::NULL), AccessLog: [])
    @jobs = RecordingEditor::Jobs.new
    @server.mount('/recording-editor', RecordingEditor::Application, @repo, @jobs, File.join(@dir, 'build'), 'admin', 'test-password')
    @port = @server.listeners.first.addr[1]
    @thread = Thread.new { @server.start }
  end

  def teardown
    @server.shutdown
    @thread.join
    @jobs.instance_variable_get(:@worker).kill
    FileUtils.remove_entry(@dir)
  end

  def request(path, method: Net::HTTP::Get, auth: true, headers: {}, body: nil)
    req = method.new("/recording-editor/api/#{path}")
    req.basic_auth('admin', 'test-password') if auth
    headers.each { |key, value| req[key] = value }
    req.body = body if body
    Net::HTTP.start('127.0.0.1', @port, nil) { |http| http.request(req) }
  end

  def test_administrator_auth_covers_xml_and_raw_media
    assert_equal '401', request('recordings', auth: false).code
    assert_equal '401', request("recordings/#{@id}/raw/audio/test.wav", auth: false).code
    assert_equal '401', request("recordings/#{@id}/events.xml", auth: false).code
    assert_equal @id, JSON.parse(request('recordings').body).first['id']
  end

  def test_byte_ranges_and_head_for_browser_seeks
    response = request("recordings/#{@id}/raw/audio/test.wav", headers: { 'Range' => 'bytes=2-5' })
    assert_equal '206', response.code
    assert_equal '2345', response.body
    assert_equal 'bytes 2-5/10', response['Content-Range']
    suffix = request("recordings/#{@id}/raw/audio/test.wav", headers: { 'Range' => 'bytes=-3' })
    assert_equal '789', suffix.body
    head = request("recordings/#{@id}/raw/audio/test.wav", method: Net::HTTP::Head)
    assert_equal '10', head['Content-Length']
    assert_nil head.body
    assert_equal '416', request("recordings/#{@id}/raw/audio/test.wav", headers: { 'Range' => 'bytes=50-' }).code
  end

  def test_write_requires_editor_header_and_same_origin
    path = "recordings/#{@id}/draft"
    assert_equal '403', request(path, method: Net::HTTP::Post, body: '{}').code
    assert_equal '403', request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1', 'Origin' => 'https://elsewhere.invalid' }, body: '{}').code
    assert_equal @xml, File.read(File.join(@raw, 'events.xml'))
    path = "recordings/#{@id}/rebuild"
    assert_equal '401', request(path, method: Net::HTTP::Post, auth: false, body: '{}').code
    assert_equal '403', request(path, method: Net::HTTP::Post, body: '{}').code
    assert_equal '403', request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1', 'Origin' => 'https://elsewhere.invalid' }, body: '{}').code
    assert_equal '400', request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1' }, body: '{}').code
  end

  def test_save_job_updates_xml_without_running_rebuild
    manifest = JSON.parse(request("recordings/#{@id}").body)
    body = JSON.generate(revision: manifest['revision'], record_ranges: [{ start_ms: 500, end_ms: 3000 }], beep_ranges: [])
    queued = request("recordings/#{@id}/save", method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1', 'Content-Type' => 'application/json' }, body: body)
    assert_equal '202', queued.code
    job = JSON.parse(queued.body)
    100.times do
      job = JSON.parse(request("jobs/#{job['id']}").body)
      break if %w[done failed].include?(job['status'])
      sleep 0.01
    end
    assert_equal 'done', job['status'], job['message']
    assert File.file?(job.dig('result', 'xml_backup'))
    assert_equal [1500, 4000], RecordingEditor.xml(File.read(File.join(@raw, 'events.xml'))).xpath('/recording/event[@eventname="RecordStatusEvent"]').map { |e| e['timestamp'].to_i }
  end

  def test_reset_route_requires_auth_and_confirmation_then_restores_exact_original
    path = "recordings/#{@id}/reset"
    assert_equal '401', request(path, method: Net::HTTP::Post, auth: false, body: '{}').code
    assert_equal '403', request(path, method: Net::HTTP::Post, body: '{}').code
    assert_equal '403', request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1', 'Origin' => 'https://elsewhere.invalid' }, body: '{}').code
    assert_equal '400', request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1' }, body: '{}').code
    rec = @repo.recording(@id)
    saved = RecordingEditor::Editor.new(@repo).save(@id, { 'revision' => rec.revision, 'record_ranges' => [{ 'start_ms' => 500, 'end_ms' => 3000 }], 'beep_ranges' => [] })
    body = JSON.generate(revision: saved['revision'], confirmed: true)
    response = request(path, method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1' }, body: body)
    assert_equal '202', response.code
    job = JSON.parse(response.body)
    100.times do
      job = JSON.parse(request("jobs/#{job['id']}").body)
      break if %w[done failed].include?(job['status'])
      sleep 0.01
    end
    assert_equal 'done', job['status'], job['message']
    assert_equal 'reset', job.dig('result', 'operation')
    assert_equal @xml, File.read(File.join(@raw, 'events.xml'))
    assert_equal [], @repo.recording(@id).to_h[:beep_ranges]
  end

  def test_rebuild_route_reports_requested_and_never_marks_command_success_as_completion
    xml = @xml.sub('</recording>', '<event timestamp="2000" eventname="RecordStatusEvent"><status>true</status></event><event timestamp="4000" eventname="RecordStatusEvent"><status>false</status></event></recording>')
    File.write(File.join(@raw, 'events.xml'), xml)
    @repo.define_singleton_method(:rebuild_info) { |id| super(id).merge('available' => true) }
    Open3.stub(:capture3, ['', '', Struct.new(:success?).new(true)]) do
      body = JSON.generate(confirmed: true, revision: Digest::SHA256.hexdigest(xml))
      response = request("recordings/#{@id}/rebuild", method: Net::HTTP::Post, headers: { 'X-BBB-Editor' => '1' }, body: body)
      assert_equal '202', response.code
      job = JSON.parse(response.body)
      100.times do
        job = JSON.parse(request("jobs/#{job['id']}").body)
        break if %w[done failed].include?(job['status'])
        sleep 0.01
      end
      assert_equal 'done', job['status'], job['message']
      assert_equal 'requested', job.dig('result', 'status')
      assert_equal 'requested', JSON.parse(request("recordings/#{@id}/rebuild").body)['status']
      assert_equal xml, File.read(File.join(@raw, 'events.xml'))
    end
  end
end
