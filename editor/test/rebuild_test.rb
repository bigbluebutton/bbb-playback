# frozen_string_literal: true
require 'minitest/autorun'
require 'tmpdir'
require_relative '../server'

class RebuildTest < Minitest::Test
  def setup
    @dir = Dir.mktmpdir('bbb-rebuild-')
    @id = "#{'a' * 40}-1700000000000"
    @repo = RecordingEditor::Repository.new(raw_root: File.join(@dir, 'raw'), state_root: File.join(@dir, 'state'),
      published_root: File.join(@dir, 'published'), unpublished_root: File.join(@dir, 'unpublished'))
    FileUtils.mkdir_p(File.join(@repo.raw_root, @id))
    @xml = '<recording><event timestamp="1000" eventname="RecordStatusEvent"><status>true</status></event><event timestamp="5000" eventname="RecordStatusEvent"><status>false</status></event></recording>'
    File.write(File.join(@repo.raw_root, @id, 'events.xml'), @xml)
    @repo.define_singleton_method(:rebuild_info) { |id| super(id).merge('available' => true) }
    @editor = RecordingEditor::Editor.new(@repo)
    @payload = { 'confirmed' => true, 'revision' => Digest::SHA256.hexdigest(@xml) }
  end

  def teardown
    FileUtils.remove_entry(@dir)
  end

  def rebuild(status: true, error: '')
    runner = lambda do |*args|
      assert_equal ['/usr/bin/sudo', '-n', RecordingEditor::Repository::REBUILD_HELPER, @id, @payload['revision']], args
      ['', error, Struct.new(:success?).new(status)]
    end
    Open3.stub(:capture3, runner) { @editor.rebuild(@id, @payload) }
  end

  def marker(step, suffix, seconds = 1)
    name = step == 'sanity' ? "#{@id}.#{suffix}" : "#{@id}-presentation.#{suffix}"
    path = File.join(@repo.status_root, step, name)
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, '')
    time = Time.now + seconds
    File.utime(time, time, path)
    path
  end

  def test_rebuild_only_enqueues_saved_revision_and_does_not_change_raw
    result = rebuild
    assert_equal 'requested', result['status']
    assert_equal @xml, File.read(File.join(@repo.raw_root, @id, 'events.xml'))
    assert_equal @payload['revision'], result['revision']
    assert_equal 'requested', @repo.rebuild_info(@id)['status']
  end

  def test_manifest_distinguishes_raw_save_reset_and_matching_completed_rebuild
    assert_equal 'unknown', @repo.recording(@id).to_h[:playback_sync]
    rec = @repo.recording(@id)
    @editor.save(@id, { 'revision' => rec.revision, 'record_ranges' => [{ 'start_ms' => 500, 'end_ms' => 3500 }], 'beep_ranges' => [] })
    assert_equal 'needs_rebuild', @repo.recording(@id).to_h[:playback_sync]
    @payload['revision'] = @repo.recording(@id).revision
    rebuild
    marker('published', 'done')
    assert_equal 'reflected', @repo.recording(@id).to_h[:playback_sync]
    @editor.reset(@id, @payload)
    data = @repo.recording(@id).to_h
    assert_equal 'needs_rebuild', data[:playback_sync]
    assert_equal 'reset', data[:last_operation]
    assert data[:record_ranges_persisted]
    @payload['revision'] = @repo.recording(@id).revision
    # A stale completion for the same revision must not clear a newer reset.
    @repo.write_rebuild_info(@id, { 'status' => 'completed', 'revision' => @payload['revision'], 'requested_at' => (Time.now - 5).utc.iso8601(6) })
    assert_equal 'needs_rebuild', @repo.recording(@id).to_h[:playback_sync]
    rebuild
    marker('published', 'done')
    assert_equal 'reflected', @repo.recording(@id).to_h[:playback_sync]
  end

  def test_manifest_reports_candidate_ranges_and_processing_separately
    xml = '<recording><event timestamp="1000" eventname="ParticipantJoinEvent"/><event timestamp="5000" eventname="EndAndKickAllEvent"/></recording>'
    File.write(File.join(@repo.raw_root, @id, 'events.xml'), xml)
    data = @repo.recording(@id).to_h
    refute data[:record_ranges_persisted]
    assert_equal [{ 'start_ms' => 0, 'end_ms' => 4000 }], data[:record_ranges]
    dir = File.join(@repo.process_root, @id)
    FileUtils.mkdir_p(dir)
    File.write(File.join(dir, 'metadata.xml'), '<recording><state>processing</state></recording>')
    assert @repo.rebuild_info(@id)['processing']
  end

  def test_confirmation_and_current_revision_are_required_before_execution
    @payload['confirmed'] = false
    assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }
    @payload['confirmed'] = true
    @payload['revision'] = 'stale'
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }.status
    refute File.file?(File.join(@repo.state_dir(@id), 'rebuild-request.json'))
  end

  def test_unmarked_raw_cannot_be_rebuilt_using_the_full_meeting_preview_fallback
    xml = '<recording><event timestamp="1000" eventname="ParticipantJoinEvent"/><event timestamp="5000" eventname="EndAndKickAllEvent"/></recording>'
    File.write(File.join(@repo.raw_root, @id, 'events.xml'), xml)
    @payload['revision'] = Digest::SHA256.hexdigest(xml)
    assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }
  end

  def test_pending_rebuild_blocks_another_request_and_raw_save
    rebuild
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }.status
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.save(@id, @payload) }.status
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.reset(@id, @payload) }.status
    assert_equal @xml, File.read(File.join(@repo.raw_root, @id, 'events.xml'))
  end

  def test_only_fresh_completion_markers_finish_a_rebuild_and_terminal_state_is_persistent
    marker('published', 'done', -10)
    rebuild
    assert_equal 'requested', @repo.rebuild_info(@id)['status']
    path = marker('published', 'done')
    assert_equal 'completed', @repo.rebuild_info(@id)['status']
    File.unlink(path)
    assert_equal 'completed', @repo.rebuild_info(@id)['status']
  end

  def test_sanity_and_processing_failures_are_reported
    %w[sanity processed published].each do |step|
      FileUtils.rm_rf(File.join(@repo.state_dir(@id)))
      FileUtils.rm_rf(@repo.status_root)
      rebuild
      marker(step, 'fail')
      assert_equal 'failed', @repo.rebuild_info(@id)['status']
    end
  end

  def test_failed_submission_retains_failure_state_and_details
    error = assert_raises(RecordingEditor::Error) { rebuild(status: false, error: 'sudo: no new privileges') }
    assert_equal 422, error.status
    assert_includes error.message, 'no new privileges'
    assert_equal 'command_failed', @repo.rebuild_info(@id)['status']
  end

  def test_missing_helper_reports_setup_error_without_creating_request
    @repo.define_singleton_method(:rebuild_info) { |id| super(id).merge('available' => false) }
    assert_equal 503, assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }.status
    refute File.file?(File.join(@repo.state_dir(@id), 'rebuild-request.json'))
  end

  def test_already_processing_recording_is_not_modified
    path = File.join(@repo.process_root, @id, 'metadata.xml')
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, '<recording><state>processing</state></recording>')
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.rebuild(@id, @payload) }.status
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.save(@id, @payload) }.status
    assert_equal 409, assert_raises(RecordingEditor::Error) { @editor.reset(@id, @payload) }.status
  end

  def test_queue_rejects_concurrent_mutations_and_releases_key_after_failure
    jobs = RecordingEditor::Jobs.new
    gate = Queue.new
    started = Queue.new
    job = jobs.add('rebuild', key: @id) { started << true; gate.pop; raise RecordingEditor::Error, 'test failure' }
    started.pop
    assert_equal 409, assert_raises(RecordingEditor::Error) { jobs.add('save', key: @id) { nil } }.status
    gate << true
    100.times do
      break if jobs.get(job[:id])[:status] == 'failed'
      sleep 0.01
    end
    assert_equal 'failed', jobs.get(job[:id])[:status]
    assert jobs.add('save', key: @id) { nil }
  ensure
    gate << true if gate
    jobs.instance_variable_get(:@worker).kill if jobs
  end
end
